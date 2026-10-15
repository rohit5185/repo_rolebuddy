import { CACHE_DEFAULT_TTL_SECONDS, get, set } from "../../utils/cache.js";
import { logger } from "../../utils/logger.js";
import { User } from "../auth/auth.model.js";
import { getRecentActivityCutoff } from "./match.utils.js";

const CANDIDATE_PROJECTION =
  "_id displayName domain role specialization domainArea experience status matchedUserId activeMatchExpiresAt lastMatchAt onboardingCompleted lastActiveAt createdAt connections connectionRequests";

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

export function calculateMatchScore(userA, userB) {
  if (isSameText(userA.role, userB.role) && isSameText(userA.experience, userB.experience)) {
    return 100;
  }

  if (isSameText(userA.role, userB.role)) {
    return 90;
  }

  if (isSameText(userA.specialization, userB.specialization) && isSameText(userA.experience, userB.experience)) {
    return 80;
  }

  if (isSameText(userA.specialization, userB.specialization)) {
    return 70;
  }

  if (isSameText(userA.domainArea, userB.domainArea) && isSameText(userA.experience, userB.experience)) {
    return 60;
  }

  if (isSameText(userA.domainArea, userB.domainArea)) {
    return 50;
  }

  return 40;
}

function buildCanonicalFilter(user, now = new Date()) {
  return {
    _id: { $ne: user._id },
    onboardingCompleted: true,
    lastActiveAt: { $gte: getRecentActivityCutoff(now) },
    $or: [
      { matchedUserId: null },
      { activeMatchExpiresAt: null },
      { activeMatchExpiresAt: { $lte: now } }
    ]
  };
}

async function resolveDomainFilter(user, canonicalFilter) {
  if (!isPresent(user.domain)) {
    return {};
  }

  const hasSameDomainCandidate = await User.exists({
    ...canonicalFilter,
    domain: user.domain
  });

  if (!hasSameDomainCandidate) {
    return {};
  }

  return {
    domain: user.domain
  };
}

export async function getMatchCandidates(user, options = {}) {
  const now = options.now ?? new Date();
  const canonicalFilter = buildCanonicalFilter(user, now);
  const domainFilter = await resolveDomainFilter(user, canonicalFilter);
  const extraFilter = options.additionalFilter ?? {};

  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 200;
  const projection = options.projection ?? CANDIDATE_PROJECTION;

  return User.find({
    ...canonicalFilter,
    ...domainFilter,
    ...extraFilter
  })
    .select(projection)
    .sort({ lastActiveAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();
}

async function rankMatchCandidates(user, options = {}) {
  const candidates = await getMatchCandidates(user, options);

  return candidates
    .map((candidate) => ({
      candidate,
      matchScore: calculateMatchScore(user, candidate)
    }))
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }

      const leftActive = left.candidate.lastActiveAt ? new Date(left.candidate.lastActiveAt).getTime() : 0;
      const rightActive = right.candidate.lastActiveAt ? new Date(right.candidate.lastActiveAt).getTime() : 0;
      return rightActive - leftActive;
    });
}

export async function getRankedMatches(user, options = {}) {
  const userId = String(user?._id ?? "");
  if (!userId) {
    return rankMatchCandidates(user, options);
  }

  const cacheKey = `match:candidates:${userId}`;
  const cached = await get(cacheKey);
  if (cached !== null) {
    logger.debug({ cacheKey, cacheHit: true }, "Cache hit");
    return cached;
  }

  const fresh = await rankMatchCandidates(user, options);
  await set(cacheKey, fresh, CACHE_DEFAULT_TTL_SECONDS);
  logger.debug({ cacheKey, cacheHit: false }, "Cache miss");
  return fresh;
}
