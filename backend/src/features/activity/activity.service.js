import { AppError } from "../../utils/appError.js";
import { User } from "../auth/auth.model.js";
import { calculateNextStreakCount, isSameDay } from "./activity.utils.js";
import { updatePreparationStatus } from "../preparation/preparation.service.js";
import { notifyStreakMilestone } from "../notification/notification.service.js";

const VALID_CHECKIN_STATUSES = new Set(["done", "not_done"]);

function normalizeDate(value) {
  if (value instanceof Date) {
    return value;
  }

  return new Date(value);
}

/**
 * Returns a UTC date string in YYYY-MM-DD format for calendar-day boundary tracking.
 */
function toUtcDayString(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

/**
 * Track an active day for the consistency streak.
 * Uses UTC calendar-day boundaries.
 *
 * Rules:
 *   - Same day → no streak increment
 *   - Next calendar day → increment streak
 *   - Gap > 1 day → reset streak to 1
 */
export async function trackActiveDay(userId, activeAt = new Date()) {
  const normalizedActiveAt = normalizeDate(activeAt);
  if (Number.isNaN(normalizedActiveAt.getTime())) {
    throw new AppError("Invalid activity timestamp.", 400);
  }

  const todayKey = toUtcDayString(normalizedActiveAt);

  const user = await User.findById(userId)
    .select("_id consistencyStreak lastActiveDay")
    .lean();

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  // Same calendar day — idempotent, no change needed
  if (user.lastActiveDay === todayKey) {
    return { consistencyStreak: user.consistencyStreak ?? 0, lastActiveDay: user.lastActiveDay };
  }

  let nextStreak;
  if (!user.lastActiveDay) {
    // First ever active day
    nextStreak = 1;
  } else {
    const prevDate = new Date(user.lastActiveDay + "T00:00:00Z");
    const currentDate = new Date(todayKey + "T00:00:00Z");
    const diffDays = Math.round((currentDate - prevDate) / (24 * 60 * 60 * 1000));

    if (diffDays === 1) {
      // Consecutive day
      nextStreak = (user.consistencyStreak ?? 0) + 1;
    } else {
      // Gap of > 1 day — reset
      nextStreak = 1;
    }
  }

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        consistencyStreak: nextStreak,
        lastActiveDay: todayKey
      }
    }
  );

  // Update preparation status after streak change (fire-and-forget, non-blocking)
  updatePreparationStatus(userId).catch(() => {});

  return { consistencyStreak: nextStreak, lastActiveDay: todayKey };
}

export async function updateLastActive(userId, activeAt = new Date()) {
  const normalizedActiveAt = normalizeDate(activeAt);

  if (Number.isNaN(normalizedActiveAt.getTime())) {
    throw new AppError("Invalid activity timestamp.", 400);
  }

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        lastActiveAt: normalizedActiveAt
      }
    }
  );

  return normalizedActiveAt;
}

export async function recordCheckIn(userId, status, checkedAt = new Date()) {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();

  if (!VALID_CHECKIN_STATUSES.has(normalizedStatus)) {
    throw new AppError("Invalid check-in status.", 400);
  }

  const normalizedCheckedAt = normalizeDate(checkedAt);
  if (Number.isNaN(normalizedCheckedAt.getTime())) {
    throw new AppError("Invalid check-in timestamp.", 400);
  }

  const user = await User.findById(userId)
    .select("_id lastCheckInDate streakCount checkInHistory")
    .lean();

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (user.lastCheckInDate && isSameDay(user.lastCheckInDate, normalizedCheckedAt)) {
    throw new AppError("You have already checked in today.", 409);
  }

  const nextStreakCount = calculateNextStreakCount(user, normalizedStatus, normalizedCheckedAt);

  const updateResult = await User.updateOne(
    {
      _id: userId,
      $or: [{ lastCheckInDate: null }, { lastCheckInDate: { $lt: normalizedCheckedAt } }]
    },
    {
      $set: {
        lastActiveAt: normalizedCheckedAt,
        lastCheckInDate: normalizedCheckedAt,
        streakCount: nextStreakCount
      },
      $push: {
        checkInHistory: {
          date: normalizedCheckedAt,
          status: normalizedStatus
        }
      }
    }
  );

  if (updateResult.modifiedCount === 0) {
    throw new AppError("You have already checked in today.", 409);
  }

  // Notify streak milestones (fire-and-forget)
  const STREAK_MILESTONES = new Set([3, 7, 14, 30]);
  if (normalizedStatus === "done" && STREAK_MILESTONES.has(nextStreakCount)) {
    notifyStreakMilestone(userId, nextStreakCount).catch(() => {});
  }

  return {
    lastActiveAt: normalizedCheckedAt,
    lastCheckInDate: normalizedCheckedAt,
    streakCount: nextStreakCount,
    status: normalizedStatus
  };
}
