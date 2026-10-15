import { AppError } from "../../utils/appError.js";
import { invalidateDiscoveryAndMatchCaches } from "../../utils/cache.js";
import { updateLastActive } from "../activity/activity.service.js";
import { isSameDay } from "../activity/activity.utils.js";
import { User } from "../auth/auth.model.js";
import { checkAndExpireMatch } from "../match/match.service.js";
import { hasActiveMatch } from "../match/match.utils.js";
import { assignAnonUsername } from "../../utils/anonUsername.js";

const DOMAIN_VALUES = new Set(["tech", "non-tech"]);
const EXPERIENCE_VALUES = new Set([
  "student / fresher",
  "fresher",
  "beginner",
  "junior",
  "mid-level",
  "senior",
  "manager",
  "lead / head",
  "experienced"
]);
const DAILY_GOAL_VALUES = new Set([1, 2, 3]);
const AVAILABILITY_VALUES = new Set(["morning", "afternoon", "night"]);
const DASHBOARD_USER_PROJECTION = "_id role experience dailyGoal streakCount lastCheckInDate lastActiveAt status matchedUserId activeMatchExpiresAt lastMatchAt onboardingCompleted checkInHistory consistencyStreak contributionCount completedCommitments totalAcceptedCommitments reliabilityScore reliabilityLabel preparationStatus";
const DASHBOARD_PARTNER_PROJECTION = "_id role experience streakCount lastCheckInDate lastActiveAt";
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9+.#\-/&(),\s]+$/;
const MAX_ROLE_LENGTH = 80;
const MAX_TEXT_LENGTH = 80;
const MAX_LIST_ITEM_LENGTH = 60;
const MAX_LIST_SIZE = 20;

function sanitizeText(input, fieldName, { required = false, maxLength = MAX_TEXT_LENGTH } = {}) {
  const value = String(input || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!value) {
    if (required) {
      throw new AppError(`${fieldName} is required.`, 400);
    }

    return null;
  }

  if (value.length > maxLength) {
    throw new AppError(`${fieldName} must be ${maxLength} characters or fewer.`, 400);
  }

  if (!SAFE_TEXT_REGEX.test(value)) {
    throw new AppError(`${fieldName} contains invalid characters.`, 400);
  }

  return value;
}

function sanitizeStringList(input, fieldName, { required = false } = {}) {
  if (!Array.isArray(input)) {
    if (required) {
      throw new AppError(`${fieldName} is required.`, 400);
    }

    return [];
  }

  const normalized = input
    .map((item) => sanitizeText(item, fieldName, { required: false, maxLength: MAX_LIST_ITEM_LENGTH }))
    .filter(Boolean);

  const uniqueValues = [...new Set(normalized)];

  if (required && uniqueValues.length === 0) {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  if (uniqueValues.length > MAX_LIST_SIZE) {
    throw new AppError(`${fieldName} supports up to ${MAX_LIST_SIZE} selections.`, 400);
  }

  return uniqueValues;
}

function normalizeDomain(inputDomain) {
  const domain = String(inputDomain || "")
    .trim()
    .toLowerCase();

  if (!domain) {
    return "tech";
  }

  if (!DOMAIN_VALUES.has(domain)) {
    throw new AppError("Domain must be tech or non-tech.", 400);
  }

  return domain;
}

function sanitizeRole(inputRole) {
  return sanitizeText(inputRole, "Role", { required: true, maxLength: MAX_ROLE_LENGTH });
}

function normalizeDailyGoal(inputDailyGoal) {
  const parsedValue = Number(inputDailyGoal);

  if (!Number.isInteger(parsedValue) || !DAILY_GOAL_VALUES.has(parsedValue)) {
    throw new AppError("Daily goal must be one of: 1, 2, 3.", 400);
  }

  return parsedValue;
}

function normalizeAvailability(inputAvailability) {
  const availability = String(inputAvailability || "")
    .trim()
    .toLowerCase();

  if (!AVAILABILITY_VALUES.has(availability)) {
    throw new AppError("Availability must be morning, afternoon, or night.", 400);
  }

  return availability;
}

function normalizeExperience(inputExperience) {
  const experience = String(inputExperience || "")
    .trim()
    .toLowerCase();

  if (!experience) {
    throw new AppError("Experience is required.", 400);
  }

  if (!EXPERIENCE_VALUES.has(experience)) {
    throw new AppError("Invalid experience value.", 400);
  }

  return experience;
}

function normalizeOnboardingPayload(payload) {
  const hasStructuredFields =
    payload &&
    (payload.domain !== undefined ||
      payload.primaryArea !== undefined ||
      payload.area !== undefined ||
      payload.specialization !== undefined ||
      payload.skills !== undefined ||
      payload.goal !== undefined ||
      payload.availabilityFrequency !== undefined ||
      payload.availabilityTime !== undefined ||
      payload.preferences !== undefined);

  if (!hasStructuredFields) {
    const role = sanitizeRole(payload?.role);
    const experience = normalizeExperience(payload?.experience);
    const dailyGoal = normalizeDailyGoal(payload?.dailyGoal);
    const availabilityTime = normalizeAvailability(payload?.availability);

    return {
      domain: "tech",
      domainArea: "Software Development",
      primaryArea: "Software Development",
      area: null,
      specialization: role,
      role,
      experience,
      skills: [role],
      intent: "Job search",
      goal: "Job search",
      dailyGoal,
      availabilityFrequency: "Few times a week",
      availabilityTime,
      preferences: []
    };
  }

  const domain = normalizeDomain(payload?.domain);
  const role = sanitizeRole(payload?.role);
  const experience = normalizeExperience(payload?.experience);
  const dailyGoal = normalizeDailyGoal(payload?.dailyGoal);
  const availabilityTime = normalizeAvailability(payload?.availabilityTime ?? payload?.availability);
  const availabilityFrequency = sanitizeText(payload?.availabilityFrequency, "Availability frequency", {
    required: true
  });
  const specialization = sanitizeText(payload?.specialization, "Specialization", { required: true });
  const goal = sanitizeText(payload?.goal, "Goal", { required: true });
  const skills = sanitizeStringList(payload?.skills, "Skills", { required: true });
  const preferences = sanitizeStringList(payload?.preferences, "Preferences", { required: false });

  let primaryArea = null;
  let area = null;
  let domainArea = null;
  let intent = null;

  if (domain === "tech") {
    primaryArea = sanitizeText(payload?.primaryArea, "Primary area", { required: true });
    domainArea = primaryArea;
    intent = sanitizeText(payload?.intent, "Intent", { required: true });
  } else {
    area = sanitizeText(payload?.area, "Area", { required: true });
    domainArea = area;
    intent = sanitizeText(payload?.intent, "Intent", { required: false });
  }

  return {
    domain,
    domainArea,
    primaryArea,
    area,
    specialization,
    role,
    experience,
    skills,
    intent,
    goal,
    dailyGoal,
    availabilityFrequency,
    availabilityTime,
    preferences
  };
}

function serializeDashboardUser(user) {
  const totalCommitments = user.totalAcceptedCommitments ?? 0;
  const reliability = totalCommitments >= 3
    ? {
        score: user.reliabilityScore ?? null,
        label: user.reliabilityLabel ?? null
      }
    : { score: null, label: null };

  return {
    role: user.role ?? null,
    experience: user.experience ?? null,
    dailyGoal: user.dailyGoal ?? null,
    streakCount: Number(user.streakCount ?? 0),
    lastCheckInDate: user.lastCheckInDate ?? null,
    lastActiveAt: user.lastActiveAt ?? null,
    onboardingCompleted: Boolean(user.onboardingCompleted),
    consistencyStreak: Number(user.consistencyStreak ?? 0),
    contributionCount: Number(user.contributionCount ?? 0),
    reliability,
    preparationStatus: user.preparationStatus ?? "Starting Preparation"
  };
}

function serializeDashboardPartner(partner) {
  if (!partner) {
    return null;
  }

  return {
    partnerId: String(partner._id),
    partnerRole: partner.role ?? null,
    partnerExperience: partner.experience ?? null,
    partnerStreak: Number(partner.streakCount ?? 0),
    partnerLastCheckIn: partner.lastCheckInDate ?? null,
    partnerLastActive: partner.lastActiveAt ?? null
  };
}

function getTodayStatus(user) {
  const latestEntry = Array.isArray(user.checkInHistory) && user.checkInHistory.length > 0 ? user.checkInHistory[user.checkInHistory.length - 1] : null;

  if (!latestEntry?.date || !isSameDay(latestEntry.date, new Date())) {
    return "pending";
  }

  return latestEntry.status === "not_done" ? "not_done" : "done";
}

export async function completeOnboarding(userId, payload) {
  const normalized = normalizeOnboardingPayload(payload);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        domain: normalized.domain,
        domainArea: normalized.domainArea,
        primaryArea: normalized.primaryArea,
        area: normalized.area,
        specialization: normalized.specialization,
        role: normalized.role,
        experience: normalized.experience,
        skills: normalized.skills,
        intent: normalized.intent,
        goal: normalized.goal,
        dailyGoal: normalized.dailyGoal,
        availabilityFrequency: normalized.availabilityFrequency,
        availabilityTime: normalized.availabilityTime,
        availability: normalized.availabilityTime,
        preferences: normalized.preferences,
        lastActiveAt: new Date(),
        status: "waiting",
        matchedUserId: null,
        onboardingCompleted: true
      }
    },
    {
      new: true,
      runValidators: true,
      projection:
        "_id email createdAt domain domainArea primaryArea area specialization role experience skills intent goal dailyGoal availabilityFrequency availabilityTime availability status matchedUserId onboardingCompleted preferences"
    }
  ).lean();

  if (!updatedUser) {
    throw new AppError("User not found.", 404);
  }

  await invalidateDiscoveryAndMatchCaches({
    userIds: [userId],
    role: updatedUser.role
  });

  return {
    id: updatedUser._id,
    email: updatedUser.email,
    createdAt: updatedUser.createdAt,
    domain: updatedUser.domain,
    domainArea: updatedUser.domainArea,
    primaryArea: updatedUser.primaryArea,
    area: updatedUser.area,
    specialization: updatedUser.specialization,
    role: updatedUser.role,
    experience: updatedUser.experience,
    skills: updatedUser.skills ?? [],
    intent: updatedUser.intent,
    goal: updatedUser.goal,
    dailyGoal: updatedUser.dailyGoal,
    availabilityFrequency: updatedUser.availabilityFrequency,
    availabilityTime: updatedUser.availabilityTime,
    availability: updatedUser.availability,
    preferences: updatedUser.preferences ?? [],
    status: updatedUser.status,
    matchedUserId: updatedUser.matchedUserId,
    onboardingCompleted: updatedUser.onboardingCompleted
  };
}

export async function backfillDomainAreaForExistingUsers() {
  const result = await User.updateMany(
    {
      $or: [{ domainArea: { $exists: false } }, { domainArea: null }, { domainArea: "" }]
    },
    [
      {
        $set: {
          domainArea: {
            $let: {
              vars: {
                normalizedPrimaryArea: {
                  $trim: {
                    input: { $ifNull: ["$primaryArea", ""] }
                  }
                },
                normalizedArea: {
                  $trim: {
                    input: { $ifNull: ["$area", ""] }
                  }
                }
              },
              in: {
                $cond: [
                  { $gt: [{ $strLenCP: "$$normalizedPrimaryArea" }, 0] },
                  "$$normalizedPrimaryArea",
                  {
                    $cond: [
                      { $gt: [{ $strLenCP: "$$normalizedArea" }, 0] },
                      "$$normalizedArea",
                      "Unassigned"
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]
  );

  return {
    matchedCount: result.matchedCount ?? 0,
    modifiedCount: result.modifiedCount ?? 0
  };
}

/**
 * Idempotent migration: assigns an anonUsername to every user who does not have one yet.
 * Called automatically on server startup. Safe to re-run.
 */
export async function backfillAnonUsernames() {
  const usersWithoutUsername = await User.find(
    { $or: [{ anonUsername: null }, { anonUsername: { $exists: false } }] },
    { _id: 1, domain: 1 }
  ).lean();

  let successCount = 0;
  let failCount = 0;

  for (const user of usersWithoutUsername) {
    try {
      await assignAnonUsername(user._id, user.domain ?? null);
      successCount++;
    } catch {
      failCount++;
    }
  }

  return {
    total: usersWithoutUsername.length,
    successCount,
    failCount
  };
}

export async function getDashboardSnapshot(userId) {
  await checkAndExpireMatch(userId);
  await updateLastActive(userId);

  const user = await User.findById(userId).select(DASHBOARD_USER_PROJECTION).lean();

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const matchingStatus = hasActiveMatch(user) ? "matched" : "waiting";
  let partner = null;

  if (matchingStatus === "matched") {
    const matchedPartner = await User.findById(user.matchedUserId).select(DASHBOARD_PARTNER_PROJECTION).lean();
    partner = serializeDashboardPartner(matchedPartner);
  }

  return {
    user: serializeDashboardUser(user),
    todayStatus: getTodayStatus(user),
    partner,
    matching: {
      status: matchingStatus
    }
  };
}

export async function getMatchHistory(userId) {
  await checkAndExpireMatch(userId);

  const user = await User.findById(userId)
    .select("status matchedUserId activeMatchExpiresAt connections")
    .populate({
      path: "connections.userId",
      select: "role experience status"
    })
    .lean();

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const history = [];

  // Include current active match (if any)
  if (hasActiveMatch(user) && user.matchedUserId) {
    const partner = await User.findById(user.matchedUserId)
      .select("role experience status")
      .lean();

    if (partner) {
      history.push({
        userId: String(partner._id),
        role: partner.role ?? null,
        experience: partner.experience ?? null,
        status: "active"
      });
    }
  }

  // Include accepted connections (past / current)
  const connectionEntries = (user.connections ?? []).slice(0, 20);

  for (const conn of connectionEntries) {
    const connUser = conn.userId;

    if (!connUser || !connUser._id) {
      continue;
    }

    const connUserId = String(connUser._id);

    // Avoid duplicating the active match already added
    const alreadyListed = history.some((h) => h.userId === connUserId);

    if (!alreadyListed) {
      history.push({
        userId: connUserId,
        role: connUser.role ?? null,
        experience: connUser.experience ?? null,
        status: "connected"
      });
    }
  }

  return history;
}

export async function getUserProfile(userId) {
  const user = await User.findById(userId)
    .populate({
      path: "pendingMatchRequests.from",
      select: "displayName role specialization experience domainArea"
    })
    .lean();

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const pendingMatchRequests = (user.pendingMatchRequests ?? []).map((req) => {
    const fromUser = req.from;
    return {
      _id: req._id,
      from: fromUser
        ? {
            userId: String(fromUser._id),
            displayName: fromUser.displayName ?? null,
            role: fromUser.role ?? null,
            specialization: fromUser.specialization ?? null,
            experience: fromUser.experience ?? null,
            domainArea: fromUser.domainArea ?? null
          }
        : null,
      createdAt: req.createdAt
    };
  });

  return {
    id: user._id,
    email: user.email,
    createdAt: user.createdAt,
    domain: user.domain ?? null,
    domainArea: user.domainArea ?? "Unassigned",
    primaryArea: user.primaryArea ?? null,
    area: user.area ?? null,
    specialization: user.specialization ?? null,
    role: user.role ?? null,
    experience: user.experience ?? null,
    skills: user.skills ?? [],
    intent: user.intent ?? null,
    goal: user.goal ?? null,
    dailyGoal: user.dailyGoal ?? null,
    availabilityFrequency: user.availabilityFrequency ?? null,
    availabilityTime: user.availabilityTime ?? null,
    availability: user.availability ?? null,
    preferences: user.preferences ?? [],
    status: user.status ?? "waiting",
    matchedUserId: user.matchedUserId ?? null,
    onboardingCompleted: Boolean(user.onboardingCompleted),
    pendingMatchRequests
  };
}
