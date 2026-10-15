"use client";

import { BrainCircuit, ChevronRight, X } from "lucide-react";
import type { InterviewSession } from "./types";

type InterviewBannerProps = {
  session: InterviewSession;
  currentUserId: string | null;
  onExit: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  technical: "Technical",
  hr: "HR",
  behavioral: "Behavioral",
  mixed: "Mixed",
  resume_round: "Resume Round"
};

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: "bg-[#e8f7f5] text-[#108278]",
  intermediate: "bg-[#eef0ff] text-[#3b2ae1]",
  advanced: "bg-[#fff0f0] text-[#ba1a1a]"
};

const MODE_LABELS: Record<string, string> = {
  text_async: "Text Async",
  live_online: "Live Online",
  live_video: "Live Video"
};

export function InterviewBanner({ session, currentUserId, onExit }: InterviewBannerProps) {
  const isInterviewer = currentUserId === session.interviewerId;
  const roleLabel = isInterviewer ? "Interviewer" : "Candidate";
  const template = session.template;
  const progress = session.totalQuestions > 0
    ? `Q${Math.min(session.currentQuestionIndex + 1, session.totalQuestions)} of ${session.totalQuestions}`
    : null;
  const templateTitle = template?.title ?? "Mock Interview";
  const templateType = template?.type ?? null;
  const difficulty = template?.difficulty ?? null;
  const statusLabel = session.status === "paused" ? "Interview Paused" : "Interview Active";
  const liveLabel =
    session.mode === "live_online"
      ? session.liveOnlineStatus?.bothOnline
        ? "Both online"
        : "Partner offline"
      : null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(59,42,225,0.2)] bg-gradient-to-r from-[#eef0ff] to-white px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3b2ae1]/10 text-[#3b2ae1]">
          <BrainCircuit className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3b2ae1]">
              {statusLabel}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#3b2ae1]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#3b2ae1]">
              {roleLabel}
            </span>
            {templateType && (
              <span className="text-[10px] font-semibold text-[#777588]">
                · {TYPE_LABELS[templateType] ?? templateType}
              </span>
            )}
            {difficulty && (
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${DIFFICULTY_BADGE[difficulty] ?? "bg-rb-sub text-rb-muted"}`}>
                {difficulty}
              </span>
            )}
            <span className="text-[10px] font-semibold text-[#777588]">· {MODE_LABELS[session.mode] ?? session.mode}</span>
            {liveLabel && <span className="text-[10px] font-semibold text-[#777588]">· {liveLabel}</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="truncate text-xs font-semibold text-[#1b1b24]">{templateTitle}</p>
            {progress && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#5755a4]">
                <ChevronRight className="h-3 w-3" />
                {progress}
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onExit}
        className="shrink-0 rounded-full p-1.5 text-[#777588] transition-colors hover:bg-[#3b2ae1]/10 hover:text-[#3b2ae1]"
        title="Exit interview mode"
        aria-label="Exit interview mode"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
