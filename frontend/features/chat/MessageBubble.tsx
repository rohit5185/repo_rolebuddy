"use client";

import { CheckCircle2, MessageSquareWarning, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  InterviewAnswerCard,
  InterviewFeedbackCard,
  InterviewQuestionCard,
  InterviewRequestCard,
  InterviewSystemCard
} from "./InterviewCards";
import {
  InterviewMeetingCard,
  InterviewScheduleRequestCard,
  InterviewScheduleSystemCard
} from "./InterviewMeetingCards";
import { pickTemplatePreviewLines } from "./exchangeTemplatePreview";
import type { ChatMessage, InterviewSession } from "./types";


type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  currentUserId: string | null;
  hasCurrentUserResponded: boolean;
  activeInterviewSession?: InterviewSession | null;
  onRespondCheckin: (payload: { sourceCheckinId: string; status: "done" | "not_done" }) => void;
  onOpenExchange?: () => void;
  // Interview props
  sessionCandidateId?: string | null;
  sessionAnsweredQuestions?: Set<number>;
  onProposeInterviewSlots?: (sessionId: string) => void;
  onAcceptInterview?: (sessionId: string) => void;
  onDeclineInterview?: (sessionId: string) => void;
  onConfirmInterviewSlot?: (sessionId: string, slot: string) => void;
  onDeclineInterviewSchedule?: (sessionId: string) => void;
  onSubmitAnswer?: (sessionId: string, answer: string) => void;
  // Phase 3: Meeting props
  onAcceptMeeting?: (meetingId: string) => void;
  onDeclineMeeting?: (meetingId: string) => void;
  onCancelMeeting?: (meetingId: string) => void;
  onProposeNewTime?: (meetingId: string) => void;
};



function formatTimestamp(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
  hasCurrentUserResponded,
  activeInterviewSession,
  onRespondCheckin,
  onOpenExchange,
  sessionCandidateId,
  sessionAnsweredQuestions,
  onProposeInterviewSlots,
  onAcceptInterview,
  onDeclineInterview,
  onConfirmInterviewSlot,
  onDeclineInterviewSchedule,
  onSubmitAnswer,
  onAcceptMeeting,
  onDeclineMeeting,
  onCancelMeeting,
  onProposeNewTime
}: MessageBubbleProps) {


  const baseTimestamp = formatTimestamp(message.createdAt);
  const promptQuestion = typeof message.metadata.question === "string" ? message.metadata.question : message.content;
  const sourceCheckinId = typeof message.metadata.sourceCheckinId === "string" ? message.metadata.sourceCheckinId : null;
  const isDailyCheckin = message.type === "checkin" && message.metadata.kind === "daily_checkin";
  const isCheckinResponse = message.type === "checkin" && message.metadata.kind === "checkin_response";
  const isAlert = message.type === "alert";
  const isSystem = message.type === "system" || message.type === "reminder";
  const isExchangeTemplate = isSystem && message.metadata.kind === "exchange_template";

  // ── Phase 3: Meeting message types ──
  if (message.type === "interview_schedule_request") {
    return (
      <InterviewScheduleRequestCard
        message={message}
        isOwn={isOwn}
        currentUserId={currentUserId}
        onAcceptMeeting={onAcceptMeeting}
        onDeclineMeeting={onDeclineMeeting}
        onProposeNewTime={onProposeNewTime}
      />
    );

  }

  if (message.type === "interview_meeting_card") {
    return (
      <InterviewMeetingCard
        message={message}
        isOwn={isOwn}
        currentUserId={currentUserId}
        onCancelMeeting={onCancelMeeting}
      />
    );
  }

  if (message.type === "interview_schedule_system") {
    return <InterviewScheduleSystemCard message={message} />;
  }

  // ── Interview message types ──
  if (message.type === "interview_request") {

    return (
      <InterviewRequestCard
        message={message}
        isOwn={isOwn}
        currentUserId={currentUserId}
        activeInterviewSession={activeInterviewSession}
        onAccept={onAcceptInterview ?? (() => {})}
        onDecline={onDeclineInterview ?? (() => {})}
        onConfirmSlot={onConfirmInterviewSlot}
        onDeclineSchedule={onDeclineInterviewSchedule}
        onProposeSlots={onProposeInterviewSlots}
      />
    );
  }

  if (message.type === "interview_system") {
    return <InterviewSystemCard message={message} />;
  }

  if (message.type === "interview_question") {
    const meta = message.metadata as Record<string, unknown>;
    const qIdx = Number(meta.questionIndex ?? 0);
    const hasAnswered = sessionAnsweredQuestions?.has(qIdx) ?? false;
    return (
      <InterviewQuestionCard
        message={message}
        isOwn={isOwn}
        currentUserId={currentUserId}
        sessionCandidateId={sessionCandidateId ?? null}
        onSubmitAnswer={onSubmitAnswer ?? (() => {})}
        hasAnswered={hasAnswered}
      />
    );
  }

  if (message.type === "interview_answer") {
    return <InterviewAnswerCard message={message} isOwn={isOwn} />;
  }

  if (message.type === "interview_feedback") {
    return <InterviewFeedbackCard message={message} isOwn={isOwn} />;
  }

  if (isDailyCheckin) {
    return (
      <article className="max-w-[92%] rounded-[1.5rem] border border-[#c7c4d9]/50 bg-gradient-to-br from-white via-white to-[#eef0ff] p-4 shadow-[0_18px_50px_rgba(59,42,225,0.08)] sm:max-w-[78%]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-[#3b2ae1]/10 p-2 text-[#3b2ae1]">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-[#5755a4]">Daily Check-in</p>
              <p className="mt-1 text-sm leading-6 text-[#1b1b24]">{promptQuestion}</p>
            </div>

            {!hasCurrentUserResponded && currentUserId ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => onRespondCheckin({ sourceCheckinId: message.id, status: "done" })}
                  className="h-10 rounded-full bg-[#3c5900] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#2f4700]"
                >
                  Done
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onRespondCheckin({ sourceCheckinId: message.id, status: "not_done" })}
                  className="h-10 rounded-full border border-[#ba1a1a]/20 bg-[#ffdad6] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#93000a] hover:bg-[#ffd0ca]"
                >
                  Not Done
                </Button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3b2ae1]">
                <ShieldAlert className="h-3.5 w-3.5" />
                Check-in recorded
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{baseTimestamp}</div>
      </article>
    );
  }

  if (isSystem && message.metadata.kind === "exchange_accepted_notification") {
    return (
      <article className="max-w-[92%] rounded-[1.25rem] border border-[rgba(59,42,225,0.2)] bg-gradient-to-br from-[#eef0ff] to-white p-4 shadow-sm sm:max-w-[80%]">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3b2ae1]">Exchange Accepted</p>
        <p className="mt-1.5 text-sm font-semibold leading-6 text-[#1b1b24]">{message.content}</p>
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{baseTimestamp}</div>
      </article>
    );
  }

  if (isSystem && message.metadata.kind === "exchange_requested_notification") {
    return (
      <article className="max-w-[92%] rounded-[1.25rem] border border-[rgba(59,42,225,0.2)] bg-[#fafafe] p-4 shadow-sm sm:max-w-[80%]">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5755a4]">Exchange Request</p>
        <p className="mt-1.5 text-sm font-semibold leading-6 text-[#1b1b24]">{message.content}</p>
        {!isOwn && (
          <div className="mt-3">
            <Button
              type="button"
              onClick={() => onOpenExchange?.()}
              className="h-9 rounded-full bg-[#3b2ae1] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#2c1eb8]"
            >
              Confirm Exchange
            </Button>
          </div>
        )}
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{baseTimestamp}</div>
      </article>
    );
  }

  if (isSystem && message.metadata.kind === "sensitive_unlock_requested") {
    return (
      <article className="max-w-[92%] rounded-[1.25rem] border border-[rgba(181,75,54,0.15)] bg-[#fff8f7] p-4 shadow-sm sm:max-w-[80%]">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ba1a1a]">Sensitive Exchange Requested</p>
        <p className="mt-1.5 text-sm leading-6 text-[#1b1b24]">{message.content}</p>
        {!isOwn && (
          <div className="mt-3">
            <Button
              type="button"
              onClick={() => onOpenExchange?.()}
              className="h-9 rounded-full bg-[#ba1a1a] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#93000a]"
            >
              View & Agree
            </Button>
          </div>
        )}
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{baseTimestamp}</div>
      </article>
    );
  }

  if (isSystem && message.metadata.kind === "sensitive_unlock_approved") {
    return (
      <article className="max-w-[92%] rounded-[1.25rem] border border-[rgba(59,42,225,0.2)] bg-gradient-to-br from-[#eef0ff] to-white p-4 shadow-sm sm:max-w-[80%]">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3b2ae1]">Sensitive Exchange Unlocked</p>
        <p className="mt-1.5 text-sm leading-6 text-[#1b1b24]">{message.content}</p>
        <div className="mt-3">
          <Button
            type="button"
            onClick={() => onOpenExchange?.()}
            className="h-9 rounded-full bg-[#3b2ae1] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#2c1eb8]"
          >
            Submit My Info
          </Button>
        </div>
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{baseTimestamp}</div>
      </article>
    );
  }

  if (isSystem && message.metadata.kind === "sensitive_info_submitted_waiting") {
    return (
      <article className="max-w-[92%] rounded-[1.25rem] border border-dashed border-[rgba(181,75,54,0.3)] bg-[#fff8f7] p-4 shadow-sm sm:max-w-[80%]">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ba1a1a]">Sensitive Info Submitted</p>
        <p className="mt-1.5 text-sm leading-6 text-[#1b1b24]">{isOwn ? "Your sensitive details are saved. Waiting for your partner to submit theirs — both will be revealed simultaneously." : "Your partner has submitted their sensitive info and is waiting for yours."}</p>
        {!isOwn && (
          <div className="mt-3">
            <Button
              type="button"
              onClick={() => onOpenExchange?.()}
              className="h-9 rounded-full bg-[#ba1a1a] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#93000a]"
            >
              Submit My Info
            </Button>
          </div>
        )}
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{baseTimestamp}</div>
      </article>
    );
  }

  if (isSystem && message.metadata.kind === "exchange_sensitive_template") {
    const tpl = (message.metadata.template ?? {}) as Record<string, string | null>;
    const fields = [
      ["HR Contact", tpl.hrContact],
      ["Recruiter Details", tpl.recruiterDetails],
      ["Referral Pathway", tpl.referralPathway],
      ["Internal Process Notes", tpl.internalProcessNotes],
      ["Additional Notes", tpl.additionalNotes],
    ].filter(([, v]) => v) as [string, string][];
    return (
      <article className="max-w-[92%] rounded-[1.25rem] border border-[rgba(181,75,54,0.25)] bg-gradient-to-br from-[#fff5f3] to-white p-4 shadow-sm sm:max-w-[80%]">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ba1a1a]">Sensitive Information</p>
        <p className="mt-1.5 text-sm font-semibold text-[#1b1b24]">{isOwn ? "You shared sensitive details" : "Partner shared sensitive details"}</p>
        {fields.length > 0 && (
          <ul className="mt-2 space-y-1.5 text-sm text-[#464556]">
            {fields.map(([label, val]) => (<li key={label} className="leading-6"><span className="font-semibold text-[#1b1b24]">{label}:</span> {val}</li>))}
          </ul>
        )}
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{baseTimestamp}</div>
      </article>
    );
  }

  if (isSystem && message.metadata.kind === "sensitive_exchange_complete") {
    return (
      <article className="max-w-[92%] rounded-[1.25rem] border border-[rgba(31,109,66,0.25)] bg-gradient-to-br from-[#e6f5ec] to-white p-4 shadow-sm sm:max-w-[80%]">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1f6d42]">Exchange Complete</p>
        <p className="mt-1.5 text-sm leading-6 text-[#1b1b24]">Both users have successfully shared their sensitive information. Details are now visible above for both sides.</p>
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{baseTimestamp}</div>
      </article>
    );
  }

  if (isExchangeTemplate) {
    const templateKind = typeof message.metadata.templateKind === "string" ? message.metadata.templateKind : "template";
    const template = (message.metadata.template ?? {}) as Record<string, unknown>;
    const title =
      templateKind === "role"
        ? "Role Experience"
        : templateKind === "interview"
          ? "Interview Experience"
          : "Experience Template";
    const kind = templateKind === "interview" ? "interview" : "role";
    const lines = pickTemplatePreviewLines(template, kind);
    const isInterview = kind === "interview";
    const borderColor = isInterview ? "rgba(59,42,225,0.2)" : "rgba(16,130,120,0.2)";
    const bgFrom = isInterview ? "#eef0ff" : "#e8f7f5";
    const labelColor = isInterview ? "#3b2ae1" : "#108278";

    if (isOwn) {
      return (
        <article className="max-w-[92%] rounded-[1.25rem] border border-dashed border-[#c7c4d9]/50 bg-[#fafafe] px-4 py-3 sm:max-w-[80%]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#777588]">{title}</p>
          <p className="mt-1 text-sm text-[#464556]">Your template was shared with your partner.</p>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{baseTimestamp}</div>
        </article>
      );
    }

    return (
      <article className="max-w-[92%] rounded-[1.25rem] border p-4 shadow-sm sm:max-w-[80%]" style={{ borderColor, background: `linear-gradient(135deg, ${bgFrom}, white)` }}>
        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: labelColor }}>{title}</p>
        <p className="mt-1.5 text-sm font-semibold text-[#1b1b24]">Partner&apos;s shared template</p>
        {lines.length ? (
          <ul className="mt-2 space-y-1.5 text-sm text-[#464556]">
            {lines.map((line) => {
              const colonIdx = line.indexOf(":");
              if (colonIdx < 0) return <li key={line} className="leading-6">{line}</li>;
              return (<li key={line} className="leading-6"><span className="font-semibold text-[#1b1b24]">{line.slice(0, colonIdx + 1)}</span>{line.slice(colonIdx + 1)}</li>);
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#464556]">Template details were shared.</p>
        )}
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{baseTimestamp}</div>
      </article>
    );
  }

  if (isAlert) {
    return (
      <article className="max-w-[92%] rounded-[1.4rem] border border-[#ba1a1a]/20 bg-[#ffdad6] p-4 text-[#93000a] shadow-[0_18px_50px_rgba(186,26,26,0.1)] sm:max-w-[70%]">
        <div className="flex items-start gap-3">
          <MessageSquareWarning className="mt-0.5 h-4 w-4" />
          <div className="flex-1">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]">Accountability alert</p>
            <p className="mt-1 text-sm leading-6">{message.content}</p>
          </div>
        </div>
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#93000a]/70">{baseTimestamp}</div>
      </article>
    );
  }

  if (isSystem) {
    return (
      <article className="max-w-[92%] rounded-[1.25rem] border border-dashed border-[#c7c4d9]/60 bg-white/70 p-4 text-[#464556] sm:max-w-[72%]">
        <p className="text-sm leading-6">{message.content}</p>
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{baseTimestamp}</div>
      </article>
    );
  }

  if (isCheckinResponse) {
    const status = message.metadata.status;
    const statusLabel = status === "done" ? "Done" : "Not done";
    const statusTone = status === "done" ? "bg-[#e5f5d6] text-[#3c5900]" : "bg-[#ffe0d6] text-[#93000a]";

    return (
      <article
        className={`max-w-[92%] rounded-[1.35rem] px-4 py-3 shadow-[0_16px_40px_rgba(59,42,225,0.05)] sm:max-w-[72%] ${isOwn ? "ml-auto bg-[#3b2ae1] text-white" : "bg-white text-[#1b1b24]"}`}
      >
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusTone}`}>{statusLabel}</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">Check-in response</span>
        </div>
        <p className="mt-2 text-sm leading-6">{message.content}</p>
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">{baseTimestamp}</div>
      </article>
    );
  }

  return (
    <article
      className={`max-w-[92%] rounded-[1.4rem] px-4 py-3 shadow-[0_18px_40px_rgba(59,42,225,0.05)] sm:max-w-[72%] ${isOwn ? "ml-auto rounded-br-sm bg-[#3b2ae1] text-white" : "rounded-bl-sm bg-white text-[#1b1b24]"}`}
    >
      <p className="text-sm leading-6">{message.content}</p>
      <div className={`mt-3 text-[10px] font-bold uppercase tracking-[0.16em] ${isOwn ? "text-white/70" : "text-[#777588]"}`}>{baseTimestamp}</div>
    </article>
  );
}
