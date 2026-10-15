export function getCommunityConsistencySignals(user) {
  return {
    onboardingCompleted: Boolean(user.onboardingCompleted),
    activityConsistency: user.capabilitySignals?.activityConsistencyScore ?? 0,
    successfulExchangeCount: user.successfulExchangeCount ?? 0,
    reportCount: user.reportCount ?? 0,
    trustTier: user.trustTier ?? "unverified",
    exchangeReputation: user.exchangeReputation ?? "neutral"
  };
}

function getAccountAgeDays(user) {
  if (!user?.createdAt) return 0;
  const diff = Date.now() - new Date(user.createdAt).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

/**
 * This is intentionally lightweight (no proof uploads).
 * It uses community consistency + reputation signals to evolve:
 * not_submitted -> pending -> verified OR unverified.
 */
export function evaluateExchangeProfileVerification(user) {
  const currentStatus = user?.exchangeProfile?.verificationStatus ?? "not_submitted";
  if (currentStatus === "not_submitted") {
    return { status: "not_submitted", confidence: 0, reasons: [] };
  }

  const reportCount = user?.reportCount ?? 0;
  const abuseCount = user?.abuseIncidentCount ?? 0;
  const successfulExchanges = user?.successfulExchangeCount ?? 0;
  const trustTier = user?.trustTier ?? "unverified";
  const reputation = user?.exchangeReputation ?? "neutral";
  const accountAgeDays = getAccountAgeDays(user);

  if (abuseCount >= 1 || reportCount >= 3) {
    return {
      status: "unverified",
      confidence: 90,
      reasons: ["Reported abuse incidents or repeated peer reports."]
    };
  }

  const hasBaselineProfile =
    typeof user?.exchangeProfile?.lastJobExperience === "string" &&
    user.exchangeProfile.lastJobExperience.trim().length > 0 &&
    typeof user?.exchangeProfile?.lastInterviewExperience === "string" &&
    user.exchangeProfile.lastInterviewExperience.trim().length > 0;

  if (!hasBaselineProfile) {
    return { status: "not_submitted", confidence: 0, reasons: ["Missing required exchange profile details."] };
  }

  const trustOk = trustTier === "consistent" || trustTier === "trusted" || trustTier === "high_trust";
  const timeOk = accountAgeDays >= 7;
  const historyOk = successfulExchanges >= 1 || reputation !== "neutral";

  if (trustOk && timeOk && historyOk && reportCount === 0) {
    return {
      status: "verified",
      confidence: 75,
      reasons: ["Consistent activity and successful exchanges with no reports."]
    };
  }

  return {
    status: "pending",
    confidence: 35,
    reasons: ["Building community consistency signals."]
  };
}
