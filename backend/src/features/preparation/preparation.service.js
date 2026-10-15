import { User } from "../auth/auth.model.js";

const STATUS = {
  STARTING: "Starting Preparation",
  ACTIVE: "Preparing Actively",
  READY: "Interview Ready"
};

/**
 * Calculate preparation status from user progress fields.
 *
 * Interview Ready:    5+ contributions, 1+ completed mock interviews, streak >= 14
 * Preparing Actively: 1+ contributions AND streak >= 3
 * Starting Preparation: 0 contributions OR streak < 3 (default)
 *
 * @param {{ contributionCount: number, completedMockInterviews: number, consistencyStreak: number }} user
 * @returns {"Starting Preparation" | "Preparing Actively" | "Interview Ready"}
 */
export function calculatePreparationStatus(user) {
  const contributions = user.contributionCount ?? 0;
  const mockInterviews = user.completedMockInterviews ?? 0;
  const streak = user.consistencyStreak ?? 0;

  if (contributions >= 5 && mockInterviews >= 1 && streak >= 14) {
    return STATUS.READY;
  }

  if (contributions >= 1 && streak >= 3) {
    return STATUS.ACTIVE;
  }

  return STATUS.STARTING;
}

/**
 * Recalculate and persist preparation status for a user.
 * Uses lean read then targeted $set write.
 *
 * @param {string} userId
 */
export async function updatePreparationStatus(userId) {
  const user = await User.findById(userId)
    .select("_id contributionCount completedMockInterviews consistencyStreak")
    .lean();

  if (!user) {
    return;
  }

  const status = calculatePreparationStatus(user);

  await User.updateOne(
    { _id: userId },
    { $set: { preparationStatus: status } }
  );
}
