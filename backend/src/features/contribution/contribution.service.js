import { User } from "../auth/auth.model.js";
import { updatePreparationStatus } from "../preparation/preparation.service.js";
import { updateReliability } from "../reliability/reliability.service.js";

/**
 * Increment contribution count for a single user.
 * Also increments the relevant sub-counter based on type.
 *
 * @param {string} userId
 * @param {"mock_interview" | "exchange" | "sensitive_exchange"} type
 */
export async function incrementContribution(userId, type) {
  const inc = { contributionCount: 1 };

  if (type === "mock_interview") {
    inc.completedMockInterviews = 1;
  } else if (type === "exchange") {
    inc.completedExchanges = 1;
  } else if (type === "sensitive_exchange") {
    inc.completedSensitiveExchanges = 1;
  }

  await User.updateOne({ _id: userId }, { $inc: inc });

  // Update preparation status after contribution change (fire-and-forget)
  updatePreparationStatus(userId).catch(() => {});
}

/**
 * Increment contribution count for all participants in a list.
 * @param {string[]} userIds
 * @param {"mock_interview" | "exchange" | "sensitive_exchange"} type
 */
export async function incrementContributionForAll(userIds, type) {
  const inc = { contributionCount: 1 };

  if (type === "mock_interview") {
    inc.completedMockInterviews = 1;
  } else if (type === "exchange") {
    inc.completedExchanges = 1;
  } else if (type === "sensitive_exchange") {
    inc.completedSensitiveExchanges = 1;
  }

  await User.updateMany({ _id: { $in: userIds } }, { $inc: inc });

  // Update preparation status for each participant (fire-and-forget)
  for (const userId of userIds) {
    updatePreparationStatus(userId).catch(() => {});
  }
}

/**
 * Increment total accepted commitments for a user.
 * Called when a user accepts an exchange or mock interview.
 */
export async function incrementAcceptedCommitments(userId) {
  await User.updateOne({ _id: userId }, { $inc: { totalAcceptedCommitments: 1 } });
}

/**
 * Increment completed commitments and recalculate reliability.
 * Called when a user completes a commitment.
 */
export async function incrementCompletedCommitments(userId) {
  await User.updateOne({ _id: userId }, { $inc: { completedCommitments: 1 } });
  updateReliability(userId).catch(() => {});
}
