import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  acceptInterview,
  completeInterview,
  createInterviewRequest,
  createUserTemplate,
  declineInterview,
  deleteUserTemplate,
  duplicateTemplate,
  getActiveSession,
  pauseInterview,
  getPublicTemplates,
  getTemplates,
  getUserTemplates,
  getGoogleCalendarConnectUrl,
  getGoogleCalendarStatus,
  disconnectGoogleCalendar,
  completeGoogleCalendarOAuth,
  proposeInterviewSlots,
  confirmInterviewSlot,
  declineInterviewScheduling,
  sendQuestion,
  submitAnswer,
  submitFeedback,
  updateUserTemplate
} from "./interview.service.js";

// GET /api/interviews/templates  (Phase 1 system templates — backward-compatible)
export const listTemplates = asyncHandler(async (req, res) => {
  const { domain, type, source } = req.query;
  const templates = await getTemplates({ domain, type, source: source ?? "system" });
  res.status(200).json({ message: "Templates retrieved.", data: { templates } });
});

// GET /api/interviews/templates/mine
export const listMyTemplates = asyncHandler(async (req, res) => {
  const templates = await getUserTemplates(req.user._id);
  res.status(200).json({ message: "Your templates retrieved.", data: { templates } });
});

// GET /api/interviews/templates/public
export const listPublicTemplates = asyncHandler(async (req, res) => {
  const { domain, type, difficulty, role } = req.query;
  const templates = await getPublicTemplates({ domain, type, difficulty, role });
  res.status(200).json({ message: "Public templates retrieved.", data: { templates } });
});

// POST /api/interviews/templates
export const createTemplateController = asyncHandler(async (req, res) => {
  const template = await createUserTemplate(req.user._id, req.body);
  res.status(201).json({ message: "Template created.", data: { template } });
});

// PUT /api/interviews/templates/:templateId
export const updateTemplateController = asyncHandler(async (req, res) => {
  const template = await updateUserTemplate(req.user._id, req.params.templateId, req.body);
  res.status(200).json({ message: "Template updated.", data: { template } });
});

// DELETE /api/interviews/templates/:templateId
export const deleteTemplateController = asyncHandler(async (req, res) => {
  await deleteUserTemplate(req.user._id, req.params.templateId);
  res.status(200).json({ message: "Template deleted.", data: null });
});

// POST /api/interviews/templates/:templateId/duplicate
export const duplicateTemplateController = asyncHandler(async (req, res) => {
  const template = await duplicateTemplate(req.user._id, req.params.templateId);
  res.status(201).json({ message: "Template duplicated.", data: { template } });
});

export const requestInterview = asyncHandler(async (req, res) => {
  const { conversationId, templateId, interviewerRole, mode, proposedSlots, timezoneHint } = req.body;
  const result = await createInterviewRequest(req.user._id, {
    conversationId,
    templateId,
    interviewerRole,
    mode,
    proposedSlots,
    timezoneHint
  });
  res.status(201).json({ message: "Interview request sent.", data: result });
});

export const proposeSlotsController = asyncHandler(async (req, res) => {
  const result = await proposeInterviewSlots(req.user._id, req.params.sessionId, {
    proposedSlots: req.body?.proposedSlots,
    timezoneHint: req.body?.timezoneHint
  });
  res.status(200).json({ message: "Interview slots proposed.", data: result });
});

export const confirmSlotController = asyncHandler(async (req, res) => {
  const result = await confirmInterviewSlot(req.user._id, req.params.sessionId, {
    confirmedSlot: req.body?.confirmedSlot
  });
  res.status(200).json({ message: "Interview slot confirmed.", data: result });
});

export const declineSchedulingController = asyncHandler(async (req, res) => {
  const result = await declineInterviewScheduling(req.user._id, req.params.sessionId);
  res.status(200).json({ message: "Interview scheduling declined.", data: result });
});

export const acceptInterviewController = asyncHandler(async (req, res) => {
  const result = await acceptInterview(req.user._id, req.params.sessionId);
  res.status(200).json({ message: "Interview accepted.", data: result });
});

export const declineInterviewController = asyncHandler(async (req, res) => {
  const result = await declineInterview(req.user._id, req.params.sessionId);
  res.status(200).json({ message: "Interview declined.", data: result });
});

export const sendQuestionController = asyncHandler(async (req, res) => {
  const result = await sendQuestion(req.user._id, req.params.sessionId);
  res.status(200).json({ message: "Question sent.", data: result });
});

export const submitAnswerController = asyncHandler(async (req, res) => {
  const { answer } = req.body;
  const result = await submitAnswer(req.user._id, req.params.sessionId, { answer });
  res.status(200).json({ message: "Answer submitted.", data: result });
});

export const submitFeedbackController = asyncHandler(async (req, res) => {
  const { ratings, feedback } = req.body;
  const result = await submitFeedback(req.user._id, req.params.sessionId, { ratings, feedback });
  res.status(200).json({ message: "Feedback submitted.", data: result });
});

export const completeInterviewController = asyncHandler(async (req, res) => {
  const result = await completeInterview(req.user._id, req.params.sessionId);
  res.status(200).json({ message: "Interview completed.", data: result });
});

export const pauseInterviewController = asyncHandler(async (req, res) => {
  const result = await pauseInterview(req.user._id, req.params.sessionId);
  res.status(200).json({ message: "Interview paused.", data: result });
});

export const getActiveSessionController = asyncHandler(async (req, res) => {
  const result = await getActiveSession(req.params.conversationId, req.user._id);
  res.status(200).json({ message: "Session retrieved.", data: result });
});

export const googleCalendarConnectUrlController = asyncHandler(async (req, res) => {
  const result = await getGoogleCalendarConnectUrl(req.user._id);
  res.status(200).json({ message: "Google Calendar connect URL generated.", data: result });
});

export const googleCalendarStatusController = asyncHandler(async (req, res) => {
  const result = await getGoogleCalendarStatus(req.user._id);
  res.status(200).json({ message: "Google Calendar status fetched.", data: result });
});

export const googleCalendarDisconnectController = asyncHandler(async (req, res) => {
  const result = await disconnectGoogleCalendar(req.user._id);
  res.status(200).json({ message: "Google Calendar disconnected.", data: result });
});

export const googleCalendarCallbackController = asyncHandler(async (req, res) => {
  const result = await completeGoogleCalendarOAuth({
    code: req.query?.code,
    state: req.query?.state
  });
  res.status(200).json({ message: "Google Calendar connected.", data: result });
});
