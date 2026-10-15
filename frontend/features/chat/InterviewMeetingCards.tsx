"use client";

import {
  CalendarCheck2,
  CalendarX2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Video,
  VideoOff,
  X
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ChatMessage, InterviewMeetingSession, MeetingProvider } from "./types";

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatTimestamp(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatScheduledAt(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const PROVIDER_LABELS: Record<MeetingProvider, string> = {
  jitsi: "Jitsi Meet",
  google_meet: "Google Meet"
};

const STATUS_STYLES: Record<
  string,
  { border: string; bg: string; label: string; labelColor: string }
> = {
  pending: {
    border: "rgba(59,42,225,0.2)",
    bg: "linear-gradient(135deg, #f5f5ff, white)",
    label: "Pending",
    labelColor: "#3b2ae1"
  },
  scheduled: {
    border: "rgba(31,109,66,0.25)",
    bg: "linear-gradient(135deg, #e6f5ec, white)",
    label: "Confirmed",
    labelColor: "#1f6d42"
  },
  accepted: {
    border: "rgba(31,109,66,0.25)",
    bg: "linear-gradient(135deg, #e6f5ec, white)",
    label: "Accepted",
    labelColor: "#1f6d42"
  },
  declined: {
    border: "rgba(181,75,54,0.2)",
    bg: "linear-gradient(135deg, #fff8f7, white)",
    label: "Declined",
    labelColor: "#ba1a1a"
  },
  cancelled: {
    border: "rgba(181,75,54,0.2)",
    bg: "linear-gradient(135deg, #fff8f7, white)",
    label: "Cancelled",
    labelColor: "#ba1a1a"
  },
  completed: {
    border: "rgba(31,109,66,0.25)",
    bg: "linear-gradient(135deg, #e6f5ec, white)",
    label: "Completed",
    labelColor: "#1f6d42"
  },
  expired: {
    border: "rgba(119,117,136,0.2)",
    bg: "linear-gradient(135deg, #f5f5f5, white)",
    label: "Expired",
    labelColor: "#777588"
  }
};

// ── InterviewScheduleRequestCard ──────────────────────────────────────────────

type InterviewScheduleRequestCardProps = {
  message: ChatMessage;
  isOwn: boolean;
  currentUserId: string | null;
  onAcceptMeeting?: (meetingId: string) => void;
  onDeclineMeeting?: (meetingId: string) => void;
  onProposeNewTime?: (meetingId: string) => void;
};

/**

 * Renders the initial schedule-request card in the conversation timeline.
 * Only the non-organizer participant sees the Accept/Decline buttons.
 */
export function InterviewScheduleRequestCard({
  message,
  isOwn,
  currentUserId,
  onAcceptMeeting,
  onDeclineMeeting,
  onProposeNewTime
}: InterviewScheduleRequestCardProps) {
  const [isActing, setIsActing] = useState(false);


  const meta = message.metadata as Record<string, unknown>;
  const meetingId = String(meta.meetingId ?? "");
  const provider = (meta.provider as MeetingProvider) ?? "jitsi";
  const scheduledAt = String(meta.scheduledAt ?? "");
  const duration = Number(meta.duration ?? 30);
  const notes = typeof meta.notes === "string" && meta.notes ? meta.notes : null;
  const status = String((meta.status as string) ?? "pending");

  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  const isReceiver = !isOwn;
  const isPending = status === "pending";
  const timestamp = formatTimestamp(message.createdAt);

  async function handleAccept() {
    if (!meetingId) return;
    setIsActing(true);
    try {
      await onAcceptMeeting?.(meetingId);
    } finally {
      setIsActing(false);
    }
  }

  async function handleDecline() {
    if (!meetingId) return;
    setIsActing(true);
    try {
      await onDeclineMeeting?.(meetingId);
    } finally {
      setIsActing(false);
    }
  }

  async function handlePropose() {
    if (!meetingId) return;
    setIsActing(true);
    try {
      await onProposeNewTime?.(meetingId);
    } finally {
      setIsActing(false);
    }
  }

  return (

    <article
      className="max-w-[92%] rounded-[1.5rem] border p-4 shadow-[0_18px_50px_rgba(59,42,225,0.08)] sm:max-w-[80%]"
      style={{ borderColor: style.border, background: style.bg }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-[#3b2ae1]/10 p-2 text-[#3b2ae1] shrink-0">
          <Video className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5755a4]">
                Live Interview Request
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                style={{ color: style.labelColor, background: style.border ? `${style.bg}` : "#eef0ff" }}
              >
                {style.label}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-[#1b1b24]">
              {PROVIDER_LABELS[provider] ?? provider}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-[#464556]">
            <span className="flex items-center gap-1.5">
              <CalendarCheck2 className="h-3.5 w-3.5 text-[#777588]" />
              {scheduledAt ? formatScheduledAt(scheduledAt) : "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#777588]" />
              {duration} min
            </span>
          </div>

          {notes && (
            <div className="rounded-xl border border-dashed border-[rgba(59,42,225,0.2)] bg-[#fafafe] px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#777588]">Notes</p>
              <p className="mt-1 text-xs leading-5 text-[#464556]">{notes}</p>
            </div>
          )}

          {isReceiver && isPending && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                id={`accept-meeting-${meetingId}`}
                disabled={isActing}
                onClick={handleAccept}
                className="h-9 rounded-full bg-[#3b2ae1] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#2c1eb8] disabled:opacity-60"
              >
                {isActing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 inline" />
                    Accept
                  </>
                )}
              </Button>
              <Button
                type="button"
                id={`propose-meeting-${meetingId}`}
                variant="secondary"
                disabled={isActing}
                onClick={handlePropose}
                className="h-9 rounded-full border border-[#3b2ae1]/20 bg-[#eef0ff] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#3b2ae1] hover:bg-[#e0e4ff] disabled:opacity-60"
              >
                <Clock className="mr-1.5 h-3.5 w-3.5 inline" />
                Propose New Time
              </Button>
              <Button
                type="button"

                id={`decline-meeting-${meetingId}`}
                variant="secondary"
                disabled={isActing}
                onClick={handleDecline}
                className="h-9 rounded-full border border-[#ba1a1a]/20 bg-[#ffdad6] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#93000a] hover:bg-[#ffd0ca] disabled:opacity-60"
              >
                <X className="mr-1.5 h-3.5 w-3.5 inline" />
                Decline
              </Button>
            </div>
          )}

          {isOwn && isPending && (
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef0ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3b2ae1]">
              <Clock className="h-3.5 w-3.5" />
              Waiting for partner to respond
            </div>
          )}

          {!isPending && status !== "pending" && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: style.labelColor, background: `${style.border.replace("rgba", "rgba").replace(")", "").replace("0.", "0.08)")}` }}
            >
              {["declined", "cancelled"].includes(status) ? (
                <CalendarX2 className="h-3.5 w-3.5" />
              ) : (
                <CalendarCheck2 className="h-3.5 w-3.5" />
              )}
              {style.label}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">
        {timestamp}
      </div>
    </article>
  );
}

// ── InterviewMeetingCard ──────────────────────────────────────────────────────

type InterviewMeetingCardProps = {
  message: ChatMessage;
  isOwn: boolean;
  currentUserId: string | null;
  onCancelMeeting?: (meetingId: string) => void;
};

/**
 * Renders the confirmed meeting card with a Join button.
 * Both participants can cancel a scheduled meeting.
 */
export function InterviewMeetingCard({
  message,
  isOwn,
  currentUserId,
  onCancelMeeting
}: InterviewMeetingCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  const meta = message.metadata as Record<string, unknown>;
  const meetingId = String(meta.meetingId ?? "");
  const provider = (meta.provider as MeetingProvider) ?? "jitsi";
  const meetingLink = typeof meta.meetingLink === "string" ? meta.meetingLink : null;
  const scheduledAt = String(meta.scheduledAt ?? "");
  const duration = Number(meta.duration ?? 30);
  const notes = typeof meta.notes === "string" && meta.notes ? meta.notes : null;
  const status = String((meta.status as string) ?? "scheduled");

  const style = STATUS_STYLES[status] ?? STATUS_STYLES.scheduled;
  const isActive = ["scheduled", "accepted"].includes(status);
  const timestamp = formatTimestamp(message.createdAt);

  async function handleCancel() {
    if (!meetingId) return;
    setIsCancelling(true);
    try {
      await onCancelMeeting?.(meetingId);
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <article
      className="max-w-[92%] rounded-[1.5rem] border p-4 shadow-[0_18px_50px_rgba(31,109,66,0.08)] sm:max-w-[80%]"
      style={{ borderColor: style.border, background: style.bg }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-[#1f6d42]/10 p-2 text-[#1f6d42] shrink-0">
          {isActive ? <CalendarCheck2 className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1f6d42]">
                Meeting Confirmed
              </p>
              <span className="rounded-full bg-[#e6f5ec] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#1f6d42]">
                {style.label}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-[#1b1b24]">
              {PROVIDER_LABELS[provider] ?? provider}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-[#464556]">
            <span className="flex items-center gap-1.5">
              <CalendarCheck2 className="h-3.5 w-3.5 text-[#777588]" />
              {scheduledAt ? formatScheduledAt(scheduledAt) : "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#777588]" />
              {duration} min
            </span>
          </div>

          {notes && (
            <div className="rounded-xl border border-dashed border-[rgba(31,109,66,0.2)] bg-white px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#777588]">Notes</p>
              <p className="mt-1 text-xs leading-5 text-[#464556]">{notes}</p>
            </div>
          )}

          {meetingLink && isActive && (
            <div className="space-y-2">
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                id={`join-meeting-${meetingId}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#1f6d42] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-sm transition-all hover:bg-[#18593a]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Join Meeting
              </a>

              <div>
                <Button
                  type="button"
                  variant="secondary"
                  id={`cancel-meeting-${meetingId}`}
                  disabled={isCancelling}
                  onClick={handleCancel}
                  className="h-8 rounded-full border border-[#ba1a1a]/20 bg-[#ffdad6] px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#93000a] hover:bg-[#ffd0ca] disabled:opacity-60"
                >
                  {isCancelling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <X className="mr-1 h-3 w-3 inline" />
                      Cancel
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">
        {timestamp}
      </div>
    </article>
  );
}

// ── InterviewScheduleSystemCard ───────────────────────────────────────────────

type InterviewScheduleSystemCardProps = {
  message: ChatMessage;
};

/**
 * Renders a lightweight system card for meeting status changes
 * (accepted, declined, cancelled).
 */
export function InterviewScheduleSystemCard({ message }: InterviewScheduleSystemCardProps) {
  const meta = message.metadata as Record<string, unknown>;
  const kind = String(meta.kind ?? "");
  const timestamp = formatTimestamp(message.createdAt);

  const isAccepted = kind === "meeting_accepted";
  const isDeclined = kind === "meeting_declined";
  const isCancelled = kind === "meeting_cancelled";

  const borderColor = isDeclined || isCancelled
    ? "rgba(181,75,54,0.2)"
    : isAccepted
    ? "rgba(31,109,66,0.25)"
    : "rgba(59,42,225,0.2)";

  const bgFrom = isDeclined || isCancelled ? "#fff8f7" : isAccepted ? "#e6f5ec" : "#eef0ff";
  const labelColor = isDeclined || isCancelled ? "#ba1a1a" : isAccepted ? "#1f6d42" : "#3b2ae1";
  const label = isDeclined
    ? "Meeting Declined"
    : isCancelled
    ? "Meeting Cancelled"
    : isAccepted
    ? "Meeting Confirmed"
    : "Meeting Update";

  return (
    <article
      className="max-w-[92%] rounded-[1.25rem] border p-4 shadow-sm sm:max-w-[80%]"
      style={{ borderColor, background: `linear-gradient(135deg, ${bgFrom}, white)` }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: labelColor }}>
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold leading-6 text-[#1b1b24]">{message.content}</p>
      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777588]">{timestamp}</div>
    </article>
  );
}
