"use client";

import { useState } from "react";
import { Calendar, Clock, ExternalLink, Loader2, Video, X } from "lucide-react";

import type { MeetingProvider, ScheduleMeetingPayload } from "./types";

type MeetingSchedulerModalProps = {
  isOpen: boolean;
  conversationId: string | null;
  onClose: () => void;
  onSchedule: (payload: ScheduleMeetingPayload) => Promise<void>;
};

const PROVIDER_OPTIONS: Array<{ value: MeetingProvider; label: string; description: string }> = [
  {
    value: "jitsi",
    label: "Jitsi Meet",
    description: "Free, open-source. No account required."
  },
  {
    value: "google_meet",
    label: "Google Meet",
    description: "A Google Meet link will be generated."
  }
];

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" }
];

/** Returns the local datetime string formatted for a `datetime-local` input. */
function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Returns the minimum datetime for the picker (30 minutes from now). */
function getMinDatetimeValue(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  return toLocalDatetimeValue(d);
}

export function MeetingSchedulerModal({
  isOpen,
  conversationId,
  onClose,
  onSchedule
}: MeetingSchedulerModalProps) {
  const [provider, setProvider] = useState<MeetingProvider>("jitsi");
  const [meetingLink, setMeetingLink] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!conversationId) return;

    if (!scheduledAt) {
      setFieldError("Please choose a date and time for the meeting.");
      return;
    }

    const parsed = new Date(scheduledAt);
    if (parsed.getTime() <= Date.now()) {
      setFieldError("The meeting time must be in the future.");
      return;
    }

    if (provider === "google_meet" && !meetingLink.trim()) {
      setFieldError("Please provide a Google Meet link (e.g., https://meet.google.com/abc-defg-hij).");
      return;
    }

    setFieldError(null);
    setIsSubmitting(true);
    try {
      await onSchedule({
        conversationId,
        provider,
        meetingLink: provider === "google_meet" ? meetingLink.trim() : null,
        scheduledAt: parsed.toISOString(),
        duration,
        notes: notes.trim() || null
      });
      // Reset form on success
      setScheduledAt("");
      setNotes("");
      setDuration(30);
      setMeetingLink("");
      setProvider("jitsi");

      onClose();
    } catch {
      // Error displayed by parent handler
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-scheduler-title"
        className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 max-w-lg mx-auto w-full rounded-3xl border border-rb-border bg-white shadow-[0_32px_80px_rgba(59,42,225,0.14)] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-rb-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rb-primary text-white">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted">Live Interview</p>
              <h2
                id="meeting-scheduler-title"
                className="font-headline text-sm font-black text-rb-text leading-tight"
              >
                Schedule Meeting
              </h2>
            </div>
          </div>
          <button
            type="button"
            id="close-meeting-scheduler"
            onClick={onClose}
            className="rounded-xl border border-rb-border bg-rb-surface p-2 text-rb-muted transition-colors hover:border-rb-primary/20 hover:bg-rb-primary-light hover:text-rb-primary"
            aria-label="Close meeting scheduler"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Provider */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-2">
              Meeting Platform
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  id={`provider-${option.value}`}
                  onClick={() => setProvider(option.value)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    provider === option.value
                      ? "border-rb-primary bg-rb-primary-light shadow-sm"
                      : "border-rb-border bg-rb-surface hover:border-rb-primary/30"
                  }`}
                >
                  <p className={`text-xs font-bold ${provider === option.value ? "text-rb-primary" : "text-rb-text"}`}>
                    {option.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-rb-muted leading-4">{option.description}</p>
                </button>
              ))}
            </div>
            {provider === "google_meet" && (
              <div className="mt-3">
                <label htmlFor="meeting-link" className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-1.5 block">
                  Google Meet Link
                </label>
                <input
                  id="meeting-link"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingLink}
                  onChange={(e) => {
                    setMeetingLink(e.target.value);
                    setFieldError(null);
                  }}
                  className="w-full rounded-xl border border-rb-border bg-white px-3 py-2.5 text-sm text-rb-text placeholder:text-rb-muted focus:border-rb-primary focus:outline-none focus:ring-2 focus:ring-rb-primary/10"
                  required
                />
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-rb-muted rounded-lg border border-dashed border-rb-border bg-rb-surface px-3 py-2">
                  <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
                  Paste a valid Google Meet link. Your partner will receive it immediately.
                </p>
              </div>
            )}
          </div>


          {/* Date and Time */}
          <div>
            <label
              htmlFor="meeting-scheduled-at"
              className="text-[10px] font-bold uppercase tracking-widest text-rb-muted"
            >
              Date &amp; Time
            </label>
            <div className="relative mt-2">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rb-muted" />
              <input
                id="meeting-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                min={getMinDatetimeValue()}
                onChange={(e) => {
                  setScheduledAt(e.target.value);
                  setFieldError(null);
                }}
                className="w-full rounded-xl border border-rb-border bg-white pl-10 pr-3 py-2.5 text-sm text-rb-text placeholder:text-rb-muted focus:border-rb-primary focus:outline-none focus:ring-2 focus:ring-rb-primary/10"
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-2">
              Duration
            </p>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  id={`duration-${opt.value}`}
                  onClick={() => setDuration(opt.value)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                    duration === opt.value
                      ? "border-rb-primary bg-rb-primary text-white shadow-sm"
                      : "border-rb-border bg-rb-surface text-rb-muted hover:border-rb-primary/40 hover:text-rb-primary"
                  }`}
                >
                  <Clock className="h-3 w-3" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="meeting-notes"
              className="text-[10px] font-bold uppercase tracking-widest text-rb-muted"
            >
              Notes <span className="text-rb-muted font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              id="meeting-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="e.g. Focus areas, what to prepare, agenda..."
              className="mt-2 w-full resize-none rounded-xl border border-rb-border bg-white px-3 py-2.5 text-sm text-rb-text placeholder:text-rb-muted focus:border-rb-primary focus:outline-none focus:ring-2 focus:ring-rb-primary/10"
            />
          </div>

          {/* Error */}
          {fieldError && (
            <p className="rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-3 py-2 text-sm text-rb-danger">
              {fieldError}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rb-button-secondary !py-2 !px-4 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-meeting-scheduler"
              disabled={isSubmitting || !scheduledAt}
              className="rb-button-primary !py-2 !px-5 text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scheduling…
                </span>
              ) : (
                <>
                  <Video className="mr-1.5 h-4 w-4 inline" />
                  Schedule Meeting
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
