import { calculateMatchScore } from "../match/match.engine.js";
import { hasActiveMatch } from "../match/match.utils.js";

function normalizeId(value) {
  if (!value) {
    return "";
  }

  return String(value);
}

function hasConnection(user, targetUserId) {
  const normalizedTarget = normalizeId(targetUserId);
  return (user.connections ?? []).some((connection) => normalizeId(connection.userId) === normalizedTarget);
}

function hasPendingRequest(requestHolder, fromUserId, toUserId) {
  const normalizedFrom = normalizeId(fromUserId);
  const normalizedTo = normalizeId(toUserId);

  return (requestHolder.connectionRequests ?? []).some(
    (request) =>
      request.status === "pending" &&
      normalizeId(request.from) === normalizedFrom &&
      normalizeId(request.to) === normalizedTo
  );
}

function isMatchedEitherDirection(currentUser, targetUser) {
  const currentId = normalizeId(currentUser._id);
  const targetId = normalizeId(targetUser._id);

  if (normalizeId(currentUser.matchedUserId) !== targetId && normalizeId(targetUser.matchedUserId) !== currentId) {
    return false;
  }

  return hasActiveMatch(currentUser) || hasActiveMatch(targetUser);
}

export function getUserRelationState(currentUser, targetUser) {
  const currentId = normalizeId(currentUser?._id);
  const targetId = normalizeId(targetUser?._id);
  const matchScore = calculateMatchScore(currentUser, targetUser);

  if (!currentId || !targetId || currentId === targetId) {
    return {
      visible: false,
      state: "hidden",
      matchScore
    };
  }

  if (isMatchedEitherDirection(currentUser, targetUser)) {
    return {
      visible: false,
      state: "matched",
      matchScore
    };
  }

  if (hasConnection(currentUser, targetId) || hasConnection(targetUser, currentId)) {
    return {
      visible: false,
      state: "connected",
      matchScore
    };
  }

  const pendingSent =
    hasPendingRequest(targetUser, currentId, targetId) || hasPendingRequest(currentUser, currentId, targetId);
  if (pendingSent) {
    return {
      visible: false,
      state: "pending_sent",
      matchScore
    };
  }

  const pendingReceived =
    hasPendingRequest(currentUser, targetId, currentId) || hasPendingRequest(targetUser, targetId, currentId);
  if (pendingReceived) {
    return {
      visible: false,
      state: "pending_received",
      matchScore
    };
  }

  return {
    visible: true,
    state: "available",
    matchScore
  };
}
