import { AppError } from "../../utils/appError.js";
import { CACHE_DEFAULT_TTL_SECONDS, get, set } from "../../utils/cache.js";
import { logger } from "../../utils/logger.js";
import { User } from "../auth/auth.model.js";
import { calculateMatchScore } from "../match/match.engine.js";

const MAX_QUERY_LENGTH = 50;
const MAX_ROLE_LENGTH = 80;
const MAX_SAMPLE_USERS = 10;
const DEFAULT_ROLE_LIMIT = 25;
const ACTIVE_WINDOW_HOURS = 24;
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9+\-_. ]+$/;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeInput(value) {
  return String(value ?? "").trim();
}

function assertSafeInput(value, fieldName, maxLength) {
  if (!value) {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  if (value.length > maxLength) {
    throw new AppError(`${fieldName} is too long.`, 400);
  }

  if (!SAFE_TEXT_REGEX.test(value)) {
    throw new AppError(`${fieldName} contains invalid characters.`, 400);
  }
}

function buildRoleBaseMatch() {
  return {
    onboardingCompleted: true,
    role: {
      $type: "string",
      $ne: null
    }
  };
}

function buildActiveRoleMatch(roleName) {
  const roleMatcher = new RegExp(`^${escapeRegex(roleName)}$`, "i");
  const recentThreshold = new Date(Date.now() - ACTIVE_WINDOW_HOURS * 60 * 60 * 1000);

  return {
    ...buildRoleBaseMatch(),
    role: { $regex: roleMatcher },
    lastActiveAt: { $gte: recentThreshold }
  };
}

function roleCacheKey(roleName) {
  return String(roleName ?? "")
    .trim()
    .toLowerCase();
}

async function withCache(cacheKey, loader, ttlSeconds = CACHE_DEFAULT_TTL_SECONDS) {
  const cached = await get(cacheKey);
  if (cached !== null) {
    logger.debug({ cacheKey, cacheHit: true }, "Cache hit");
    return cached;
  }

  const fresh = await loader();
  await set(cacheKey, fresh, ttlSeconds);
  logger.debug({ cacheKey, cacheHit: false }, "Cache miss");
  return fresh;
}

async function searchRoleAggregatesUncached(rawQuery, domain = null) {
  const query = normalizeInput(rawQuery);

  if (query.length > MAX_QUERY_LENGTH) {
    throw new AppError("Search query is too long.", 400);
  }

  if (query && !SAFE_TEXT_REGEX.test(query)) {
    throw new AppError("Search query contains invalid characters.", 400);
  }

  const now = Date.now();
  const recentThreshold = new Date(now - ACTIVE_WINDOW_HOURS * 60 * 60 * 1000);

  const baseMatch = {
    ...buildRoleBaseMatch(),
    ...(domain ? { domain } : {})
  };

  const pipeline = [
    { $match: baseMatch },
    {
      $project: {
        normalizedRole: {
          $trim: {
            input: "$role"
          }
        },
        normalizedRoleLower: {
          $toLower: {
            $trim: {
              input: "$role"
            }
          }
        },
        status: 1,
        lastActiveAt: 1
      }
    },
    {
      $match: {
        normalizedRole: { $ne: "" }
      }
    }
  ];

  if (query) {
    pipeline.push({
      $match: {
        normalizedRole: {
          $regex: escapeRegex(query),
          $options: "i"
        }
      }
    });
  }

  pipeline.push(
    {
      $group: {
        _id: "$normalizedRoleLower",
        role: { $first: "$normalizedRole" },
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: {
            $cond: [{ $gte: ["$lastActiveAt", recentThreshold] }, 1, 0]
          }
        },
        waitingUsers: {
          $sum: {
            $cond: [{ $eq: ["$status", "waiting"] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        role: 1,
        totalUsers: 1,
        activeUsers: 1,
        waitingUsers: 1
      }
    },
    { $sort: { totalUsers: -1, role: 1 } },
    { $limit: DEFAULT_ROLE_LIMIT }
  );

  return User.aggregate(pipeline);
}

export async function searchRoleAggregates(rawQuery, domain = null) {
  const query = normalizeInput(rawQuery);
  const domainKey = domain ?? "all";
  const cacheKey = `discovery:roles:${query}:${domainKey}`;

  return withCache(cacheKey, () => searchRoleAggregatesUncached(rawQuery, domain));
}

async function getRoleSampleUsersUncached(rawRoleName) {
  const roleName = normalizeInput(rawRoleName);
  assertSafeInput(roleName, "Role name", MAX_ROLE_LENGTH);

  const recentThreshold = new Date(Date.now() - ACTIVE_WINDOW_HOURS * 60 * 60 * 1000);

  const users = await User.find(buildActiveRoleMatch(roleName))
    .sort({ lastActiveAt: -1, createdAt: -1 })
    .limit(MAX_SAMPLE_USERS)
    .select("role experience dailyGoal status lastActiveAt matchedUserId activeMatchExpiresAt reliabilityLabel contributionCount totalAcceptedCommitments")
    .lean();

  return {
    role: roleName,
    users: users.map((u) => ({
      experience: u.experience ?? null,
      dailyGoal: u.dailyGoal ?? null,
      status: u.status ?? "waiting",
      reliabilityLabel: (u.totalAcceptedCommitments ?? 0) >= 3 ? (u.reliabilityLabel ?? null) : null,
      contributionCount: Number(u.contributionCount ?? 0),
      activeRecently: u.lastActiveAt ? new Date(u.lastActiveAt) >= recentThreshold : false
    }))
  };
}

export async function getRoleSampleUsers(rawRoleName) {
  const roleName = normalizeInput(rawRoleName);
  assertSafeInput(roleName, "Role name", MAX_ROLE_LENGTH);
  const cacheKey = `discovery:role:${roleCacheKey(roleName)}`;

  return withCache(cacheKey, () => getRoleSampleUsersUncached(rawRoleName));
}

async function getRoleSampleUsersForViewerUncached(viewerId, rawRoleName) {
  const roleName = normalizeInput(rawRoleName);
  assertSafeInput(roleName, "Role name", MAX_ROLE_LENGTH);

  const viewer = await User.findById(viewerId)
    .select("_id domain role specialization domainArea experience matchedUserId activeMatchExpiresAt connections connectionRequests onboardingCompleted")
    .lean();

  if (!viewer) {
    throw new AppError("User not found.", 404);
  }

  if (!viewer.onboardingCompleted) {
    throw new AppError("Complete onboarding first.", 400);
  }

  const candidates = await User.find({
    ...buildActiveRoleMatch(roleName),
    _id: { $ne: viewer._id }
  })
    .select("role experience dailyGoal status lastActiveAt createdAt matchedUserId activeMatchExpiresAt specialization domainArea reliabilityLabel contributionCount totalAcceptedCommitments")
    .sort({ lastActiveAt: -1, createdAt: -1 })
    .limit(MAX_SAMPLE_USERS * 8)
    .lean();

  const recentThreshold = new Date(Date.now() - ACTIVE_WINDOW_HOURS * 60 * 60 * 1000);

  const users = candidates
    .map((candidate) => ({
      experience: candidate.experience ?? null,
      dailyGoal: candidate.dailyGoal ?? null,
      status: candidate.status ?? "waiting",
      matchScore: calculateMatchScore(viewer, candidate),
      lastActiveAt: candidate.lastActiveAt ?? null,
      reliabilityLabel: (candidate.totalAcceptedCommitments ?? 0) >= 3 ? (candidate.reliabilityLabel ?? null) : null,
      contributionCount: Number(candidate.contributionCount ?? 0),
      activeRecently: candidate.lastActiveAt ? new Date(candidate.lastActiveAt) >= recentThreshold : false
    }))
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }

      const leftActive = left.lastActiveAt ? new Date(left.lastActiveAt).getTime() : 0;
      const rightActive = right.lastActiveAt ? new Date(right.lastActiveAt).getTime() : 0;
      return rightActive - leftActive;
    })
    .slice(0, MAX_SAMPLE_USERS)
    .map((item) => ({
      experience: item.experience,
      dailyGoal: item.dailyGoal,
      status: item.status,
      matchScore: item.matchScore,
      reliabilityLabel: item.reliabilityLabel,
      contributionCount: item.contributionCount,
      activeRecently: item.activeRecently
    }));

  return {
    role: roleName,
    users
  };
}

export async function getRoleSampleUsersForViewer(viewerId, rawRoleName) {
  const roleName = normalizeInput(rawRoleName);
  assertSafeInput(roleName, "Role name", MAX_ROLE_LENGTH);
  const cacheKey = `discovery:role:viewer:${String(viewerId)}:${roleCacheKey(roleName)}`;

  return withCache(cacheKey, () => getRoleSampleUsersForViewerUncached(viewerId, rawRoleName));
}
