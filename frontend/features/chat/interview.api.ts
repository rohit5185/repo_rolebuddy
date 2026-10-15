import { apiRequest } from "@/services/api";

import type { InterviewSession, InterviewTemplate, InterviewRatings } from "./types";

export function getInterviewTemplates(domain?: string, type?: string) {
  const params = new URLSearchParams();
  if (domain) params.set("domain", domain);
  if (type) params.set("type", type);
  params.set("source", "system");
  const qs = params.toString();
  return apiRequest<{ message: string; data: { templates: InterviewTemplate[] } }>(
    `/interviews/templates${qs ? `?${qs}` : ""}`,
    { method: "GET", credentials: "include" }
  );
}

export function getMyInterviewTemplates() {
  return apiRequest<{ message: string; data: { templates: InterviewTemplate[] } }>(
    "/interviews/templates/mine",
    { method: "GET", credentials: "include" }
  );
}

export function getPublicInterviewTemplates(params?: {
  domain?: string;
  type?: string;
  difficulty?: string;
  role?: string;
}) {
  const query = new URLSearchParams();
  if (params?.domain) query.set("domain", params.domain);
  if (params?.type) query.set("type", params.type);
  if (params?.difficulty) query.set("difficulty", params.difficulty);
  if (params?.role) query.set("role", params.role);

  const qs = query.toString();
  return apiRequest<{ message: string; data: { templates: InterviewTemplate[] } }>(
    `/interviews/templates/public${qs ? `?${qs}` : ""}`,
    { method: "GET", credentials: "include" }
  );
}

export function createInterviewTemplate(payload: {
  title: string;
  domain: string;
  role?: string | null;
  type: string;
  difficulty: string;
  estimatedDuration?: number;
  visibility?: "public" | "private";
  tags?: string[];
  questions: Array<{
    question: string;
    type?: string;
    followUps?: string[];
    expectedTopics?: string[];
    notes?: string | null;
  }>;
}) {
  return apiRequest<{ message: string; data: { template: InterviewTemplate } }>(
    "/interviews/templates",
    { method: "POST", body: JSON.stringify(payload), credentials: "include" }
  );
}

export function updateInterviewTemplate(templateId: string, payload: Partial<{
  title: string;
  domain: string;
  role: string | null;
  type: string;
  difficulty: string;
  estimatedDuration: number;
  visibility: "public" | "private";
  tags: string[];
  questions: Array<{
    question: string;
    type?: string;
    followUps?: string[];
    expectedTopics?: string[];
    notes?: string | null;
  }>;
}>) {
  return apiRequest<{ message: string; data: { template: InterviewTemplate } }>(
    `/interviews/templates/${templateId}`,
    { method: "PUT", body: JSON.stringify(payload), credentials: "include" }
  );
}

export function deleteInterviewTemplate(templateId: string) {
  return apiRequest<{ message: string; data: null }>(
    `/interviews/templates/${templateId}`,
    { method: "DELETE", credentials: "include" }
  );
}

export function duplicateInterviewTemplate(templateId: string) {
  return apiRequest<{ message: string; data: { template: InterviewTemplate } }>(
    `/interviews/templates/${templateId}/duplicate`,
    { method: "POST", body: JSON.stringify({}), credentials: "include" }
  );
}

export function requestInterview(payload: {
  conversationId: string;
  templateId: string;
  interviewerRole: "interviewer" | "candidate";
  mode: "text_async" | "live_online" | "live_video";
  proposedSlots?: string[];
  timezoneHint?: string;
}) {
  return apiRequest<{ message: string; data: { session: InterviewSession } }>(
    "/interviews/request",
    { method: "POST", body: JSON.stringify(payload), credentials: "include" }
  );
}

export function proposeInterviewSlots(sessionId: string, payload: { proposedSlots: string[]; timezoneHint?: string }) {
  return apiRequest<{ message: string; data: { session: InterviewSession } }>(
    `/interviews/${sessionId}/schedule/propose`,
    { method: "POST", body: JSON.stringify(payload), credentials: "include" }
  );
}

export function confirmInterviewSlot(sessionId: string, confirmedSlot: string) {
  return apiRequest<{ message: string; data: { session: InterviewSession } }>(
    `/interviews/${sessionId}/schedule/confirm`,
    { method: "POST", body: JSON.stringify({ confirmedSlot }), credentials: "include" }
  );
}

export function declineInterviewScheduling(sessionId: string) {
  return apiRequest<{ message: string; data: { session: InterviewSession } }>(
    `/interviews/${sessionId}/schedule/decline`,
    { method: "POST", body: JSON.stringify({}), credentials: "include" }
  );
}

export function getGoogleCalendarConnectUrl() {
  return apiRequest<{ message: string; data: { connectUrl: string } }>(
    "/interviews/calendar/connect",
    { method: "GET", credentials: "include" }
  );
}

export function getGoogleCalendarStatus() {
  return apiRequest<{ message: string; data: { configured: boolean; connected: boolean } }>(
    "/interviews/calendar/status",
    { method: "GET", credentials: "include" }
  );
}

export function disconnectGoogleCalendar() {
  return apiRequest<{ message: string; data: { connected: boolean } }>(
    "/interviews/calendar/disconnect",
    { method: "POST", body: JSON.stringify({}), credentials: "include" }
  );
}

export function acceptInterview(sessionId: string) {
  return apiRequest<{ message: string; data: { session: InterviewSession } }>(
    `/interviews/${sessionId}/accept`,
    { method: "POST", body: JSON.stringify({}), credentials: "include" }
  );
}

export function declineInterview(sessionId: string) {
  return apiRequest<{ message: string; data: { session: InterviewSession } }>(
    `/interviews/${sessionId}/decline`,
    { method: "POST", body: JSON.stringify({}), credentials: "include" }
  );
}

export function sendInterviewQuestion(sessionId: string) {
  return apiRequest<{ message: string; data: { session: InterviewSession } }>(
    `/interviews/${sessionId}/question`,
    { method: "POST", body: JSON.stringify({}), credentials: "include" }
  );
}

export function submitInterviewAnswer(sessionId: string, answer: string) {
  return apiRequest<{ message: string; data: { session: InterviewSession } }>(
    `/interviews/${sessionId}/answer`,
    { method: "POST", body: JSON.stringify({ answer }), credentials: "include" }
  );
}

export function submitInterviewFeedback(
  sessionId: string,
  payload: { ratings: InterviewRatings; feedback: string }
) {
  return apiRequest<{ message: string; data: { session: InterviewSession } }>(
    `/interviews/${sessionId}/feedback`,
    { method: "POST", body: JSON.stringify(payload), credentials: "include" }
  );
}

export function completeInterview(sessionId: string) {
  return apiRequest<{ message: string; data: { session: InterviewSession } }>(
    `/interviews/${sessionId}/complete`,
    { method: "POST", body: JSON.stringify({}), credentials: "include" }
  );
}

export function pauseInterview(sessionId: string) {
  return apiRequest<{ message: string; data: { session: InterviewSession } }>(
    `/interviews/${sessionId}/pause`,
    { method: "POST", body: JSON.stringify({}), credentials: "include" }
  );
}

export function getActiveInterviewSession(conversationId: string) {
  return apiRequest<{ message: string; data: { session: InterviewSession | null } }>(
    `/interviews/session/${conversationId}`,
    { method: "GET", credentials: "include" }
  );
}
