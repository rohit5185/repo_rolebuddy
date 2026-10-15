import { Router } from "express";

import { verifyJwt } from "../../middlewares/auth.middleware.js";
import {
  acceptInterviewController,
  completeInterviewController,
  confirmSlotController,
  createTemplateController,
  deleteTemplateController,
  declineSchedulingController,
  declineInterviewController,
  duplicateTemplateController,
  getActiveSessionController,
  googleCalendarCallbackController,
  googleCalendarConnectUrlController,
  googleCalendarDisconnectController,
  googleCalendarStatusController,
  listMyTemplates,
  pauseInterviewController,
  listPublicTemplates,
  listTemplates,
  proposeSlotsController,
  requestInterview,
  sendQuestionController,
  submitAnswerController,
  submitFeedbackController,
  updateTemplateController
} from "./interview.controller.js";
import {
  acceptMeetingController,
  cancelMeetingController,
  declineMeetingController,
  getConversationMeetingsController,
  scheduleMeetingController
} from "./meeting.controller.js";


const interviewRouter = Router();

interviewRouter.get("/calendar/callback", googleCalendarCallbackController);

interviewRouter.use(verifyJwt);

interviewRouter.get("/templates", listTemplates);
interviewRouter.get("/templates/mine", listMyTemplates);
interviewRouter.get("/templates/public", listPublicTemplates);
interviewRouter.post("/templates", createTemplateController);
interviewRouter.put("/templates/:templateId", updateTemplateController);
interviewRouter.delete("/templates/:templateId", deleteTemplateController);
interviewRouter.post("/templates/:templateId/duplicate", duplicateTemplateController);

interviewRouter.post("/request", requestInterview);

// ── Phase 3: Meeting scheduling routes ──
// NOTE: /meetings/* must come before /:sessionId/* to avoid param conflicts.
interviewRouter.post("/meetings", scheduleMeetingController);
interviewRouter.post("/meetings/:meetingId/accept", acceptMeetingController);
interviewRouter.post("/meetings/:meetingId/decline", declineMeetingController);
interviewRouter.post("/meetings/:meetingId/cancel", cancelMeetingController);
interviewRouter.get("/meetings/:conversationId", getConversationMeetingsController);

interviewRouter.post("/:sessionId/schedule/propose", proposeSlotsController);
interviewRouter.post("/:sessionId/schedule/confirm", confirmSlotController);
interviewRouter.post("/:sessionId/schedule/decline", declineSchedulingController);
interviewRouter.get("/session/:conversationId", getActiveSessionController);
interviewRouter.get("/calendar/connect", googleCalendarConnectUrlController);
interviewRouter.get("/calendar/status", googleCalendarStatusController);
interviewRouter.post("/calendar/disconnect", googleCalendarDisconnectController);
interviewRouter.post("/:sessionId/accept", acceptInterviewController);
interviewRouter.post("/:sessionId/decline", declineInterviewController);
interviewRouter.post("/:sessionId/question", sendQuestionController);
interviewRouter.post("/:sessionId/answer", submitAnswerController);
interviewRouter.post("/:sessionId/feedback", submitFeedbackController);
interviewRouter.post("/:sessionId/complete", completeInterviewController);
interviewRouter.post("/:sessionId/pause", pauseInterviewController);

export default interviewRouter;
