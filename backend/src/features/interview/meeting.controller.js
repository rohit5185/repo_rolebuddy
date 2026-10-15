import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  scheduleMeeting,
  acceptMeeting,
  declineMeeting,
  cancelMeeting,
  getConversationMeetings
} from "./meeting.service.js";

/**
 * POST /api/interviews/meetings
 *
 * Body: { conversationId, provider, scheduledAt, duration, notes?, interviewSessionId? }
 */
export const scheduleMeetingController = asyncHandler(async (req, res) => {
  const { conversationId, interviewSessionId, provider, meetingLink, scheduledAt, duration, notes } = req.body;
  const result = await scheduleMeeting(req.user._id, {
    conversationId,
    interviewSessionId: interviewSessionId ?? null,
    provider,
    meetingLink: meetingLink ?? null,
    scheduledAt,
    duration,
    notes: notes ?? null
  });
  res.status(201).json({ message: "Meeting scheduled.", data: result });
});


/**
 * POST /api/interviews/meetings/:meetingId/accept
 */
export const acceptMeetingController = asyncHandler(async (req, res) => {
  const result = await acceptMeeting(req.user._id, req.params.meetingId);
  res.status(200).json({ message: "Meeting accepted.", data: result });
});

/**
 * POST /api/interviews/meetings/:meetingId/decline
 */
export const declineMeetingController = asyncHandler(async (req, res) => {
  const result = await declineMeeting(req.user._id, req.params.meetingId);
  res.status(200).json({ message: "Meeting declined.", data: result });
});

/**
 * POST /api/interviews/meetings/:meetingId/cancel
 */
export const cancelMeetingController = asyncHandler(async (req, res) => {
  const result = await cancelMeeting(req.user._id, req.params.meetingId);
  res.status(200).json({ message: "Meeting cancelled.", data: result });
});

/**
 * GET /api/interviews/meetings/:conversationId
 */
export const getConversationMeetingsController = asyncHandler(async (req, res) => {
  const result = await getConversationMeetings(req.params.conversationId, req.user._id);
  res.status(200).json({ message: "Meetings retrieved.", data: result });
});
