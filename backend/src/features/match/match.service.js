import mongoose from "mongoose";

import { AppError } from "../../utils/appError.js";
import { invalidateDiscoveryAndMatchCaches } from "../../utils/cache.js";
import { User } from "../auth/auth.model.js";
import { createConversationIfNotExists } from "../chat/chat.service.js";
import { calculateMatchScore, getRankedMatches } from "./match.engine.js";
import {
  buildMatchedResponse,
  getRematchCooldownCutoff,
  hasActiveMatch,
  isExpiredMatch,
  USER_MATCH_PROJECTION
} from "./match.utils.js";
import { notifyMatchFound } from "../notification/notification.service.js";

const MATCH_RESET = {
  status: "waiting",
  matchedUserId: null,
  activeMatchExpiresAt: null
};

async function invalidateMatchCaches(userIds = [], role = null) {
  await invalidateDiscoveryAndMatchCaches({
    userIds: userIds.map((id) => String(id)).filter(Boolean),
    role
  });
}

function toObjectId(userId) {
  return new mongoose.Types.ObjectId(userId);
}

function getMatchExpiryTimestamp(now = new Date()) {
  return new Date(now.getTime() + 48 * 60 * 60 * 1000);
}

async function loadMatchPartner(partnerId, session) {
  if (!partnerId) {
    return null;
  }

  return User.findById(partnerId).select(USER_MATCH_PROJECTION).session(session).lean();
}

async function clearMatchState(userId, partnerId, session, { keepPartner = false } = {}) {
  const updateUser = await User.updateOne(
    {
      _id: userId,
      matchedUserId: partnerId
    },
    {
      $set: MATCH_RESET
    },
    { session }
  );

  let updatePartner = { modifiedCount: 0 };
  if (!keepPartner && partnerId) {
    updatePartner = await User.updateOne(
      {
        _id: partnerId,
        matchedUserId: userId
      },
      {
        $set: MATCH_RESET
      },
      { session }
    );
  }

  return updateUser.modifiedCount > 0 || updatePartner.modifiedCount > 0;
}

async function isMatchStillActive(user, partner, now = new Date()) {
  if (!hasActiveMatch(user, now)) {
    return false;
  }

  if (!partner) {
    return false;
  }

  if (String(user.matchedUserId) !== String(partner._id)) {
    return false;
  }

  return !isExpiredMatch(user, partner, now);
}

async function getExistingMatchForUser(user) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (user.matchedUserId) {
      const matchedUser = await loadMatchPartner(user.matchedUserId, session);

      if (matchedUser && (await isMatchStillActive(user, matchedUser))) {
        if (matchedUser.status !== "matched" || String(matchedUser.matchedUserId ?? "") !== String(user._id)) {
          await User.updateOne(
            {
              _id: matchedUser._id,
              matchedUserId: null,
              onboardingCompleted: true
            },
            {
              $set: {
                status: "matched",
                matchedUserId: user._id,
                activeMatchExpiresAt: user.activeMatchExpiresAt ?? getMatchExpiryTimestamp(),
                lastMatchAt: user.lastMatchAt ?? new Date()
              }
            },
            { session }
          );
        }

        await session.commitTransaction();
        return {
          partnerId: matchedUser._id,
          response: buildMatchedResponse(calculateMatchScore(user, matchedUser), matchedUser)
        };
      }

      await clearMatchState(user._id, user.matchedUserId, session);
      await session.commitTransaction();
      return null;
    }

    const reverseMatchedUser = await User.findOne({
      matchedUserId: user._id,
      onboardingCompleted: true
    })
      .select(USER_MATCH_PROJECTION)
      .session(session)
      .lean();

    if (!reverseMatchedUser) {
      await session.commitTransaction();
      return null;
    }

    if (!hasActiveMatch(reverseMatchedUser)) {
      await clearMatchState(reverseMatchedUser._id, user._id, session, { keepPartner: true });

      await session.commitTransaction();
      return null;
    }

    await User.updateOne(
      {
        _id: user._id,
        matchedUserId: null
      },
      {
        $set: {
          status: "matched",
          matchedUserId: reverseMatchedUser._id,
          activeMatchExpiresAt: reverseMatchedUser.activeMatchExpiresAt ?? getMatchExpiryTimestamp(),
          lastMatchAt: reverseMatchedUser.lastMatchAt ?? new Date()
        }
      },
      { session }
    );

    await session.commitTransaction();

    return {
      partnerId: reverseMatchedUser._id,
      response: buildMatchedResponse(calculateMatchScore(user, reverseMatchedUser), reverseMatchedUser)
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

async function assignSymmetricMatch(userId, partnerId) {
  const normalizedUserId = toObjectId(userId);
  const normalizedPartnerId = toObjectId(partnerId);
  const session = await mongoose.startSession();
  const now = new Date();

  try {
    session.startTransaction();

    const user = await User.findById(normalizedUserId).select(USER_MATCH_PROJECTION).session(session).lean();
    const partner = await User.findById(normalizedPartnerId).select(USER_MATCH_PROJECTION).session(session).lean();

    if (!user || !partner) {
      throw new AppError("No active candidates available to match at the moment.", 409);
    }

    if (!user.onboardingCompleted || !partner.onboardingCompleted) {
      throw new AppError("Complete onboarding before finding a match.", 400);
    }

    if (hasActiveMatch(user, now) || hasActiveMatch(partner, now)) {
      throw new AppError("Unable to assign match at the moment.", 409);
    }

    if (user.matchedUserId || partner.matchedUserId) {
      throw new AppError("Unable to assign match at the moment.", 409);
    }

    const updateUser = await User.updateOne(
      {
        _id: normalizedUserId,
        matchedUserId: null,
        onboardingCompleted: true,
        $or: [{ activeMatchExpiresAt: null }, { activeMatchExpiresAt: { $lte: now } }]
      },
      {
        $set: {
          status: "matched",
          matchedUserId: normalizedPartnerId,
          activeMatchExpiresAt: getMatchExpiryTimestamp(now),
          lastMatchAt: now
        }
      },
      { session }
    );

    const updatePartner = await User.updateOne(
      {
        _id: normalizedPartnerId,
        matchedUserId: null,
        onboardingCompleted: true,
        $or: [{ activeMatchExpiresAt: null }, { activeMatchExpiresAt: { $lte: now } }]
      },
      {
        $set: {
          status: "matched",
          matchedUserId: normalizedUserId,
          activeMatchExpiresAt: getMatchExpiryTimestamp(now),
          lastMatchAt: now
        }
      },
      { session }
    );

    if (updateUser.modifiedCount !== 1 || updatePartner.modifiedCount !== 1) {
      throw new AppError("Unable to assign match at the moment.", 409);
    }

    await session.commitTransaction();

    await invalidateMatchCaches([normalizedUserId, normalizedPartnerId], user.role ?? partner.role);

    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function checkAndExpireMatch(userId) {
  const normalizedUserId = toObjectId(userId);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(normalizedUserId).select(USER_MATCH_PROJECTION).session(session).lean();

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (!user.matchedUserId) {
      await session.commitTransaction();
      return {
        expired: false,
        user
      };
    }

    const partner = await loadMatchPartner(user.matchedUserId, session);

    if (!partner || isExpiredMatch(user, partner)) {
      await clearMatchState(user._id, user.matchedUserId, session, { keepPartner: !partner });
      await session.commitTransaction();
      await invalidateMatchCaches([user._id, user.matchedUserId], user.role);
      return {
        expired: true
      };
    }

    await session.commitTransaction();
    return {
      expired: false,
      user,
      partner
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function rematchUser(userId) {
  const normalizedUserId = toObjectId(userId);
  const now = new Date();
  const cooldownCutoff = getRematchCooldownCutoff(now);

  await checkAndExpireMatch(normalizedUserId);

  const user = await User.findById(normalizedUserId).select(USER_MATCH_PROJECTION).lean();

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.onboardingCompleted) {
    throw new AppError("Complete onboarding before finding a match.", 400);
  }

  if (user.lastMatchAt && new Date(user.lastMatchAt).getTime() > cooldownCutoff.getTime()) {
    throw new AppError("You can rematch again after 24 hours.", 409);
  }

  if (user.matchedUserId) {
    const partner = await loadMatchPartner(user.matchedUserId);

    if (partner) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        await clearMatchState(user._id, partner._id, session);
        await session.commitTransaction();
        await invalidateMatchCaches([user._id, partner._id], user.role);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    }
  }

  return findBestMatchForUser(userId);
}

export async function findBestMatchForUser(userId) {
  const normalizedUserId = toObjectId(userId);

  await checkAndExpireMatch(normalizedUserId);

  const user = await User.findById(normalizedUserId).select(USER_MATCH_PROJECTION).lean();

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.onboardingCompleted) {
    throw new AppError("Complete onboarding before finding a match.", 400);
  }

  const existingMatch = await getExistingMatchForUser(user);
  if (existingMatch) {
    if (existingMatch.partnerId) {
      const conversationResult = await createConversationIfNotExists(user._id, existingMatch.partnerId);
      return {
        ...existingMatch.response,
        conversationId: conversationResult.conversation.id
      };
    }

    return existingMatch.response;
  }

  const rankedCandidates = await getRankedMatches(user, {
    limit: 300,
    projection: USER_MATCH_PROJECTION
  });

  if (rankedCandidates.length === 0) {
    throw new AppError("No active candidates available to match at the moment.", 409);
  }

  for (const item of rankedCandidates) {
    try {
      await checkAndExpireMatch(item.candidate._id);
      await assignSymmetricMatch(user._id, item.candidate._id);
      const conversationResult = await createConversationIfNotExists(user._id, item.candidate._id);

      // Notify both users (fire-and-forget)
      notifyMatchFound(user._id, item.candidate.role ?? null).catch(() => {});
      notifyMatchFound(item.candidate._id, user.role ?? null).catch(() => {});

      return {
        ...buildMatchedResponse(item.matchScore, item.candidate),
        conversationId: conversationResult.conversation.id
      };
    } catch (error) {
      if (!(error instanceof AppError) || error.statusCode !== 409) {
        throw error;
      }
    }
  }

  const refreshedUser = await User.findById(normalizedUserId).select(USER_MATCH_PROJECTION).lean();
  if (!refreshedUser) {
    throw new AppError("User not found.", 404);
  }

  const resolvedExistingMatch = await getExistingMatchForUser(refreshedUser);
  if (resolvedExistingMatch) {
    if (resolvedExistingMatch.partnerId) {
      const conversationResult = await createConversationIfNotExists(refreshedUser._id, resolvedExistingMatch.partnerId);
      return {
        ...resolvedExistingMatch.response,
        conversationId: conversationResult.conversation.id
      };
    }

    return resolvedExistingMatch.response;
  }

  throw new AppError("No active candidates available to match at the moment.", 409);
}

export async function sendPromotionRequest(userId, targetUserId) {
  const normalizedUserId = toObjectId(userId);
  const normalizedTargetId = toObjectId(targetUserId);

  if (String(normalizedUserId) === String(normalizedTargetId)) {
    throw new AppError("Cannot send a promotion request to yourself.", 400);
  }

  const [user, target] = await Promise.all([
    User.findById(normalizedUserId)
      .select("_id connections onboardingCompleted lastMatchAt")
      .lean(),
    User.findById(normalizedTargetId)
      .select("_id connections onboardingCompleted pendingMatchRequests")
      .lean()
  ]);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!target) {
    throw new AppError("Target user not found.", 404);
  }

  if (!user.onboardingCompleted) {
    throw new AppError("Complete onboarding before sending a promotion request.", 400);
  }

  if (!target.onboardingCompleted) {
    throw new AppError("Target user has not completed onboarding.", 400);
  }

  const isConnected = (user.connections ?? []).some(
    (conn) => String(conn.userId) === String(normalizedTargetId)
  );

  if (!isConnected) {
    throw new AppError("You can only promote a connected user to a match.", 400);
  }

  const now = new Date();
  const cooldownCutoff = getRematchCooldownCutoff(now);

  if (user.lastMatchAt && new Date(user.lastMatchAt).getTime() > cooldownCutoff.getTime()) {
    throw new AppError("You can send a promotion request after 24 hours from your last match.", 409);
  }

  const hasDuplicate = (target.pendingMatchRequests ?? []).some(
    (req) => String(req.from) === String(normalizedUserId)
  );

  if (hasDuplicate) {
    throw new AppError("A promotion request to this user is already pending.", 409);
  }

  const updateResult = await User.updateOne(
    {
      _id: normalizedTargetId,
      "pendingMatchRequests.from": { $ne: normalizedUserId }
    },
    {
      $push: {
        pendingMatchRequests: {
          from: normalizedUserId,
          createdAt: now
        }
      }
    }
  );

  if (updateResult.modifiedCount !== 1) {
    throw new AppError("A promotion request to this user is already pending.", 409);
  }

  return {
    from: String(normalizedUserId),
    to: String(normalizedTargetId),
    status: "pending"
  };
}

export async function acceptPromotionRequest(userId, fromUserId) {
  const normalizedUserId = toObjectId(userId);
  const normalizedFromId = toObjectId(fromUserId);

  if (String(normalizedUserId) === String(normalizedFromId)) {
    throw new AppError("Invalid promotion request.", 400);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [user, requester] = await Promise.all([
      User.findById(normalizedUserId)
        .select(`${USER_MATCH_PROJECTION} connections pendingMatchRequests`)
        .session(session)
        .lean(),
      User.findById(normalizedFromId)
        .select(`${USER_MATCH_PROJECTION} connections`)
        .session(session)
        .lean()
    ]);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (!requester) {
      throw new AppError("Requester not found.", 404);
    }

    const pendingRequest = (user.pendingMatchRequests ?? []).find(
      (req) => String(req.from) === String(normalizedFromId)
    );

    if (!pendingRequest) {
      throw new AppError("Promotion request not found.", 404);
    }

    const now = new Date();
    const cooldownCutoff = getRematchCooldownCutoff(now);

    if (user.lastMatchAt && new Date(user.lastMatchAt).getTime() > cooldownCutoff.getTime()) {
      throw new AppError("You can accept a promotion request after 24 hours from your last match.", 409);
    }

    if (requester.lastMatchAt && new Date(requester.lastMatchAt).getTime() > cooldownCutoff.getTime()) {
      throw new AppError("The requester is still in match cooldown. Try again later.", 409);
    }

    // Break existing match for the accepting user (if any)
    if (user.matchedUserId) {
      await clearMatchState(user._id, user.matchedUserId, session);
    }

    // Break existing match for the requesting user (if any)
    if (requester.matchedUserId) {
      await clearMatchState(requester._id, requester.matchedUserId, session);
    }

    const expiresAt = getMatchExpiryTimestamp(now);

    // Atomically set both users as matched with each other
    const updateUser = await User.updateOne(
      {
        _id: normalizedUserId,
        "pendingMatchRequests.from": normalizedFromId
      },
      {
        $set: {
          status: "matched",
          matchedUserId: normalizedFromId,
          activeMatchExpiresAt: expiresAt,
          lastMatchAt: now
        },
        $pull: {
          pendingMatchRequests: { from: normalizedFromId }
        }
      },
      { session }
    );

    const updateRequester = await User.updateOne(
      {
        _id: normalizedFromId,
        onboardingCompleted: true
      },
      {
        $set: {
          status: "matched",
          matchedUserId: normalizedUserId,
          activeMatchExpiresAt: expiresAt,
          lastMatchAt: now
        }
      },
      { session }
    );

    if (updateUser.modifiedCount !== 1 || updateRequester.modifiedCount !== 1) {
      throw new AppError("Unable to promote connection to match at the moment.", 409);
    }

    await session.commitTransaction();

    await invalidateMatchCaches([normalizedUserId, normalizedFromId], user.role ?? requester.role);

    // Create conversation outside of the transaction (idempotent)
    const conversationResult = await createConversationIfNotExists(normalizedUserId, normalizedFromId);

    return {
      matched: true,
      matchScore: calculateMatchScore(user, requester),
      partner: {
        role: requester.role ?? null,
        specialization: requester.specialization ?? null,
        experience: requester.experience ?? null,
        domainArea: requester.domainArea ?? null
      },
      conversationId: conversationResult.conversation.id
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
