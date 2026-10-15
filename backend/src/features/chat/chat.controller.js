import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createConversationForMatch,
  getConversationMessages,
  getUserConversations,
  markMessageSeen,
  sendConversationMessage
} from "./chat.service.js";

export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await getUserConversations(req.user._id);

  res.status(200).json({
    message: "Conversations fetched successfully.",
    data: {
      conversations
    }
  });
});

export const createConversation = asyncHandler(async (req, res) => {
  const result = await createConversationForMatch(req.user._id, req.body?.partnerId);

  res.status(result.created ? 201 : 200).json({
    message: result.created ? "Conversation created successfully." : "Conversation already exists.",
    data: {
      conversation: result.conversation
    }
  });
});

export const listMessages = asyncHandler(async (req, res) => {
  const page = req.query.page ?? 1;
  const limit = req.query.limit ?? 20;
  const result = await getConversationMessages(req.user._id, req.params.conversationId, page, limit);

  res.status(200).json({
    message: "Messages fetched successfully.",
    data: result
  });
});

export const postMessage = asyncHandler(async (req, res) => {
  const result = await sendConversationMessage(req.user._id, req.body);

  res.status(201).json({
    message: "Message sent successfully.",
    data: result
  });
});

export const seenMessage = asyncHandler(async (req, res) => {
  const message = await markMessageSeen(req.user._id, req.body?.messageId ?? req.params.messageId);

  res.status(200).json({
    message: "Message seen successfully.",
    data: {
      message
    }
  });
});