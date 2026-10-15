import { apiRequest } from "@/services/api";

import type { InterviewMeetingSession, ScheduleMeetingPayload } from "./types";

type MeetingResponse = { message: string; data: { meeting: InterviewMeetingSession } };
type MeetingsResponse = { message: string; data: { meetings: InterviewMeetingSession[] } };

/**
 * POST /api/interviews/meetings
 * Schedule a new live interview meeting inside an existing conversation.
 */
export function scheduleMeeting(payload: ScheduleMeetingPayload) {
  return apiRequest<MeetingResponse>("/interviews/meetings", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

/**
 * POST /api/interviews/meetings/:meetingId/accept
 * Accept a pending meeting request. Generates the meeting link.
 */
export function acceptMeeting(meetingId: string) {
  return apiRequest<MeetingResponse>(`/interviews/meetings/${meetingId}/accept`, {
    method: "POST",
    credentials: "include"
  });
}

/**
 * POST /api/interviews/meetings/:meetingId/decline
 * Decline a pending meeting request.
 */
export function declineMeeting(meetingId: string) {
  return apiRequest<MeetingResponse>(`/interviews/meetings/${meetingId}/decline`, {
    method: "POST",
    credentials: "include"
  });
}

/**
 * POST /api/interviews/meetings/:meetingId/cancel
 * Cancel a scheduled/pending meeting.
 */
export function cancelMeeting(meetingId: string) {
  return apiRequest<MeetingResponse>(`/interviews/meetings/${meetingId}/cancel`, {
    method: "POST",
    credentials: "include"
  });
}

/**
 * GET /api/interviews/meetings/:conversationId
 * Get all meetings for a conversation.
 */
export function getConversationMeetings(conversationId: string) {
  return apiRequest<MeetingsResponse>(`/interviews/meetings/${conversationId}`, {
    method: "GET",
    credentials: "include"
  });
}
