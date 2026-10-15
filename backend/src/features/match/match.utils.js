const RECENT_ACTIVITY_HOURS = 24;
const MATCH_LIFETIME_HOURS = 48;
const REMATCH_COOLDOWN_HOURS = 24;
const FALLBACK_MATCH_SCORE = 40;

const USER_MATCH_PROJECTION =
  "_id domain role specialization domainArea experience status matchedUserId activeMatchExpiresAt lastMatchAt onboardingCompleted lastActiveAt createdAt";

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function isPresent(value) {
  return normalizeText(value).length > 0;
}

function isSameText(left, right) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return normalizedLeft === normalizedRight;
}

export function getRecentActivityCutoff(now = new Date()) {
  return new Date(now.getTime() - RECENT_ACTIVITY_HOURS * 60 * 60 * 1000);
}

export function getMatchExpiryCutoff(now = new Date()) {
  return new Date(now.getTime() - MATCH_LIFETIME_HOURS * 60 * 60 * 1000);
}

export function getRematchCooldownCutoff(now = new Date()) {
  return new Date(now.getTime() - REMATCH_COOLDOWN_HOURS * 60 * 60 * 1000);
}

export function hasActiveMatch(user, now = new Date()) {
  if (!user?.matchedUserId || !user?.activeMatchExpiresAt) {
    return false;
  }

  return new Date(user.activeMatchExpiresAt).getTime() > now.getTime();
}

export function isExpiredMatch(user, partner, now = new Date()) {
  if (!user?.matchedUserId) {
    return false;
  }

  if (!user.activeMatchExpiresAt) {
    return true;
  }

  if (new Date(user.activeMatchExpiresAt).getTime() <= now.getTime()) {
    return true;
  }

  if (!partner?.lastActiveAt) {
    return true;
  }

  return new Date(partner.lastActiveAt).getTime() < getMatchExpiryCutoff(now).getTime();
}

export function buildGlobalCandidateFilter(userId, recentActivityCutoff) {
  return {
    _id: { $ne: userId },
    onboardingCompleted: true,
    lastActiveAt: { $gte: recentActivityCutoff },
    $or: [
      { matchedUserId: null },
      { activeMatchExpiresAt: null },
      { activeMatchExpiresAt: { $lte: recentActivityCutoff } }
    ]
  };
}

export function buildRelaxationSteps(user) {
  const steps = [];

  if (isPresent(user.role) && isPresent(user.experience)) {
    steps.push({
      score: 100,
      filter: {
        role: user.role,
        experience: user.experience
      }
    });
  }

  if (isPresent(user.role)) {
    steps.push({
      score: 90,
      filter: {
        role: user.role
      }
    });
  }

  if (isPresent(user.specialization) && isPresent(user.experience)) {
    steps.push({
      score: 80,
      filter: {
        specialization: user.specialization,
        experience: user.experience
      }
    });
  }

  if (isPresent(user.specialization)) {
    steps.push({
      score: 70,
      filter: {
        specialization: user.specialization
      }
    });
  }

  if (isPresent(user.domainArea) && isPresent(user.experience)) {
    steps.push({
      score: 60,
      filter: {
        domainArea: user.domainArea,
        experience: user.experience
      }
    });
  }

  if (isPresent(user.domainArea)) {
    steps.push({
      score: 50,
      filter: {
        domainArea: user.domainArea
      }
    });
  }

  return steps;
}

export function computeMatchScore(user, partner) {
  if (isSameText(user.role, partner.role) && isSameText(user.experience, partner.experience)) {
    return 100;
  }

  if (isSameText(user.role, partner.role)) {
    return 90;
  }

  if (isSameText(user.specialization, partner.specialization) && isSameText(user.experience, partner.experience)) {
    return 80;
  }

  if (isSameText(user.specialization, partner.specialization)) {
    return 70;
  }

  if (isSameText(user.domainArea, partner.domainArea) && isSameText(user.experience, partner.experience)) {
    return 60;
  }

  if (isSameText(user.domainArea, partner.domainArea)) {
    return 50;
  }

  return 40;
}

export function serializePartner(partner) {
  if (!partner) {
    return null;
  }

  return {
    role: partner.role ?? null,
    specialization: partner.specialization ?? null,
    experience: partner.experience ?? null,
    domainArea: partner.domainArea ?? null
  };
}

export function buildMatchedResponse(matchScore, partner) {
  return {
    matched: true,
    matchScore,
    partner: serializePartner(partner)
  };
}

export function getFallbackMatchScore() {
  return FALLBACK_MATCH_SCORE;
}

export function buildWaitingResponse() {
  return {
    matched: false,
    message: "No match found, you are in waiting pool"
  };
}

export { USER_MATCH_PROJECTION };