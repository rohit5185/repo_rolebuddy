import { User } from "../auth/auth.model.js";

const MIN_COMMITMENTS_FOR_LABEL = 3;
const HIGH_RELIABILITY_THRESHOLD = 90;
const RELIABLE_THRESHOLD = 80;

/**
 * Calculate reliability score (0–100) from user counters.
 * Returns null when insufficient data (under 3 total commitments).
 *
 * @param {{ completedCommitments: number, totalAcceptedCommitments: number }} user
 * @returns {{ score: number | null, label: string | null }}
 */
export function calculateReliability(user) {
  const total = user.totalAcceptedCommitments ?? 0;
  const completed = user.completedCommitments ?? 0;

  if (total < MIN_COMMITMENTS_FOR_LABEL) {
    return { score: null, label: null };
  }

  const score = Math.round((completed / total) * 100);
  const label = getReliabilityLabel(score, total);

  return { score, label };
}

/**
 * Return public reliability label based on score.
 * Under 3 commitments or score below 80 → null (no public label).
 *
 * @param {number} score
 * @param {number} totalCommitments
 * @returns {string | null}
 */
export function getReliabilityLabel(score, totalCommitments) {
  if (totalCommitments < MIN_COMMITMENTS_FOR_LABEL) {
    return null;
  }

  if (score >= HIGH_RELIABILITY_THRESHOLD) {
    return "Highly Reliable";
  }

  if (score >= RELIABLE_THRESHOLD) {
    return "Reliable";
  }

  return null;
}

/**
 * Recalculate and persist reliability score + label for a user.
 * Uses lean read then targeted $set write.
 *
 * @param {string} userId
 */
export async function updateReliability(userId) {
  const user = await User.findById(userId)
    .select("_id completedCommitments totalAcceptedCommitments")
    .lean();

  if (!user) {
    return;
  }

  const { score, label } = calculateReliability(user);

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        reliabilityScore: score,
        reliabilityLabel: label
      }
    }
  );
}
