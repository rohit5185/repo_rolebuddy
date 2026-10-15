import mongoose from "mongoose";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/appError.js";
import { User } from "../auth/auth.model.js";
import { recordCheckIn, updateLastActive, trackActiveDay } from "../activity/activity.service.js";
import { Conversation, Message } from "./chat.model.js";
import { emitToConversation } from "./chat.realtime.js";
import { notifyNewMessage, notifyPartnerCompletedGoal, notifyPartnerMissedGoal } from "../notification/notification.service.js";

const DEFAULT_CHECKIN_QUESTION = "Did you complete your goal today?";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_PAGE_SIZE = 50;

function toObjectId(value, errorMessage = "Invalid identifier.") {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(errorMessage, 400);
  }

  return new mongoose.Types.ObjectId(value);
}

function normalizeContent(input) {
  return String(input ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function toConversationKey(participantIds) {
  return participantIds.map((item) => String(item)).sort().join(":");
}

function normalizeMessageMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  return { ...metadata };
}

function serializeUserSummary(user) {
  if (!user) {
    return null;
  }

  return {
    id: String(user._id),
    anonUsername: user.anonUsername ?? null,
    role: user.role ?? null,
    experience: user.experience ?? null
  };
}

function serializeMessage(message) {
  const sender = message.senderId && typeof message.senderId === "object" ? serializeUserSummary(message.senderId) : null;

  return {
    id: String(message._id),
    conversationId: String(message.conversationId),
    senderId: String(sender ? sender.id : message.senderId),
    sender,
    type: message.type,
    content: message.content ?? "",
    metadata: message.metadata ?? {},
    seenBy: (message.seenBy ?? []).map((item) => String(item)),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };
}

function serializeConversation(conversation, currentUserId) {
  const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
  const partner = participants.find((participant) => String(participant._id ?? participant) !== String(currentUserId));

  return {
    id: String(conversation._id),
    participants: participants.map((participant) => serializeUserSummary(participant)),
    partner: serializeUserSummary(partner),
    lastMessage: conversation.lastMessage ? serializeMessage(conversation.lastMessage) : null,
    isActive: Boolean(conversation.isActive),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
}

function hasConnection(user, targetUserId) {
  return (user.connections ?? []).some((connection) => String(connection.userId) === String(targetUserId));
}

function isMatchedEitherDirection(user, partner) {
  return (
    String(user.matchedUserId ?? "") === String(partner._id) ||
    String(partner.matchedUserId ?? "") === String(user._id)
  );
}

function isConnectedEitherDirection(user, partner) {
  return hasConnection(user, partner._id) || hasConnection(partner, user._id);
}

/**
 * Get partner for conversation - checks both matched partners and connections
 */
async function getPartnerOrFail(userId, providedPartnerId) {
  const user = await User.findById(userId)
    .select("_id anonUsername matchedUserId status onboardingCompleted role experience dailyGoal availability connections")
    .lean();

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const normalizedProvidedPartnerId = providedPartnerId ? toObjectId(providedPartnerId, "Invalid partner id.") : null;

  // If partner ID provided, use it; otherwise use matched partner
  const partnerId = normalizedProvidedPartnerId || user.matchedUserId;

  if (!partnerId) {
    throw new AppError("No partner found for conversation.", 400);
  }

  if (String(user._id) === String(partnerId)) {
    throw new AppError("You cannot create a conversation with yourself.", 400);
  }

  const partner = await User.findById(partnerId)
    .select("_id anonUsername matchedUserId status onboardingCompleted role experience dailyGoal availability connections")
    .lean();

  if (!partner) {
    throw new AppError("Partner not found.", 404);
  }

  if (!partner.onboardingCompleted) {
    throw new AppError("Conversation partner is not eligible.", 403);
  }

  const hasMatchAccess = isMatchedEitherDirection(user, partner);
  const hasConnectionAccess = isConnectedEitherDirection(user, partner);

  if (!hasMatchAccess && !hasConnectionAccess) {
    throw new AppError("You can only chat with matched or connected users.", 403);
  }

  return { user, partner };
}

async function getMatchedPartnerOrFail(userId, providedPartnerId) {
  const user = await User.findById(userId)
    .select("_id anonUsername matchedUserId status onboardingCompleted role experience dailyGoal availability")
    .lean();

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const partnerId = providedPartnerId ? toObjectId(providedPartnerId, "Invalid partner id.") : user.matchedUserId;

  if (!partnerId) {
    throw new AppError("No matched partner found for this conversation.", 400);
  }

  if (!user.matchedUserId || String(user.matchedUserId) !== String(partnerId)) {
    throw new AppError("Conversation can only be created with your assigned match partner.", 403);
  }

  if (String(user._id) === String(partnerId)) {
    throw new AppError("You cannot create a conversation with yourself.", 400);
  }

  const partner = await User.findById(partnerId)
    .select("_id anonUsername matchedUserId status onboardingCompleted role experience dailyGoal availability")
    .lean();

  if (!partner) {
    throw new AppError("Matched partner not found.", 404);
  }

  if (!partner.onboardingCompleted) {
    throw new AppError("Conversation partner is not eligible.", 403);
  }

  return { user, partner };
}

async function assertConversationAccess(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId)
    .populate("participants", "_id anonUsername role experience")
    .populate("lastMessage")
    .lean();

  if (!conversation) {
    throw new AppError("Conversation not found.", 404);
  }

  const hasAccess = conversation.participants.some((participant) => String(participant._id) === String(userId));

  if (!hasAccess) {
    throw new AppError("You do not have access to this conversation.", 403);
  }

  return conversation;
}

async function ensureDailyCheckin(conversation, actorId) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const existingCheckin = await Message.findOne({
    conversationId: conversation._id,
    type: "checkin",
    "metadata.kind": "daily_checkin",
    "metadata.dateKey": todayKey
  })
    .select("_id")
    .lean();

  if (existingCheckin) {
    return null;
  }

  const checkinMessage = await Message.create({
    conversationId: conversation._id,
    senderId: actorId,
    type: "checkin",
    content: DEFAULT_CHECKIN_QUESTION,
    metadata: {
      kind: "daily_checkin",
      dateKey: todayKey,
      question: DEFAULT_CHECKIN_QUESTION,
      status: "pending"
    },
    seenBy: [actorId]
  });

  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessage: checkinMessage._id
      }
    }
  );

  const populatedCheckin = await Message.findById(checkinMessage._id)
    .populate("senderId", "_id anonUsername role experience")
    .lean();

  emitToConversation(conversation._id, "receive_message", serializeMessage(populatedCheckin));

  return populatedCheckin ? serializeMessage(populatedCheckin) : null;
}

async function maybeCreateAlertMessage(conversationId, senderId, sourceCheckinMessage, status) {
  if (status !== "not_done") {
    return null;
  }

  const participants = await Conversation.findById(conversationId).select("participants").lean();

  if (!participants) {
    return null;
  }

  const partnerId = participants.participants.find((participantId) => String(participantId) !== String(senderId));

  if (!partnerId) {
    return null;
  }

  const alertMessage = await Message.create({
    conversationId,
    senderId,
    type: "alert",
    content: "Your partner missed today's goal.",
    metadata: {
      kind: "accountability_alert",
      sourceCheckinId: sourceCheckinMessage._id,
      recipientId: partnerId,
      status: "not_done"
    },
    seenBy: [senderId]
  });

  const populatedAlert = await Message.findById(alertMessage._id)
    .populate("senderId", "_id anonUsername role experience")
    .lean();

  emitToConversation(conversationId, "receive_message", serializeMessage(populatedAlert));

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: { lastMessage: alertMessage._id }
    }
  );

  return populatedAlert ? serializeMessage(populatedAlert) : null;
}

export async function getUserConversations(userId) {
  const normalizedUserId = toObjectId(userId);
  const conversations = await Conversation.find({ participants: normalizedUserId, isActive: true })
    .populate("participants", "_id anonUsername role experience")
    .populate({ path: "lastMessage", populate: { path: "senderId", select: "_id anonUsername role experience" } })
    .sort({ updatedAt: -1 })
    .lean();

  return conversations.map((conversation) => serializeConversation(conversation, normalizedUserId));
}

export async function createConversationIfNotExists(userId, partnerId) {
  const normalizedUserId = toObjectId(userId);
  await updateLastActive(normalizedUserId);
  const { partner } = await getPartnerOrFail(normalizedUserId, partnerId);
  const normalizedPartnerId = toObjectId(partner._id);
  const participants = [normalizedUserId, normalizedPartnerId];
  const participantsKey = toConversationKey(participants);

  const existingConversation = await Conversation.findOne({ participantsKey })
    .populate("participants", "_id anonUsername role experience")
    .populate({ path: "lastMessage", populate: { path: "senderId", select: "_id anonUsername role experience" } })
    .lean();

  if (existingConversation) {
    await ensureDailyCheckin(existingConversation, normalizedUserId);

    return {
      conversation: serializeConversation(existingConversation, normalizedUserId),
      created: false
    };
  }

  const conversation = await Conversation.create({
    participants,
    participantsKey,
    isActive: true
  });

  const populatedConversation = await Conversation.findById(conversation._id)
    .populate("participants", "_id anonUsername role experience")
    .populate({ path: "lastMessage", populate: { path: "senderId", select: "_id anonUsername role experience" } })
    .lean();

  await ensureDailyCheckin(populatedConversation, normalizedUserId);

  return {
    conversation: serializeConversation(populatedConversation, normalizedUserId),
    created: true
  };
}

export async function createConversationForMatch(userId, partnerId) {
  return createConversationIfNotExists(userId, partnerId);
}

export async function getConversationMessages(userId, conversationId, page = 1, limit = 20) {
  const normalizedUserId = toObjectId(userId);
  const normalizedConversationId = toObjectId(conversationId, "Invalid conversation id.");
  const conversation = await assertConversationAccess(normalizedConversationId, normalizedUserId);

  await updateLastActive(normalizedUserId);
  await ensureDailyCheckin(conversation, normalizedUserId);

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(limit) || 20));
  const skip = (pageNumber - 1) * pageSize;

  const [messages, total] = await Promise.all([
    Message.find({ conversationId: normalizedConversationId })
      .populate("senderId", "_id anonUsername role experience")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Message.countDocuments({ conversationId: normalizedConversationId })
  ]);

  return {
    messages: messages.reverse().map(serializeMessage),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      hasNextPage: skip + messages.length < total
    }
  };
}

export async function sendConversationMessage(userId, payload) {
  const senderId = toObjectId(userId);
  const conversationId = toObjectId(payload?.conversationId, "Invalid conversation id.");
  const type = String(payload?.type || "text").trim().toLowerCase();
  const metadata = normalizeMessageMetadata(payload?.metadata);

  const conversation = await assertConversationAccess(conversationId, senderId);
  await updateLastActive(senderId);
  // Track active day for consistency streak on any chat message
  trackActiveDay(senderId).catch(() => {});

  if (type === "checkin" && metadata.kind === "daily_checkin") {
    throw new AppError("Daily check-in prompts are system generated.", 400);
  }

  if (type === "checkin") {
    const status = String(metadata.status || "").trim().toLowerCase();

    if (!status || !["done", "not_done"].includes(status)) {
      throw new AppError("Check-in responses must include a valid status.", 400);
    }

    await recordCheckIn(senderId, status);

    const sourceCheckinId = metadata.sourceCheckinId;
    if (sourceCheckinId && !mongoose.Types.ObjectId.isValid(sourceCheckinId)) {
      throw new AppError("Invalid check-in reference.", 400);
    }

    const duplicateResponse = await Message.findOne({
      conversationId,
      senderId,
      type: "checkin",
      ...(sourceCheckinId ? { "metadata.sourceCheckinId": new mongoose.Types.ObjectId(sourceCheckinId) } : {}),
      ...(metadata.dateKey ? { "metadata.dateKey": metadata.dateKey } : {}),
      ...(metadata.clientMessageId ? { "metadata.clientMessageId": metadata.clientMessageId } : {})
    })
      .populate("senderId", "_id anonUsername role experience")
      .lean();

    if (duplicateResponse) {
      return {
        message: serializeMessage(duplicateResponse),
        conversation: serializeConversation(conversation, senderId)
      };
    }

    const sourceCheckinMessage = sourceCheckinId
      ? await Message.findById(sourceCheckinId)
          .populate("senderId", "_id anonUsername role experience")
          .lean()
      : null;

    const responseMessage = await Message.create({
      conversationId,
      senderId,
      type: "checkin",
      content: status === "done" ? "I completed today's goal." : "I missed today's goal.",
      metadata: {
        ...metadata,
        status,
        responderId: senderId,
        kind: "checkin_response"
      },
      seenBy: [senderId]
    });

    const populatedResponse = await Message.findById(responseMessage._id)
      .populate("senderId", "_id anonUsername role experience")
      .lean();

    await Conversation.updateOne(
      { _id: conversationId },
      {
        $set: { lastMessage: responseMessage._id }
      }
    );

    emitToConversation(conversationId, "receive_message", serializeMessage(populatedResponse));

    // Notify the partner about goal completion/missed (fire-and-forget)
    const partnerForCheckin = conversation.participants.find(
      (p) => String(p._id ?? p) !== String(senderId)
    );
    if (partnerForCheckin) {
      const senderForNotify = await User.findById(senderId).select("anonUsername displayName").lean();
      const senderName = senderForNotify?.anonUsername ?? senderForNotify?.displayName ?? "Your partner";
      const partnerId = String(partnerForCheckin._id ?? partnerForCheckin);
      if (status === "done") {
        notifyPartnerCompletedGoal(partnerId, senderName).catch(() => {});
      } else {
        notifyPartnerMissedGoal(partnerId, senderName).catch(() => {});
      }
    }

    if (status === "not_done" && sourceCheckinMessage) {
      const alertMessage = await maybeCreateAlertMessage(conversationId, senderId, sourceCheckinMessage, status);
      return {
        message: serializeMessage(populatedResponse),
        alert: alertMessage,
        conversation: serializeConversation(conversation, senderId)
      };
    }

    return {
      message: serializeMessage(populatedResponse),
      conversation: serializeConversation(conversation, senderId)
    };
  }

  const content = normalizeContent(payload?.content);

  if (!content) {
    throw new AppError("Message content is required.", 400);
  }

  const duplicateMessage = await Message.findOne({
    conversationId,
    senderId,
    type: "text",
    content,
    ...(metadata.clientMessageId ? { "metadata.clientMessageId": metadata.clientMessageId } : {})
  })
    .sort({ createdAt: -1 })
    .populate("senderId", "_id anonUsername role experience")
    .lean();

  if (duplicateMessage) {
    return {
      message: serializeMessage(duplicateMessage),
      conversation: serializeConversation(conversation, senderId)
    };
  }

  const message = await Message.create({
    conversationId,
    senderId,
    type,
    content,
    metadata,
    seenBy: [senderId]
  });

  const populatedMessage = await Message.findById(message._id)
    .populate("senderId", "_id anonUsername role experience")
    .lean();

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: { lastMessage: message._id }
    }
  );

  const serialized = serializeMessage(populatedMessage);
  emitToConversation(conversationId, "receive_message", serialized);

  // Notify partner of new message (fire-and-forget)
  const partnerParticipant = conversation.participants.find(
    (p) => String(p._id ?? p) !== String(senderId)
  );
  if (partnerParticipant) {
    const senderUser = await User.findById(senderId).select("anonUsername displayName").lean();
    const senderName = senderUser?.anonUsername ?? senderUser?.displayName ?? "Your partner";
    notifyNewMessage(String(partnerParticipant._id ?? partnerParticipant), senderName, content).catch(() => {});
  }

  return {
    message: serialized,
    conversation: serializeConversation(conversation, senderId)
  };
}

export async function postSystemMessage(conversationId, senderId, content, metadata = {}) {
  const normalizedConversationId = toObjectId(conversationId, "Invalid conversation id.");
  const normalizedSenderId = toObjectId(senderId, "Invalid sender id.");
  const conversation = await assertConversationAccess(normalizedConversationId, normalizedSenderId);

  const message = await Message.create({
    conversationId: normalizedConversationId,
    senderId: normalizedSenderId,
    type: "system",
    content: normalizeContent(content),
    metadata: normalizeMessageMetadata(metadata),
    seenBy: [normalizedSenderId]
  });

  await Conversation.updateOne(
    { _id: normalizedConversationId },
    {
      $set: { lastMessage: message._id }
    }
  );

  const populatedMessage = await Message.findById(message._id)
    .populate("senderId", "_id anonUsername role experience")
    .lean();

  const serialized = serializeMessage(populatedMessage);
  emitToConversation(normalizedConversationId, "receive_message", serialized);

  return { message: serialized, conversation: serializeConversation(conversation, normalizedSenderId) };
}

export async function markMessageSeen(userId, messageId) {
  const normalizedUserId = toObjectId(userId);
  const normalizedMessageId = toObjectId(messageId, "Invalid message id.");

  const message = await Message.findById(normalizedMessageId).lean();

  if (!message) {
    throw new AppError("Message not found.", 404);
  }

  const conversation = await assertConversationAccess(message.conversationId, normalizedUserId);

  await Message.updateOne(
    {
      _id: normalizedMessageId,
      seenBy: { $ne: normalizedUserId }
    },
    {
      $addToSet: {
        seenBy: normalizedUserId
      }
    }
  );

  const updatedMessage = await Message.findById(normalizedMessageId)
    .populate("senderId", "_id anonUsername role experience")
    .lean();

  const serializedMessage = serializeMessage(updatedMessage);
  emitToConversation(conversation._id, "mark_seen", {
    conversationId: String(conversation._id),
    message: serializedMessage,
    seenBy: serializedMessage.seenBy
  });

  return serializedMessage;
}