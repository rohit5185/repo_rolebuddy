import mongoose from "mongoose";
import crypto from "crypto";

import { AppError } from "../../utils/appError.js";
import { env } from "../../config/env.js";
import { User } from "../auth/auth.model.js";
import { Conversation, Message } from "../chat/chat.model.js";
import { areUsersOnline, emitToConversation, isUserOnline } from "../chat/chat.realtime.js";
import { InterviewSession, InterviewTemplate } from "./interview.model.js";
import { notifyInterviewRequestReceived, notifyInterviewRequestAccepted } from "../notification/notification.service.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toObjectId(value, errorMessage = "Invalid identifier.") {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(errorMessage, 400);
  }
  return new mongoose.Types.ObjectId(value);
}

function serializeTemplate(template) {
  return {
    id: String(template._id),
    title: template.title,
    domain: template.domain,
    role: template.role ?? null,
    type: template.type,
    difficulty: template.difficulty,
    estimatedDuration: template.estimatedDuration,
    totalQuestions: (template.questions ?? []).length,
    questions: (template.questions ?? []).map((q, idx) => ({
      index: idx,
      question: q.question,
      type: q.type,
      followUps: q.followUps ?? [],
      expectedTopics: q.expectedTopics ?? [],
      notes: q.notes ?? null
    })),
    // Phase 2 fields
    createdBy: template.createdBy ? String(template.createdBy) : null,
    isSystemTemplate: Boolean(template.isSystemTemplate),
    visibility: template.visibility ?? "public",
    usageCount: template.usageCount ?? 0,
    tags: template.tags ?? [],
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  };
}

function serializeSession(session) {
  const mode = session.mode ?? "text_async";
  const interviewerOnline = isUserOnline(session.interviewerId);
  const candidateOnline = isUserOnline(session.candidateId);
  return {
    id: String(session._id),
    conversationId: String(session.conversationId),
    interviewerId: String(session.interviewerId),
    candidateId: String(session.candidateId),
    templateId: String(session.templateId),
    mode,
    scheduleStatus: session.scheduleStatus ?? null,
    proposedSlots: (session.proposedSlots ?? []).map((slot) => slot instanceof Date ? slot.toISOString() : new Date(slot).toISOString()),
    confirmedSlot: session.confirmedSlot ? new Date(session.confirmedSlot).toISOString() : null,
    timezoneHint: session.timezoneHint ?? null,
    googleCalendar: session.googleCalendar ?? { interviewer: { eventId: null, eventLink: null }, candidate: { eventId: null, eventLink: null } },
    liveOnlineStatus: {
      interviewerOnline,
      candidateOnline,
      bothOnline: interviewerOnline && candidateOnline
    },
    status: session.status,
    currentQuestionIndex: session.currentQuestionIndex,
    totalQuestions: session.totalQuestions,
    finalRatings: session.finalRatings ?? null,
    overallFeedback: session.overallFeedback ?? null,
    startedAt: session.startedAt ?? null,
    endedAt: session.endedAt ?? null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

function assertValidInterviewMode(mode) {
  const normalizedMode = mode ?? "text_async";
  if (!["text_async", "live_online", "live_video"].includes(normalizedMode)) {
    throw new AppError("Interview mode is invalid.", 400);
  }
  if (normalizedMode === "live_video") {
    throw new AppError("Live video interviews are coming soon.", 400);
  }
  return normalizedMode;
}

function assertLiveOnlineParticipants(session) {
  if ((session.mode ?? "text_async") !== "live_online") return;
  const bothOnline = areUsersOnline([session.interviewerId, session.candidateId]);
  if (!bothOnline) {
    throw new AppError("Both participants must be online for live-online interviews.", 409);
  }
}

function validateProposedSlots(proposedSlots) {
  if (!Array.isArray(proposedSlots) || proposedSlots.length < 2 || proposedSlots.length > 3) {
    throw new AppError("Live-online interviews require 2 to 3 proposed slots.", 400);
  }

  const parsedSlots = proposedSlots.map((slot) => {
    const parsed = new Date(slot);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppError("Each proposed slot must be a valid datetime.", 400);
    }
    return parsed;
  });

  const unique = new Set(parsedSlots.map((slot) => slot.toISOString()));
  if (unique.size !== parsedSlots.length) {
    throw new AppError("Proposed slots must be unique.", 400);
  }

  return parsedSlots.sort((a, b) => a.getTime() - b.getTime());
}

function assertLiveOnlineCanStart(session) {
  if ((session.mode ?? "text_async") !== "live_online") return;
  if (session.scheduleStatus !== "confirmed" || !session.confirmedSlot) {
    throw new AppError("Live-online interview must have a confirmed schedule before starting.", 409);
  }
}

function isSlotMissed(session) {
  if ((session.mode ?? "text_async") !== "live_online") return false;
  if (session.scheduleStatus !== "confirmed" || !session.confirmedSlot) return false;
  return new Date(session.confirmedSlot).getTime() < Date.now() && !areUsersOnline([session.interviewerId, session.candidateId]);
}

function isGoogleCalendarConfigured() {
  return Boolean(env.googleClientId && env.googleClientSecret && env.googleOAuthRedirectUri);
}

async function createGoogleCalendarEventForUser({ user, title, description, startAt, endAt, attendeeEmail }) {
  if (!user?.googleCalendar?.connected || !user.googleCalendar.accessToken) {
    return { eventId: null, eventLink: null };
  }

  let accessToken = user.googleCalendar.accessToken;
  const expiryDate = user.googleCalendar.expiryDate ? new Date(user.googleCalendar.expiryDate).getTime() : null;
  const isExpired = expiryDate ? expiryDate <= Date.now() : false;

  if (isExpired && user.googleCalendar.refreshToken && env.googleClientId && env.googleClientSecret) {
    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        refresh_token: user.googleCalendar.refreshToken,
        grant_type: "refresh_token"
      })
    });

    if (refreshRes.ok) {
      const refreshPayload = await refreshRes.json();
      accessToken = refreshPayload.access_token ?? accessToken;
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            "googleCalendar.accessToken": accessToken,
            "googleCalendar.expiryDate": refreshPayload.expires_in
              ? new Date(Date.now() + Number(refreshPayload.expires_in) * 1000)
              : user.googleCalendar.expiryDate ?? null
          }
        }
      );
    }
  }

  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary: title,
      description,
      start: { dateTime: startAt.toISOString() },
      end: { dateTime: endAt.toISOString() },
      attendees: attendeeEmail ? [{ email: attendeeEmail }] : []
    })
  });

  if (!response.ok) {
    return { eventId: null, eventLink: null };
  }

  const payload = await response.json();
  return {
    eventId: payload?.id ?? null,
    eventLink: payload?.htmlLink ?? null
  };
}

async function assertConversationParticipant(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId)
    .select("participants isActive")
    .lean();

  if (!conversation) {
    throw new AppError("Conversation not found.", 404);
  }

  const isParticipant = conversation.participants.some(
    (p) => String(p) === String(userId)
  );

  if (!isParticipant) {
    throw new AppError("You are not a participant in this conversation.", 403);
  }

  return conversation;
}

async function postInterviewMessage(conversationId, senderId, type, content, metadata = {}) {
  const message = await Message.create({
    conversationId,
    senderId,
    type,
    content,
    metadata,
    seenBy: [senderId]
  });

  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { lastMessage: message._id } }
  );

  const populated = await Message.findById(message._id)
    .populate("senderId", "_id email role experience")
    .lean();

  const serialized = {
    id: String(populated._id),
    conversationId: String(populated.conversationId),
    senderId: String(senderId),
    sender: populated.senderId && typeof populated.senderId === "object"
      ? {
          id: String(populated.senderId._id),
          email: populated.senderId.email,
          role: populated.senderId.role ?? null,
          experience: populated.senderId.experience ?? null
        }
      : null,
    type: populated.type,
    content: populated.content ?? "",
    metadata: populated.metadata ?? {},
    seenBy: (populated.seenBy ?? []).map((id) => String(id)),
    createdAt: populated.createdAt,
    updatedAt: populated.updatedAt
  };

  emitToConversation(conversationId, "receive_message", serialized);

  return serialized;
}

// ── Public Service Functions ──────────────────────────────────────────────────

/**
 * Fetch interview templates.
 * Phase 1: system templates for the interview drawer (filtered by domain/type).
 * Phase 2: can also filter by visibility and source (system/user/public).
 */
export async function getTemplates({ domain, type, visibility, source } = {}) {
  const filter = { isActive: true };

  // source: "system" = only system templates, default behaviour for Phase 1 sidebar
  if (source === "system") {
    filter.$or = [{ isSystemTemplate: true }, { isSystemTemplate: { $ne: true }, createdBy: null }];
  } else if (source === "public") {
    filter.visibility = "public";
  }

  if (domain && ["tech", "non-tech"].includes(domain)) {
    const domainFilter = [{ domain }, { domain: "any" }];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: domainFilter }];
      delete filter.$or;
    } else {
      filter.$or = domainFilter;
    }
  }

  if (type && ["technical", "hr", "behavioral", "mixed", "resume_round"].includes(type)) {
    filter.type = type;
  }

  const templates = await InterviewTemplate.find(filter)
    .sort({ isSystemTemplate: -1, type: 1, difficulty: 1, title: 1 })
    .lean();

  return templates.map(serializeTemplate);
}

/**
 * Create an interview request. Posts an interview_request message to the conversation timeline.
 */
export async function createInterviewRequest(requesterId, { conversationId, templateId, interviewerRole, mode, proposedSlots, timezoneHint }) {
  const normalizedRequesterId = toObjectId(requesterId);
  const normalizedConversationId = toObjectId(conversationId, "Invalid conversation id.");
  const normalizedTemplateId = toObjectId(templateId, "Invalid template id.");

  if (!["interviewer", "candidate"].includes(interviewerRole)) {
    throw new AppError("interviewerRole must be 'interviewer' or 'candidate'.", 400);
  }
  const interviewMode = assertValidInterviewMode(mode);
  const normalizedSlots = interviewMode === "live_online" ? validateProposedSlots(proposedSlots) : [];

  await assertConversationParticipant(normalizedConversationId, normalizedRequesterId);

  const template = await InterviewTemplate.findOne({
    _id: normalizedTemplateId,
    isActive: true
  }).lean();

  if (!template) {
    throw new AppError("Interview template not found.", 404);
  }

  // Check for an existing pending/active session in this conversation
  const existingSession = await InterviewSession.findOne({
    conversationId: normalizedConversationId,
    status: { $in: ["pending", "active", "paused"] }
  }).lean();

  if (existingSession) {
    throw new AppError("An interview session is already in progress for this conversation.", 409);
  }

  // Determine roles
  const conversation = await Conversation.findById(normalizedConversationId)
    .select("participants")
    .lean();

  const partnerId = conversation.participants.find(
    (p) => String(p) !== String(normalizedRequesterId)
  );

  const interviewerId = interviewerRole === "interviewer"
    ? normalizedRequesterId
    : new mongoose.Types.ObjectId(partnerId);

  const candidateId = interviewerRole === "candidate"
    ? normalizedRequesterId
    : new mongoose.Types.ObjectId(partnerId);

  const session = await InterviewSession.create({
    conversationId: normalizedConversationId,
    interviewerId,
    candidateId,
    templateId: normalizedTemplateId,
    mode: interviewMode,
    scheduleStatus: interviewMode === "live_online" ? "proposed" : null,
    proposedSlots: normalizedSlots,
    confirmedSlot: null,
    timezoneHint: interviewMode === "live_online" && timezoneHint ? String(timezoneHint).trim() : null,
    status: "pending",
    currentQuestionIndex: 0,
    totalQuestions: template.questions.length
  });

  // Increment template usage count
  await InterviewTemplate.updateOne(
    { _id: normalizedTemplateId },
    { $inc: { usageCount: 1 } }
  );

  const sessionData = serializeSession(session);

  // Post interview_request message to conversation timeline
  const message = await postInterviewMessage(
    normalizedConversationId,
    normalizedRequesterId,
    "interview_request",
    `${interviewerRole === "interviewer" ? "I" : "My partner"} proposed a mock interview: ${template.title}`,
    {
      kind: "interview_request",
      sessionId: String(session._id),
      templateId: String(normalizedTemplateId),
      templateTitle: template.title,
      templateType: template.type,
      templateDifficulty: template.difficulty,
      estimatedDuration: template.estimatedDuration,
      totalQuestions: template.questions.length,
      interviewerId: String(interviewerId),
      candidateId: String(candidateId),
      requesterId: String(normalizedRequesterId),
      mode: interviewMode,
      scheduleStatus: interviewMode === "live_online" ? "proposed" : null,
      proposedSlots: normalizedSlots.map((slot) => slot.toISOString()),
      timezoneHint: interviewMode === "live_online" ? (timezoneHint ? String(timezoneHint).trim() : null) : null
    }
  );

  emitToConversation(normalizedConversationId, "interview_started", { session: sessionData });

  // Notify the partner who will receive the request (fire-and-forget)
  notifyInterviewRequestReceived(String(partnerId), "Your partner", template.title).catch(() => {});

  return { session: sessionData, message };
}

/**
 * Accept an interview request. Sets status to active and posts a system message.
 */
export async function acceptInterview(userId, sessionId) {
  const normalizedUserId = toObjectId(userId);
  const normalizedSessionId = toObjectId(sessionId, "Invalid session id.");

  const session = await InterviewSession.findById(normalizedSessionId)
    .populate("templateId", "title type difficulty estimatedDuration")
    .lean();

  if (!session) {
    throw new AppError("Interview session not found.", 404);
  }

  if (session.status !== "pending") {
    throw new AppError("This interview session is not pending.", 409);
  }

  const isParticipant =
    String(session.interviewerId) === String(normalizedUserId) ||
    String(session.candidateId) === String(normalizedUserId);

  if (!isParticipant) {
    throw new AppError("You are not a participant in this interview session.", 403);
  }
  assertLiveOnlineCanStart(session);
  if (isSlotMissed(session)) {
    await InterviewSession.updateOne(
      { _id: normalizedSessionId },
      { $set: { status: "paused", scheduleStatus: "missed" } }
    );
    throw new AppError("Scheduled slot was missed because one participant is offline. Please reschedule.", 409);
  }
  assertLiveOnlineParticipants(session);

  // Only the non-requesting party should be able to accept, but we allow either for simplicity
  await InterviewSession.updateOne(
    { _id: normalizedSessionId },
    { $set: { status: "active", startedAt: new Date() } }
  );

  const template = session.templateId;
  const message = await postInterviewMessage(
    session.conversationId,
    normalizedUserId,
    "interview_system",
    `Mock interview started: ${template.title}. ${template.estimatedDuration} min • ${session.totalQuestions} questions`,
    {
      kind: "interview_accepted",
      sessionId: String(normalizedSessionId),
      templateTitle: template.title,
      templateType: template.type,
      totalQuestions: session.totalQuestions,
      interviewerId: String(session.interviewerId),
      candidateId: String(session.candidateId)
    }
  );

  // Send first template question immediately when session becomes active.
  let hasSentInitialQuestion = false;
  if (session.totalQuestions > 0) {
    const fullTemplate = await InterviewTemplate.findById(session.templateId).lean();
    const firstQuestion = fullTemplate?.questions?.[0];

    if (firstQuestion?.question) {
      await InterviewSession.updateOne(
        { _id: normalizedSessionId },
        { $set: { currentQuestionIndex: 1 } }
      );

      await postInterviewMessage(
        session.conversationId,
        session.interviewerId,
        "interview_question",
        firstQuestion.question,
        {
          kind: "interview_question",
          sessionId: String(normalizedSessionId),
          questionIndex: 0,
          questionNumber: 1,
          totalQuestions: session.totalQuestions,
          questionType: firstQuestion.type,
          followUps: firstQuestion.followUps ?? [],
          expectedTopics: firstQuestion.expectedTopics ?? [],
          isLastQuestion: session.totalQuestions === 1
        }
      );
      hasSentInitialQuestion = true;
    }
  }

  const updatedSession = await InterviewSession.findById(normalizedSessionId).lean();
  const sessionData = serializeSession(updatedSession);

  emitToConversation(session.conversationId, "interview_started", { session: sessionData });
  emitToConversation(session.conversationId, "interview_presence_changed", {
    sessionId: String(normalizedSessionId),
    mode: sessionData.mode,
    liveOnlineStatus: sessionData.liveOnlineStatus
  });
  if (hasSentInitialQuestion) {
    emitToConversation(session.conversationId, "interview_question_sent", {
      session: sessionData,
      questionIndex: 0
    });
  }

  // Notify the other participant that interview was accepted (fire-and-forget)
  const notifyTargetId = String(normalizedUserId) === String(session.interviewerId)
    ? String(session.candidateId)
    : String(session.interviewerId);
  notifyInterviewRequestAccepted(notifyTargetId, "Your partner").catch(() => {});

  return { session: sessionData, message };
}

/**
 * Decline an interview request. Sets status to cancelled and posts a system message.
 */
export async function declineInterview(userId, sessionId) {
  const normalizedUserId = toObjectId(userId);
  const normalizedSessionId = toObjectId(sessionId, "Invalid session id.");

  const session = await InterviewSession.findById(normalizedSessionId).lean();

  if (!session) {
    throw new AppError("Interview session not found.", 404);
  }

  if (session.status !== "pending") {
    throw new AppError("This interview session is not pending.", 409);
  }

  const isParticipant =
    String(session.interviewerId) === String(normalizedUserId) ||
    String(session.candidateId) === String(normalizedUserId);

  if (!isParticipant) {
    throw new AppError("You are not a participant in this interview session.", 403);
  }

  await InterviewSession.updateOne(
    { _id: normalizedSessionId },
    { $set: { status: "cancelled", endedAt: new Date() } }
  );

  const updatedSession = await InterviewSession.findById(normalizedSessionId).lean();
  const sessionData = serializeSession(updatedSession);

  const message = await postInterviewMessage(
    session.conversationId,
    normalizedUserId,
    "interview_system",
    "Mock interview request was declined.",
    {
      kind: "interview_declined",
      sessionId: String(normalizedSessionId)
    }
  );

  emitToConversation(session.conversationId, "interview_completed", { session: sessionData });

  return { session: sessionData, message };
}

/**
 * Send the next interview question. Only the interviewer can do this.
 */
export async function sendQuestion(interviewerId, sessionId) {
  const normalizedInterviewerId = toObjectId(interviewerId);
  const normalizedSessionId = toObjectId(sessionId, "Invalid session id.");

  const session = await InterviewSession.findById(normalizedSessionId).lean();

  if (!session) {
    throw new AppError("Interview session not found.", 404);
  }

  if (session.status !== "active") {
    throw new AppError("Interview session is not active.", 409);
  }

  if (String(session.interviewerId) !== String(normalizedInterviewerId)) {
    throw new AppError("Only the interviewer can send questions.", 403);
  }
  assertLiveOnlineParticipants(session);

  if (session.currentQuestionIndex >= session.totalQuestions) {
    throw new AppError("All questions have been sent. Complete the interview to submit feedback.", 400);
  }

  const template = await InterviewTemplate.findById(session.templateId).lean();
  if (!template) {
    throw new AppError("Interview template not found.", 404);
  }

  const questionIndex = session.currentQuestionIndex;
  // Enforce one-by-one async flow: interviewer can send next only after candidate answered previous question.
  if (questionIndex > 0) {
    const previousQuestionIndex = questionIndex - 1;
    const previousAnswerExists = await Message.exists({
      conversationId: session.conversationId,
      senderId: session.candidateId,
      type: "interview_answer",
      "metadata.sessionId": String(normalizedSessionId),
      "metadata.questionIndex": previousQuestionIndex
    });

    if (!previousAnswerExists) {
      throw new AppError("Candidate has not answered the current question yet.", 409);
    }
  }

  const questionData = template.questions[questionIndex];
  const nextIndex = questionIndex + 1;

  const progressResult = await InterviewSession.updateOne(
    { _id: normalizedSessionId, currentQuestionIndex: questionIndex },
    { $set: { currentQuestionIndex: nextIndex } }
  );

  if (!progressResult.modifiedCount) {
    throw new AppError("Unable to progress interview question. Please retry.", 409);
  }

  const message = await postInterviewMessage(
    session.conversationId,
    normalizedInterviewerId,
    "interview_question",
    questionData.question,
    {
      kind: "interview_question",
      sessionId: String(normalizedSessionId),
      questionIndex,
      questionNumber: questionIndex + 1,
      totalQuestions: session.totalQuestions,
      questionType: questionData.type,
      followUps: questionData.followUps ?? [],
      expectedTopics: questionData.expectedTopics ?? [],
      isLastQuestion: nextIndex >= session.totalQuestions
    }
  );

  const updatedSession = await InterviewSession.findById(normalizedSessionId).lean();
  const sessionData = serializeSession(updatedSession);

  emitToConversation(session.conversationId, "interview_question_sent", {
    session: sessionData,
    questionIndex
  });

  return { session: sessionData, message };
}

/**
 * Submit an answer to the current question. Only the candidate can do this.
 */
export async function submitAnswer(candidateId, sessionId, { answer }) {
  const normalizedCandidateId = toObjectId(candidateId);
  const normalizedSessionId = toObjectId(sessionId, "Invalid session id.");

  if (!answer || !String(answer).trim()) {
    throw new AppError("Answer content is required.", 400);
  }

  const session = await InterviewSession.findById(normalizedSessionId).lean();

  if (!session) {
    throw new AppError("Interview session not found.", 404);
  }

  if (session.status !== "active") {
    throw new AppError("Interview session is not active.", 409);
  }

  if (String(session.candidateId) !== String(normalizedCandidateId)) {
    throw new AppError("Only the candidate can submit answers.", 403);
  }
  assertLiveOnlineParticipants(session);

  const questionIndex = Math.max(0, session.currentQuestionIndex - 1);
  const existingAnswer = await Message.exists({
    conversationId: session.conversationId,
    senderId: normalizedCandidateId,
    type: "interview_answer",
    "metadata.sessionId": String(normalizedSessionId),
    "metadata.questionIndex": questionIndex
  });

  if (existingAnswer) {
    throw new AppError("You already submitted an answer for this question.", 409);
  }

  let questionText = null;
  const template = await InterviewTemplate.findById(session.templateId).select("questions").lean();
  if (template?.questions?.[questionIndex]?.question) {
    questionText = template.questions[questionIndex].question;
  }

  const message = await postInterviewMessage(
    session.conversationId,
    normalizedCandidateId,
    "interview_answer",
    String(answer).trim(),
    {
      kind: "interview_answer",
      sessionId: String(normalizedSessionId),
      questionIndex,
      questionText
    }
  );

  emitToConversation(session.conversationId, "interview_answer_submitted", {
    sessionId: String(normalizedSessionId),
    questionIndex
  });

  // Auto-dispatch next question only for text async mode.
  const refreshedSession = await InterviewSession.findById(normalizedSessionId).lean();
  if (
    refreshedSession &&
    refreshedSession.mode === "live_online"
  ) {
    const finalSession = await InterviewSession.findById(normalizedSessionId).lean();
    return { session: serializeSession(finalSession ?? session), message };
  }

  if (
    refreshedSession &&
    refreshedSession.status === "active" &&
    refreshedSession.currentQuestionIndex < refreshedSession.totalQuestions
  ) {
    const nextQuestionIndex = refreshedSession.currentQuestionIndex;
    const refreshedTemplate = await InterviewTemplate.findById(refreshedSession.templateId).select("questions").lean();
    const nextQuestion = refreshedTemplate?.questions?.[nextQuestionIndex];

    if (nextQuestion?.question) {
      const nextIndex = nextQuestionIndex + 1;
      const progressResult = await InterviewSession.updateOne(
        { _id: normalizedSessionId, currentQuestionIndex: nextQuestionIndex },
        { $set: { currentQuestionIndex: nextIndex } }
      );

      if (progressResult.modifiedCount) {
        await postInterviewMessage(
          refreshedSession.conversationId,
          refreshedSession.interviewerId,
          "interview_question",
          nextQuestion.question,
          {
            kind: "interview_question",
            sessionId: String(normalizedSessionId),
            questionIndex: nextQuestionIndex,
            questionNumber: nextQuestionIndex + 1,
            totalQuestions: refreshedSession.totalQuestions,
            questionType: nextQuestion.type,
            followUps: nextQuestion.followUps ?? [],
            expectedTopics: nextQuestion.expectedTopics ?? [],
            isLastQuestion: nextIndex >= refreshedSession.totalQuestions,
            autoDispatched: true
          }
        );
      }
    }
  } else if (
    refreshedSession &&
    refreshedSession.status === "active" &&
    refreshedSession.currentQuestionIndex >= refreshedSession.totalQuestions
  ) {
    await InterviewSession.updateOne(
      { _id: normalizedSessionId, status: "active" },
      { $set: { status: "completed", endedAt: new Date() } }
    );

    const completedSession = await InterviewSession.findById(normalizedSessionId).lean();
    if (completedSession) {
      await postInterviewMessage(
        completedSession.conversationId,
        completedSession.interviewerId,
        "interview_system",
        "All template questions answered. Interview completed.",
        {
          kind: "interview_completed",
          sessionId: String(normalizedSessionId),
          completedBy: "system_auto_after_last_answer"
        }
      );
      emitToConversation(completedSession.conversationId, "interview_completed", {
        session: serializeSession(completedSession)
      });
    }
  }

  const finalSession = await InterviewSession.findById(normalizedSessionId).lean();
  return { session: serializeSession(finalSession ?? session), message };
}

/**
 * Submit interview feedback and ratings. Only the interviewer can do this.
 */
export async function submitFeedback(interviewerId, sessionId, { ratings, feedback }) {
  const normalizedInterviewerId = toObjectId(interviewerId);
  const normalizedSessionId = toObjectId(sessionId, "Invalid session id.");

  const session = await InterviewSession.findById(normalizedSessionId).lean();

  if (!session) {
    throw new AppError("Interview session not found.", 404);
  }

  if (session.status !== "active") {
    throw new AppError("Interview session is not active.", 409);
  }

  if (String(session.interviewerId) !== String(normalizedInterviewerId)) {
    throw new AppError("Only the interviewer can submit feedback.", 403);
  }
  assertLiveOnlineParticipants(session);

  // Validate ratings (1–5)
  const validatedRatings = {};
  const ratingFields = ["communication", "technical", "problemSolving", "overall"];

  for (const field of ratingFields) {
    if (ratings && ratings[field] !== undefined && ratings[field] !== null) {
      const val = Number(ratings[field]);
      if (isNaN(val) || val < 1 || val > 5) {
        throw new AppError(`Rating for '${field}' must be between 1 and 5.`, 400);
      }
      validatedRatings[field] = val;
    }
  }

  const overallFeedback = feedback ? String(feedback).trim() : null;

  await InterviewSession.updateOne(
    { _id: normalizedSessionId },
    {
      $set: {
        finalRatings: validatedRatings,
        overallFeedback
      }
    }
  );

  const updatedSession = await InterviewSession.findById(normalizedSessionId).lean();
  const sessionData = serializeSession(updatedSession);

  const ratingLines = [];
  if (validatedRatings.overall) ratingLines.push(`Overall: ${validatedRatings.overall}/5`);
  if (validatedRatings.technical) ratingLines.push(`Technical: ${validatedRatings.technical}/5`);
  if (validatedRatings.communication) ratingLines.push(`Communication: ${validatedRatings.communication}/5`);
  if (validatedRatings.problemSolving) ratingLines.push(`Problem Solving: ${validatedRatings.problemSolving}/5`);

  const contentSummary = [
    ratingLines.join(" • "),
    overallFeedback ? `\n${overallFeedback}` : ""
  ].filter(Boolean).join("");

  const message = await postInterviewMessage(
    session.conversationId,
    normalizedInterviewerId,
    "interview_feedback",
    contentSummary || "Interview feedback submitted.",
    {
      kind: "interview_feedback",
      sessionId: String(normalizedSessionId),
      ratings: validatedRatings,
      overallFeedback,
      candidateId: String(session.candidateId)
    }
  );

  emitToConversation(session.conversationId, "interview_feedback_added", { session: sessionData });

  return { session: sessionData, message };
}

export async function proposeInterviewSlots(userId, sessionId, { proposedSlots, timezoneHint }) {
  const normalizedUserId = toObjectId(userId);
  const normalizedSessionId = toObjectId(sessionId, "Invalid session id.");
  const slots = validateProposedSlots(proposedSlots);

  const session = await InterviewSession.findById(normalizedSessionId).lean();
  if (!session) throw new AppError("Interview session not found.", 404);
  if (session.mode !== "live_online") throw new AppError("Scheduling is only available for live-online interviews.", 400);

  const isParticipant =
    String(session.interviewerId) === String(normalizedUserId) ||
    String(session.candidateId) === String(normalizedUserId);
  if (!isParticipant) throw new AppError("You are not a participant in this interview session.", 403);

  await InterviewSession.updateOne(
    { _id: normalizedSessionId },
    {
      $set: {
        status: "pending",
        scheduleStatus: "proposed",
        proposedSlots: slots,
        confirmedSlot: null,
        timezoneHint: timezoneHint ? String(timezoneHint).trim() : session.timezoneHint ?? null
      }
    }
  );

  const [updatedSession, template] = await Promise.all([
    InterviewSession.findById(normalizedSessionId).lean(),
    InterviewTemplate.findById(session.templateId).select("title type difficulty estimatedDuration").lean()
  ]);
  const sessionData = serializeSession(updatedSession);

  const message = await postInterviewMessage(
    session.conversationId,
    normalizedUserId,
    "interview_request",
    `Live-online interview slots proposed for ${template?.title ?? "mock interview"}. Please confirm one slot.`,
    {
      kind: "interview_request",
      sessionId: String(normalizedSessionId),
      templateId: String(session.templateId),
      templateTitle: template?.title ?? "Mock Interview",
      templateType: template?.type ?? null,
      templateDifficulty: template?.difficulty ?? null,
      estimatedDuration: template?.estimatedDuration ?? 30,
      totalQuestions: session.totalQuestions,
      interviewerId: String(session.interviewerId),
      candidateId: String(session.candidateId),
      requesterId: String(normalizedUserId),
      mode: "live_online",
      scheduleStatus: "proposed",
      proposedSlots: sessionData.proposedSlots,
      timezoneHint: sessionData.timezoneHint
    }
  );

  emitToConversation(session.conversationId, "interview_started", { session: sessionData });
  return { session: sessionData, message };
}

export async function confirmInterviewSlot(userId, sessionId, { confirmedSlot }) {
  const normalizedUserId = toObjectId(userId);
  const normalizedSessionId = toObjectId(sessionId, "Invalid session id.");
  const slotValue = new Date(confirmedSlot);
  if (Number.isNaN(slotValue.getTime())) {
    throw new AppError("Confirmed slot must be a valid datetime.", 400);
  }

  const session = await InterviewSession.findById(normalizedSessionId).lean();
  if (!session) throw new AppError("Interview session not found.", 404);
  if (session.mode !== "live_online") throw new AppError("Slot confirmation is only available for live-online interviews.", 400);

  const isParticipant =
    String(session.interviewerId) === String(normalizedUserId) ||
    String(session.candidateId) === String(normalizedUserId);
  if (!isParticipant) throw new AppError("You are not a participant in this interview session.", 403);

  const allowedSlots = (session.proposedSlots ?? []).map((slot) => new Date(slot).toISOString());
  if (!allowedSlots.includes(slotValue.toISOString())) {
    throw new AppError("Confirmed slot must be one of the proposed slots.", 400);
  }

  const [interviewer, candidate] = await Promise.all([
    User.findById(session.interviewerId).lean(),
    User.findById(session.candidateId).lean()
  ]);

  const eventDurationMins = 60;
  const eventStart = new Date(slotValue);
  const eventEnd = new Date(eventStart.getTime() + eventDurationMins * 60 * 1000);
  const calendarTitle = "RoleBuddy Live Online Mock Interview";
  const calendarDescription = `Conversation: ${String(session.conversationId)}\nSession: ${String(session._id)}\nJoin chat in RoleBuddy to conduct the interview.`;

  const interviewerEvent = await createGoogleCalendarEventForUser({
    user: interviewer,
    title: calendarTitle,
    description: calendarDescription,
    startAt: eventStart,
    endAt: eventEnd,
    attendeeEmail: candidate?.email ?? null
  });

  const candidateEvent = await createGoogleCalendarEventForUser({
    user: candidate,
    title: calendarTitle,
    description: calendarDescription,
    startAt: eventStart,
    endAt: eventEnd,
    attendeeEmail: interviewer?.email ?? null
  });

  await InterviewSession.updateOne(
    { _id: normalizedSessionId },
    {
      $set: {
        scheduleStatus: "confirmed",
        confirmedSlot: eventStart,
        googleCalendar: {
          interviewer: interviewerEvent,
          candidate: candidateEvent
        }
      }
    }
  );

  const updatedSession = await InterviewSession.findById(normalizedSessionId).lean();
  const sessionData = serializeSession(updatedSession);
  const partialCalendar = !(interviewerEvent.eventId && candidateEvent.eventId);

  const message = await postInterviewMessage(
    session.conversationId,
    normalizedUserId,
    "interview_system",
    partialCalendar
      ? "Live-online slot confirmed. Calendar invite was created partially; one user may need to connect Google Calendar."
      : "Live-online slot confirmed and calendar invites created.",
    {
      kind: "interview_slot_confirmed",
      sessionId: String(normalizedSessionId),
      confirmedSlot: sessionData.confirmedSlot,
      partialCalendar
    }
  );

  emitToConversation(session.conversationId, "interview_started", { session: sessionData });
  return { session: sessionData, message };
}

export async function declineInterviewScheduling(userId, sessionId) {
  const normalizedUserId = toObjectId(userId);
  const normalizedSessionId = toObjectId(sessionId, "Invalid session id.");
  const session = await InterviewSession.findById(normalizedSessionId).lean();
  if (!session) throw new AppError("Interview session not found.", 404);
  if (session.mode !== "live_online") throw new AppError("Scheduling decline is only available for live-online interviews.", 400);

  const isParticipant =
    String(session.interviewerId) === String(normalizedUserId) ||
    String(session.candidateId) === String(normalizedUserId);
  if (!isParticipant) throw new AppError("You are not a participant in this interview session.", 403);

  await InterviewSession.updateOne(
    { _id: normalizedSessionId },
    {
      $set: {
        status: "pending",
        scheduleStatus: null,
        proposedSlots: [],
        confirmedSlot: null
      }
    }
  );

  const updatedSession = await InterviewSession.findById(normalizedSessionId).lean();
  const sessionData = serializeSession(updatedSession);

  const message = await postInterviewMessage(
    session.conversationId,
    normalizedUserId,
    "interview_system",
    "Live-online scheduling was declined. Please propose new times to continue.",
    {
      kind: "interview_schedule_declined",
      sessionId: String(normalizedSessionId)
    }
  );

  emitToConversation(session.conversationId, "interview_completed", { session: sessionData });
  return { session: sessionData, message };
}

export async function getGoogleCalendarConnectUrl(userId) {
  const normalizedUserId = toObjectId(userId);
  if (!isGoogleCalendarConfigured()) {
    throw new AppError("Google Calendar integration is not configured.", 400);
  }

  const state = Buffer.from(
    JSON.stringify({ userId: String(normalizedUserId), nonce: crypto.randomBytes(8).toString("hex") })
  ).toString("base64url");

  const query = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleOAuthRedirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/calendar.events",
    state
  });

  return { connectUrl: `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}` };
}

export async function completeGoogleCalendarOAuth({ code, state }) {
  if (!code || !state) {
    throw new AppError("Missing OAuth code or state.", 400);
  }
  if (!isGoogleCalendarConfigured()) {
    throw new AppError("Google Calendar integration is not configured.", 400);
  }

  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(String(state), "base64url").toString("utf8"));
  } catch {
    throw new AppError("Invalid OAuth state.", 400);
  }

  const normalizedUserId = toObjectId(decoded?.userId, "Invalid OAuth user.");
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      code: String(code),
      grant_type: "authorization_code",
      redirect_uri: env.googleOAuthRedirectUri
    })
  });

  if (!tokenRes.ok) {
    throw new AppError("Unable to complete Google OAuth.", 400);
  }

  const tokenPayload = await tokenRes.json();

  await User.updateOne(
    { _id: normalizedUserId },
    {
      $set: {
        googleCalendar: {
          connected: true,
          accessToken: tokenPayload.access_token ?? null,
          refreshToken: tokenPayload.refresh_token ?? null,
          expiryDate: tokenPayload.expires_in ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000) : null,
          scope: tokenPayload.scope ?? null,
          email: null
        }
      }
    }
  );

  return { connected: true };
}

export async function disconnectGoogleCalendar(userId) {
  const normalizedUserId = toObjectId(userId);
  await User.updateOne(
    { _id: normalizedUserId },
    {
      $set: {
        googleCalendar: {
          connected: false,
          accessToken: null,
          refreshToken: null,
          expiryDate: null,
          scope: null,
          email: null
        }
      }
    }
  );
  return { connected: false };
}

export async function getGoogleCalendarStatus(userId) {
  const normalizedUserId = toObjectId(userId);
  const user = await User.findById(normalizedUserId).select("googleCalendar").lean();
  if (!user) throw new AppError("User not found.", 404);
  return {
    configured: isGoogleCalendarConfigured(),
    connected: Boolean(user.googleCalendar?.connected)
  };
}

/**
 * Complete an interview session without feedback (close it out).
 */
export async function completeInterview(userId, sessionId) {
  const normalizedUserId = toObjectId(userId);
  const normalizedSessionId = toObjectId(sessionId, "Invalid session id.");

  const session = await InterviewSession.findById(normalizedSessionId).lean();

  if (!session) {
    throw new AppError("Interview session not found.", 404);
  }

  if (!["active", "paused"].includes(session.status)) {
    throw new AppError("Interview session cannot be completed in its current state.", 409);
  }

  const isParticipant =
    String(session.interviewerId) === String(normalizedUserId) ||
    String(session.candidateId) === String(normalizedUserId);

  if (!isParticipant) {
    throw new AppError("You are not a participant in this interview session.", 403);
  }

  await InterviewSession.updateOne(
    { _id: normalizedSessionId },
    { $set: { status: "completed", endedAt: new Date() } }
  );

  const updatedSession = await InterviewSession.findById(normalizedSessionId).lean();
  const sessionData = serializeSession(updatedSession);

  const message = await postInterviewMessage(
    session.conversationId,
    normalizedUserId,
    "interview_system",
    "Mock interview session completed.",
    {
      kind: "interview_completed",
      sessionId: String(normalizedSessionId),
      completedBy: String(normalizedUserId)
    }
  );

  emitToConversation(session.conversationId, "interview_completed", { session: sessionData });

  return { session: sessionData, message };
}

/**
 * Pause an active interview session.
 */
export async function pauseInterview(userId, sessionId) {
  const normalizedUserId = toObjectId(userId);
  const normalizedSessionId = toObjectId(sessionId, "Invalid session id.");

  const session = await InterviewSession.findById(normalizedSessionId).lean();

  if (!session) {
    throw new AppError("Interview session not found.", 404);
  }

  const isParticipant =
    String(session.interviewerId) === String(normalizedUserId) ||
    String(session.candidateId) === String(normalizedUserId);

  if (!isParticipant) {
    throw new AppError("You are not a participant in this interview session.", 403);
  }

  if (session.status === "paused") {
    return { session: serializeSession(session), message: null };
  }

  if (session.status !== "active") {
    throw new AppError("Only an active interview session can be paused.", 409);
  }

  await InterviewSession.updateOne(
    { _id: normalizedSessionId },
    { $set: { status: "paused" } }
  );

  const updatedSession = await InterviewSession.findById(normalizedSessionId).lean();
  const sessionData = serializeSession(updatedSession);

  const message = await postInterviewMessage(
    session.conversationId,
    normalizedUserId,
    "interview_system",
    "Mock interview paused. You can continue later.",
    {
      kind: "interview_paused",
      sessionId: String(normalizedSessionId),
      pausedBy: String(normalizedUserId)
    }
  );

  emitToConversation(session.conversationId, "interview_paused", { session: sessionData });

  return { session: sessionData, message };
}

export async function pauseLiveOnlineInterviewOnDisconnect(userId) {
  const normalizedUserId = toObjectId(userId);
  const sessions = await InterviewSession.find({
    mode: "live_online",
    status: "active",
    $or: [{ interviewerId: normalizedUserId }, { candidateId: normalizedUserId }]
  }).lean();

  for (const session of sessions) {
    const bothOnline = areUsersOnline([session.interviewerId, session.candidateId]);
    if (bothOnline) continue;
    const missed = session.scheduleStatus === "confirmed" && session.confirmedSlot && new Date(session.confirmedSlot).getTime() <= Date.now();

    await InterviewSession.updateOne(
      { _id: session._id, status: "active" },
      { $set: { status: "paused", scheduleStatus: missed ? "missed" : session.scheduleStatus ?? null } }
    );

    const updatedSession = await InterviewSession.findById(session._id).lean();
    if (!updatedSession) continue;
    const sessionData = serializeSession(updatedSession);

    await postInterviewMessage(
      session.conversationId,
      normalizedUserId,
      "interview_system",
      missed
        ? "Live-online slot was missed because one participant was offline. Please reschedule."
        : "Live-online interview paused because one participant went offline.",
      {
        kind: missed ? "interview_slot_missed" : "interview_paused_offline",
        sessionId: String(session._id),
        pausedBy: String(normalizedUserId)
      }
    );

    emitToConversation(session.conversationId, "interview_paused", { session: sessionData });
    emitToConversation(session.conversationId, "interview_presence_changed", {
      sessionId: String(session._id),
      mode: sessionData.mode,
      liveOnlineStatus: sessionData.liveOnlineStatus
    });
  }
}

/**
 * Get the active or pending interview session for a conversation.
 */
export async function getActiveSession(conversationId, userId) {
  const normalizedConversationId = toObjectId(conversationId, "Invalid conversation id.");
  const normalizedUserId = toObjectId(userId);

  await assertConversationParticipant(normalizedConversationId, normalizedUserId);

  const session = await InterviewSession.findOne({
    conversationId: normalizedConversationId,
    status: { $in: ["pending", "active", "paused"] }
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!session) {
    return { session: null };
  }

  if (isSlotMissed(session) && ["pending", "active"].includes(session.status)) {
    await InterviewSession.updateOne(
      { _id: session._id },
      { $set: { status: "paused", scheduleStatus: "missed" } }
    );
    const refreshed = await InterviewSession.findById(session._id).lean();
    if (refreshed) {
      await postInterviewMessage(
        refreshed.conversationId,
        refreshed.interviewerId,
        "interview_system",
        "Scheduled live-online slot was missed. Please propose new slots.",
        {
          kind: "interview_slot_missed",
          sessionId: String(refreshed._id)
        }
      );
    }
  }

  const effectiveSession = await InterviewSession.findById(session._id).lean() ?? session;

  // Fetch template info to include with session
  const template = await InterviewTemplate.findById(effectiveSession.templateId)
    .select("title type difficulty estimatedDuration questions")
    .lean();

  const sessionData = {
    ...serializeSession(effectiveSession),
    template: template ? serializeTemplate(template) : null
  };

  return { session: sessionData };
}

// ── Phase 2: Template Management ───────────────────────────────────────────────────

const VALID_TEMPLATE_TYPES = ["technical", "hr", "behavioral", "mixed", "resume_round"];
const VALID_DOMAINS = ["tech", "non-tech", "any"];
const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const VALID_QUESTION_TYPES = ["open", "technical", "behavioral", "situational"];

function validateTemplatePayload({ title, domain, type, difficulty, questions } = {}) {
  if (!title || !String(title).trim()) {
    throw new AppError("Template title is required.", 400);
  }
  if (!domain || !VALID_DOMAINS.includes(domain)) {
    throw new AppError(`Domain must be one of: ${VALID_DOMAINS.join(", ")}.`, 400);
  }
  if (!type || !VALID_TEMPLATE_TYPES.includes(type)) {
    throw new AppError(`Type must be one of: ${VALID_TEMPLATE_TYPES.join(", ")}.`, 400);
  }
  if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
    throw new AppError(`Difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}.`, 400);
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError("At least one question is required.", 400);
  }
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question || !String(q.question).trim()) {
      throw new AppError(`Question ${i + 1} text is required.`, 400);
    }
    if (q.type && !VALID_QUESTION_TYPES.includes(q.type)) {
      throw new AppError(`Question ${i + 1} type must be one of: ${VALID_QUESTION_TYPES.join(", ")}.`, 400);
    }
  }
}

function sanitizeQuestions(questions) {
  return (questions ?? []).map((q) => ({
    question: String(q.question).trim(),
    type: VALID_QUESTION_TYPES.includes(q.type) ? q.type : "open",
    followUps: Array.isArray(q.followUps)
      ? q.followUps.filter((f) => typeof f === "string" && f.trim()).map((f) => String(f).trim())
      : [],
    expectedTopics: Array.isArray(q.expectedTopics)
      ? q.expectedTopics.filter((t) => typeof t === "string" && t.trim()).map((t) => String(t).trim())
      : [],
    notes: q.notes ? String(q.notes).trim() : null
  }));
}

/**
 * Create a new user-owned interview template.
 */
export async function createUserTemplate(userId, payload) {
  const normalizedUserId = toObjectId(userId);

  validateTemplatePayload(payload);

  const { title, domain, type, difficulty, role, estimatedDuration, visibility, tags, questions } = payload;

  const template = await InterviewTemplate.create({
    title: String(title).trim(),
    domain,
    type,
    difficulty,
    role: role ? String(role).trim() : null,
    estimatedDuration: Number(estimatedDuration) > 0 ? Number(estimatedDuration) : 30,
    visibility: visibility === "private" ? "private" : "public",
    tags: Array.isArray(tags) ? tags.filter(Boolean).map((t) => String(t).trim()) : [],
    questions: sanitizeQuestions(questions),
    isSystemTemplate: false,
    createdBy: normalizedUserId,
    isActive: true,
    usageCount: 0
  });

  return serializeTemplate(template.toObject());
}

/**
 * Update a user-owned template. Only the creator can update.
 */
export async function updateUserTemplate(userId, templateId, payload) {
  const normalizedUserId = toObjectId(userId);
  const normalizedTemplateId = toObjectId(templateId, "Invalid template id.");

  const template = await InterviewTemplate.findById(normalizedTemplateId).lean();

  if (!template) {
    throw new AppError("Template not found.", 404);
  }
  if (template.isSystemTemplate) {
    throw new AppError("System templates cannot be edited.", 403);
  }
  if (String(template.createdBy) !== String(normalizedUserId)) {
    throw new AppError("You can only edit your own templates.", 403);
  }

  // Validate what's being updated
  const merged = {
    title: payload.title ?? template.title,
    domain: payload.domain ?? template.domain,
    type: payload.type ?? template.type,
    difficulty: payload.difficulty ?? template.difficulty,
    questions: payload.questions ?? template.questions
  };
  validateTemplatePayload(merged);

  const update = {};
  if (payload.title) update.title = String(payload.title).trim();
  if (payload.domain && VALID_DOMAINS.includes(payload.domain)) update.domain = payload.domain;
  if (payload.type && VALID_TEMPLATE_TYPES.includes(payload.type)) update.type = payload.type;
  if (payload.difficulty && VALID_DIFFICULTIES.includes(payload.difficulty)) update.difficulty = payload.difficulty;
  if (payload.role !== undefined) update.role = payload.role ? String(payload.role).trim() : null;
  if (payload.estimatedDuration) update.estimatedDuration = Number(payload.estimatedDuration);
  if (payload.visibility && ["public", "private"].includes(payload.visibility)) update.visibility = payload.visibility;
  if (Array.isArray(payload.tags)) update.tags = payload.tags.filter(Boolean).map((t) => String(t).trim());
  if (Array.isArray(payload.questions)) update.questions = sanitizeQuestions(payload.questions);

  const updated = await InterviewTemplate.findByIdAndUpdate(
    normalizedTemplateId,
    { $set: update },
    { new: true }
  ).lean();

  return serializeTemplate(updated);
}

/**
 * Soft-delete a user-owned template. Only the creator can delete.
 */
export async function deleteUserTemplate(userId, templateId) {
  const normalizedUserId = toObjectId(userId);
  const normalizedTemplateId = toObjectId(templateId, "Invalid template id.");

  const template = await InterviewTemplate.findById(normalizedTemplateId).lean();

  if (!template) {
    throw new AppError("Template not found.", 404);
  }
  if (template.isSystemTemplate) {
    throw new AppError("System templates cannot be deleted.", 403);
  }
  if (String(template.createdBy) !== String(normalizedUserId)) {
    throw new AppError("You can only delete your own templates.", 403);
  }

  await InterviewTemplate.updateOne(
    { _id: normalizedTemplateId },
    { $set: { isActive: false } }
  );

  return { deleted: true };
}

/**
 * Duplicate any accessible template (own/public/system) as a new private user template.
 */
export async function duplicateTemplate(userId, templateId) {
  const normalizedUserId = toObjectId(userId);
  const normalizedTemplateId = toObjectId(templateId, "Invalid template id.");

  const template = await InterviewTemplate.findOne({
    _id: normalizedTemplateId,
    isActive: true,
    $or: [
      { createdBy: normalizedUserId },
      { visibility: "public" }
    ]
  }).lean();

  if (!template) {
    throw new AppError("Template not found or not accessible.", 404);
  }

  const duplicate = await InterviewTemplate.create({
    title: `${template.title} (copy)`,
    domain: template.domain,
    type: template.type,
    difficulty: template.difficulty,
    role: template.role ?? null,
    estimatedDuration: template.estimatedDuration,
    questions: template.questions,
    visibility: "private",
    isSystemTemplate: false,
    createdBy: normalizedUserId,
    isActive: true,
    usageCount: 0,
    tags: template.tags ?? []
  });

  return serializeTemplate(duplicate.toObject());
}

/**
 * Get all templates owned by the current user.
 */
export async function getUserTemplates(userId) {
  const normalizedUserId = toObjectId(userId);

  const templates = await InterviewTemplate.find({
    createdBy: normalizedUserId,
    isActive: true
  })
    .sort({ updatedAt: -1 })
    .lean();

  return templates.map(serializeTemplate);
}

/**
 * Get public templates with optional filters for discovery.
 */
export async function getPublicTemplates({ domain, type, difficulty, role } = {}) {
  const filter = {
    isActive: true,
    visibility: "public"
  };

  if (domain && VALID_DOMAINS.includes(domain)) {
    filter.$or = [{ domain }, { domain: "any" }];
  }

  if (type && VALID_TEMPLATE_TYPES.includes(type)) {
    filter.type = type;
  }

  if (difficulty && VALID_DIFFICULTIES.includes(difficulty)) {
    filter.difficulty = difficulty;
  }

  if (role && String(role).trim()) {
    filter.role = { $regex: new RegExp(String(role).trim(), "i") };
  }

  const templates = await InterviewTemplate.find(filter)
    .sort({ isSystemTemplate: -1, usageCount: -1, createdAt: -1 })
    .lean();

  return templates.map(serializeTemplate);
}
