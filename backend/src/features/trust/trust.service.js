const TRUST_POINTS = {
  unverified: 0,
  consistent: 35,
  trusted: 65,
  high_trust: 85
};

export function calculateTrustTier(user) {
  const accountAgeDays = user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000) : 0;
  const activityScore = Math.min(user.exchangeStats?.completedExchanges ?? 0, 20);
  const consistencyBonus = accountAgeDays >= 30 ? 15 : accountAgeDays >= 7 ? 8 : 0;
  const reportPenalty = Math.min((user.reportCount ?? 0) * 8 + (user.abuseIncidentCount ?? 0) * 12, 40);
  const score = Math.max(0, Math.min(100, 20 + activityScore + consistencyBonus - reportPenalty));

  if (score >= TRUST_POINTS.high_trust) return { trustTier: "high_trust", score };
  if (score >= TRUST_POINTS.trusted) return { trustTier: "trusted", score };
  if (score >= TRUST_POINTS.consistent) return { trustTier: "consistent", score };
  return { trustTier: "unverified", score };
}

export function calculateExchangeReputation(user) {
  const successful = user.successfulExchangeCount ?? 0;
  const reports = user.reportCount ?? 0;

  if (successful >= 20 && reports === 0) {
    return "highly_valuable";
  }

  if (successful >= 5 && reports <= 2) {
    return "valuable";
  }

  return "neutral";
}
