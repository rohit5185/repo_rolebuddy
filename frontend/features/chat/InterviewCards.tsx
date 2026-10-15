"use client";

import { useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Star,
  Timer,
  UserCheck,
  X,
  XCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChatMessage, InterviewRatings, InterviewSession } from "./types";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function RatingDisplay({ label, value }: { label: string; value: number | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-semibold text-[#464556]">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`h-2 w-5 rounded-full transition-colors ${
              n <= value ? "bg-[#3b2ae1]" : "bg-[#e4e2f0]"
            }`}
          />
        ))}
        <span className="ml-1 text-[11px] font-black text-[#3b2ae1]">{value}/5</span>
      </div>
    </div>
  );
}

// ── InterviewRequestCard ──────────────────────────────────────────────────────

type InterviewRequestCardProps = {
  message: ChatMessage;
  isOwn: boolean;
  currentUserId: string | null;
  activeInterviewSession?: InterviewSession | null;
  onAccept: (sessionId: string) => void;
  onDecline: (sessionId: string) => void;
  onConfirmSlot?: (sessionId: string, slot: string) => void;
  onDeclineSchedule?: (sessionId: string) => void;
  onProposeSlots?: (sessionId: string) => void;
};

export function InterviewRequestCard({
  message,
  isOwn,
  currentUserId,
  activeInterviewSession,
  onAccept,
  onDecline,
  onConfirmSlot,
  onDeclineSchedule,
  onProposeSlots
}: InterviewRequestCardProps) {
  const meta = message.metadata as Record<string, unknown>;
  const sessionId = String(meta.sessionId ?? "");
  const templateTitle = String(meta.templateTitle ?? "Mock Interview");
  const templateType = String(meta.templateType ?? "");
  const difficulty = String(meta.difficulty ?? meta.templateDifficulty ?? "");
  const estimatedDuration = Number(meta.estimatedDuration ?? 30);
  const totalQuestions = Number(meta.totalQuestions ?? 0);
  const interviewerId = String(meta.interviewerId ?? "");
  const candidateId = String(meta.candidateId ?? "");
  const mode = String(meta.mode ?? "text_async");
  const proposedSlots = Array.isArray(meta.proposedSlots) ? (meta.proposedSlots as string[]) : [];
  const sessionSlots = activeInterviewSession?.id === sessionId
    ? activeInterviewSession.proposedSlots ?? proposedSlots
    : proposedSlots;
  const confirmedSlot = activeInterviewSession?.id === sessionId
    ? activeInterviewSession.confirmedSlot ?? null
    : null;
  const isInterviewer = currentUserId === interviewerId;
  const isReceiver = !isOwn;
  const canScheduleConfirm = mode === "live_online" && sessionSlots.length > 0;
  const canAccept = mode !== "live_online" || Boolean(confirmedSlot);

  const typeLabel: Record<string, string> = {
    technical: "Technical",
    hr: "HR",
    behavioral: "Behavioral",
    mixed: "Mixed",
    resume_round: "Resume Round"
  };

  const difficultyColor: Record<string, string> = {
    beginner: "bg-[#e8f7f5] text-[#108278]",
    intermediate: "bg-[#eef0ff] text-[#3b2ae1]",
    advanced: "bg-[#fff0f0] text-[#ba1a1a]"
  };

  return (
    <article className="max-w-[92%] rounded-[1.5rem] border border-[rgba(59,42,225,0.2)] bg-gradient-to-br from-[#f5f5ff] via-white to-[#eef0ff] p-4 shadow-[0_18px_50px_rgba(59,42,225,0.08)] sm:max-w-[80%]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-[#3b2ae1]/10 p-2 text-[#3b2ae1] shrink-0">
          <BrainCircuit className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5755a4]">
              Mock Interview Request
            </p>
            <p className="mt-1 text-sm font-bold text-[#1b1b24]">{templateTitle}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {templateType && (
                <span className="rounded-full bg-[#3b2ae1]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3b2ae1]">
                  {typeLabel[templateType] ?? templateType}
                </span>
              )}
              {difficulty && (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${difficultyColor[difficulty] ?? "bg-rb-sub text-rb-muted"}`}>
                  {difficulty}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-[11px] text-[#464556]">
            <span className="flex items-center gap-1">
              <Timer className="h-3.5 w-3.5 text-[#777588]" />
              {estimatedDuration} min
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-[#777588]" />
              {totalQuestions} questions
            </span>
            <span className="flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-[#777588]" />
              {isOwn
                ? isInterviewer
                  ? "You are the Interviewer"
                  : "You are the Candidate"
                : isInterviewer
                ? "Partner is Interviewer"
                : "Partner is Candidate"}
            </span>
            <span className="flex items-center gap-1">
              <Timer className="h-3.5 w-3.5 text-[#777588]" />
              {mode === "live_online" ? "Live Online" : "Text Async"}
            </span>
          </div>

          {mode === "live_online" && sessionSlots.length > 0 && (
            <div className="rounded-lg border border-rb-border bg-white p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5755a4]">Proposed slots</p>
              {confirmedSlot ? (
                <p className="mt-1 text-[11px] font-semibold text-[#1f6d42]">
                  Confirmed slot: {new Date(confirmedSlot).toLocaleString()}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-[#777588]">Tap one slot to confirm it before accepting.</p>
              )}
              <div className="mt-1.5 space-y-1.5">
                {sessionSlots.map((slot) => {
                  const isConfirmedSlot = confirmedSlot
                    ? new Date(slot).toISOString() === new Date(confirmedSlot).toISOString()
                    : false;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!isReceiver || !canScheduleConfirm || Boolean(confirmedSlot)}
                      onClick={() => onConfirmSlot?.(sessionId, slot)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all ${
                        isConfirmedSlot
                          ? "border-[#3b2ae1] bg-[#3b2ae1] text-white shadow-sm"
                          : isReceiver && canScheduleConfirm
                          ? "border-[rgba(59,42,225,0.25)] bg-white text-[#1b1b24] hover:border-[rgba(59,42,225,0.5)] hover:bg-[#eef0ff]"
                          : "border-rb-border bg-rb-surface text-rb-muted"
                      }`}
                      aria-pressed={isConfirmedSlot}
                    >
                      {new Date(slot).toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === "live_online" && onProposeSlots && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => onProposeSlots(sessionId)}
                variant="secondary"
                className="h-9 rounded-full border border-[rgba(59,42,225,0.2)] bg-[#eef0ff] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#3b2ae1] hover:bg-[#e3e6ff]"
              >
                Propose My Times
              </Button>
            </div>
          )}

          {isReceiver && sessionId && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => onAccept(sessionId)}
                disabled={!canAccept}
                className="h-9 rounded-full bg-[#3b2ae1] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#2c1eb8]"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                {mode === "live_online" && !confirmedSlot ? "Confirm a Slot First" : "Accept"}
              </Button>
              {canScheduleConfirm && (
                <Button
                  type="button"
                  onClick={() => onDeclineSchedule?.(sessionId)}
                  variant="secondary"
                  className="h-9 rounded-full border border-[#ba1a1a]/20 bg-[#ffdad6] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#93000a] hover:bg-[#ffd0ca]"
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Decline Schedule
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={() => onDecline(sessionId)}
                className="h-9 rounded-full border border-[#ba1a1a]/20 bg-[#ffdad6] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#93000a] hover:bg-[#ffd0ca]"
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Decline
              </Button>
            </div>
          )}

          {isOwn && (
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef0ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3b2ae1]">
              <Timer className="h-3.5 w-3.5" />
              Waiting for partner's response
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">
        {formatTimestamp(message.createdAt)}
      </div>
    </article>
  );
}

// ── InterviewSystemCard ───────────────────────────────────────────────────────

type InterviewSystemCardProps = {
  message: ChatMessage;
};

export function InterviewSystemCard({ message }: InterviewSystemCardProps) {
  const meta = message.metadata as Record<string, unknown>;
  const kind = String(meta.kind ?? "");
  const timestamp = formatTimestamp(message.createdAt);

  const isAccepted = kind === "interview_accepted";
  const isDeclined = kind === "interview_declined";
  const isCompleted = kind === "interview_completed";

  const borderColor = isDeclined
    ? "rgba(181,75,54,0.2)"
    : isCompleted
    ? "rgba(31,109,66,0.25)"
    : "rgba(59,42,225,0.2)";

  const bgFrom = isDeclined ? "#fff8f7" : isCompleted ? "#e6f5ec" : "#eef0ff";
  const labelColor = isDeclined ? "#ba1a1a" : isCompleted ? "#1f6d42" : "#3b2ae1";
  const label = isDeclined
    ? "Interview Declined"
    : isCompleted
    ? "Interview Completed"
    : isAccepted
    ? "Interview Started"
    : "Interview Update";

  return (
    <article
      className="max-w-[92%] rounded-[1.25rem] border p-4 shadow-sm sm:max-w-[80%]"
      style={{ borderColor, background: `linear-gradient(135deg, ${bgFrom}, white)` }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: labelColor }}>
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold leading-6 text-[#1b1b24]">{message.content}</p>
      {Boolean(meta.totalQuestions) && (
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#464556]">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {String(meta.totalQuestions)} questions
          </span>
        </div>
      )}
      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{timestamp}</div>
    </article>
  );
}

// ── InterviewQuestionCard ─────────────────────────────────────────────────────

type InterviewQuestionCardProps = {
  message: ChatMessage;
  isOwn: boolean;
  currentUserId: string | null;
  sessionCandidateId: string | null;
  onSubmitAnswer: (sessionId: string, answer: string) => void;
  hasAnswered: boolean;
};

export function InterviewQuestionCard({
  message,
  isOwn,
  currentUserId,
  sessionCandidateId,
  onSubmitAnswer,
  hasAnswered
}: InterviewQuestionCardProps) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const meta = message.metadata as Record<string, unknown>;
  const sessionId = String(meta.sessionId ?? "");
  const questionNumber = Number(meta.questionNumber ?? 1);
  const totalQuestions = Number(meta.totalQuestions ?? 0);
  const followUps = Array.isArray(meta.followUps) ? (meta.followUps as string[]) : [];
  const expectedTopics = Array.isArray(meta.expectedTopics) ? (meta.expectedTopics as string[]) : [];
  const isLastQuestion = Boolean(meta.isLastQuestion);
  const isCandidate = currentUserId === sessionCandidateId;
  const timestamp = formatTimestamp(message.createdAt);

  async function handleSubmit() {
    if (!answer.trim() || !sessionId) return;
    setSubmitting(true);
    try {
      await onSubmitAnswer(sessionId, answer.trim());
      setAnswer("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="max-w-[92%] rounded-[1.5rem] border border-[rgba(59,42,225,0.25)] bg-gradient-to-br from-white via-white to-[#f5f5ff] p-4 shadow-[0_18px_50px_rgba(59,42,225,0.08)] sm:max-w-[82%]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3b2ae1] text-[11px] font-black text-white">
          {questionNumber}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5755a4]">
                Question {questionNumber}{totalQuestions > 0 ? ` of ${totalQuestions}` : ""}
              </p>
              {isLastQuestion && (
                <span className="rounded-full bg-[#e8f7f5] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#108278]">
                  Final
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm font-semibold leading-6 text-[#1b1b24]">{message.content}</p>
          </div>

          {/* Interviewer only — follow-ups and expected topics */}
          {isOwn && followUps.length > 0 && (
            <div className="rounded-xl border border-dashed border-[rgba(59,42,225,0.2)] bg-[#fafafe] p-3 space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#777588]">Follow-up prompts</p>
              <ul className="space-y-1">
                {followUps.map((fu, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#464556]">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3b2ae1]" />
                    {fu}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Candidate only — answer input */}
          {isCandidate && !hasAnswered && (
            <div className="space-y-2">
              <textarea
                className="w-full rounded-xl border border-rb-border bg-white px-3 py-2 text-sm text-[#1b1b24] placeholder:text-rb-muted focus:border-[#3b2ae1] focus:outline-none focus:ring-1 focus:ring-[#3b2ae1]/20 resize-none"
                rows={3}
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitting}
              />
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!answer.trim() || submitting}
                className="h-9 rounded-full bg-[#3b2ae1] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#2c1eb8] disabled:opacity-50"
              >
                Submit Answer
              </Button>
            </div>
          )}

          {isCandidate && hasAnswered && (
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f7f5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#108278]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Answer submitted
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{timestamp}</div>
    </article>
  );
}

// ── InterviewAnswerCard ───────────────────────────────────────────────────────

type InterviewAnswerCardProps = {
  message: ChatMessage;
  isOwn: boolean;
};

export function InterviewAnswerCard({ message, isOwn }: InterviewAnswerCardProps) {
  const timestamp = formatTimestamp(message.createdAt);
  const meta = message.metadata as Record<string, unknown>;
  const questionIndex = Number(meta.questionIndex ?? 0);
  const questionText = typeof meta.questionText === "string" ? meta.questionText : null;

  return (
    <article
      className={`max-w-[92%] rounded-[1.4rem] border px-4 py-3.5 shadow-[0_18px_40px_rgba(59,42,225,0.06)] sm:max-w-[80%] ${
        isOwn
          ? "ml-auto border-[rgba(59,42,225,0.2)] bg-[#3b2ae1] text-white rounded-br-sm"
          : "border-[rgba(59,42,225,0.15)] bg-white text-[#1b1b24] rounded-bl-sm"
      }`}
    >
      <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${isOwn ? "text-white/70" : "text-[#5755a4]"}`}>
        Answer {questionIndex >= 0 ? `· Q${questionIndex + 1}` : ""}
      </p>
      {questionText ? (
        <div className={`mt-1.5 rounded-lg border px-2.5 py-2 text-xs leading-5 ${isOwn ? "border-white/20 bg-white/10 text-white/85" : "border-rb-border bg-rb-surface text-rb-muted"}`}>
          <span className="font-bold">Question:</span> {questionText}
        </div>
      ) : null}
      <p className="mt-1.5 text-sm leading-6">{message.content}</p>
      <div className={`mt-3 text-[10px] font-bold uppercase tracking-[0.16em] ${isOwn ? "text-white/60" : "text-[#777588]"}`}>
        {timestamp}
      </div>
    </article>
  );
}

// ── InterviewFeedbackCard ─────────────────────────────────────────────────────

type InterviewFeedbackCardProps = {
  message: ChatMessage;
  isOwn: boolean;
};

export function InterviewFeedbackCard({ message, isOwn }: InterviewFeedbackCardProps) {
  const meta = message.metadata as Record<string, unknown>;
  const ratings = (meta.ratings ?? {}) as Record<string, number | null | undefined>;
  const overallFeedback = meta.overallFeedback ? String(meta.overallFeedback) : null;
  const timestamp = formatTimestamp(message.createdAt);

  const ratingFields: Array<{ key: string; label: string }> = [
    { key: "overall", label: "Overall" },
    { key: "technical", label: "Technical" },
    { key: "communication", label: "Communication" },
    { key: "problemSolving", label: "Problem Solving" }
  ];

  const hasAnyRating = ratingFields.some((f) => ratings[f.key] != null);

  return (
    <article className="max-w-[92%] rounded-[1.5rem] border border-[rgba(31,109,66,0.25)] bg-gradient-to-br from-[#e6f5ec] via-white to-white p-4 shadow-[0_18px_50px_rgba(31,109,66,0.08)] sm:max-w-[80%]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-[#1f6d42]/10 p-2 text-[#1f6d42] shrink-0">
          <Star className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1f6d42]">
              Interview Feedback
            </p>
            <p className="mt-0.5 text-[11px] text-[#777588]">
              {isOwn ? "Your feedback as interviewer" : "Feedback from your interviewer"}
            </p>
          </div>

          {hasAnyRating && (
            <div className="space-y-2 rounded-xl border border-[rgba(31,109,66,0.15)] bg-white p-3">
              {ratingFields.map(({ key, label }) =>
                ratings[key] != null ? (
                  <RatingDisplay key={key} label={label} value={ratings[key] as number} />
                ) : null
              )}
            </div>
          )}

          {overallFeedback && (
            <div className="rounded-xl border border-[rgba(31,109,66,0.15)] bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#777588]">Written Feedback</p>
              <p className="mt-1.5 text-sm leading-6 text-[#1b1b24]">{overallFeedback}</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{timestamp}</div>
    </article>
  );
}
