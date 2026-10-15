export function calculateRelevanceScore(sourceUser, targetUser) {
  const sameRole = sourceUser.role && targetUser.role && sourceUser.role === targetUser.role;
  const sameSpecialization =
    sourceUser.specialization && targetUser.specialization && sourceUser.specialization === targetUser.specialization;
  const sameDomainArea = sourceUser.domainArea && targetUser.domainArea && sourceUser.domainArea === targetUser.domainArea;

  let score = 40;
  if (sameDomainArea) score = 60;
  if (sameSpecialization) score = 75;
  if (sameRole) score = 90;

  let category = "low";
  if (score >= 85) category = "high";
  else if (score >= 65) category = "medium";

  return { score, category };
}

export function calculateCapabilityScore(sourceUser, targetUser) {
  const trustWeight = { unverified: 0, consistent: 10, trusted: 20, high_trust: 30 };
  const repWeight = { neutral: 0, valuable: 10, highly_valuable: 20 };
  const expMatch = sourceUser.experience && sourceUser.experience === targetUser.experience ? 20 : 8;
  const sameRole = sourceUser.role && sourceUser.role === targetUser.role ? 25 : 10;

  const score =
    Math.min(
      100,
      sameRole +
        expMatch +
        (trustWeight[sourceUser.trustTier] ?? 0) +
        (repWeight[sourceUser.exchangeReputation] ?? 0) +
        Math.min(sourceUser.successfulExchangeCount ?? 0, 15)
    );

  let category = "low";
  if (score >= 80) category = "equivalent";
  else if (score >= 60) category = "high";
  else if (score >= 40) category = "medium";

  return { score, category };
}

export function evaluateReciprocity(sourceUser, targetUser) {
  const sourceShared = sourceUser.exchangeStats?.entriesShared ?? 0;
  const targetShared = targetUser.exchangeStats?.entriesShared ?? 0;
  const baseline = Math.max(1, sourceShared + targetShared);
  const balanced = 1 - Math.abs(sourceShared - targetShared) / baseline;
  const score = Math.max(0, Math.min(100, Math.round(balanced * 100)));

  let category = "imbalanced";
  if (score >= 75) category = "balanced";
  else if (score >= 50) category = "fair";

  return { score, category };
}

export function buildContextualWarnings({ sourceUser, targetUser, relevance, capability, reciprocity }) {
  const warnings = [];

  if (relevance.score < 65) {
    warnings.push("This exchange has lower role relevance. Confirm your objectives before sharing details.");
  }

  if (capability.score < 40) {
    warnings.push("This user currently has limited verified exchange value.");
  }

  if (reciprocity.score < 50) {
    warnings.push("Reciprocity appears imbalanced. Consider requesting a reciprocal contribution.");
  }

  if ((targetUser.trustTier ?? "unverified") === "unverified") {
    warnings.push("Partner trust tier is unverified. Share sensitive information cautiously.");
  }

  return warnings;
}
