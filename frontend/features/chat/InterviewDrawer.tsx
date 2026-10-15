"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageSquare,
  UserCheck
} from "lucide-react";

import { getInterviewTemplates, getMyInterviewTemplates, getPublicInterviewTemplates } from "./interview.api";
import type { InterviewMode, InterviewTemplate, InterviewTemplateType } from "./types";

type InterviewDrawerProps = {
  isOpen: boolean;
  conversationId: string | null;
  partnerDomain?: string | null;
  currentUserId: string | null;
  onClose: () => void;
  onRequestInterview: (payload: {
    conversationId: string;
    templateId: string;
    interviewerRole: "interviewer" | "candidate";
    mode: InterviewMode;
    proposedSlots?: string[];
    timezoneHint?: string;
  }) => Promise<void> | void;
  onOpenTemplateManager?: () => void;
  onConnectGoogleCalendar?: () => Promise<void> | void;
  onDisconnectGoogleCalendar?: () => Promise<void> | void;
  googleCalendarConfigured?: boolean;
  googleCalendarConnected?: boolean;
  onOpenScheduleMeeting?: () => void;
};


const TYPE_OPTIONS: Array<{ value: InterviewTemplateType; label: string; desc: string }> = [
  { value: "technical", label: "Technical", desc: "DSA, system design, coding" },
  { value: "hr", label: "HR Round", desc: "Culture fit, salary, expectations" },
  { value: "behavioral", label: "Behavioral", desc: "STAR method, soft skills" },
  { value: "mixed", label: "Mixed", desc: "Combination of multiple round types" },
  { value: "resume_round", label: "Resume Round", desc: "Walk through your background" }
];

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: "bg-[#e8f7f5] text-[#108278]",
  intermediate: "bg-[#eef0ff] text-[#3b2ae1]",
  advanced: "bg-[#fff0f0] text-[#ba1a1a]"
};

function TemplateCard({
  template,
  selected,
  onSelect
}: {
  template: InterviewTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  const TYPE_LABELS: Record<string, string> = {
    technical: "Technical",
    hr: "HR",
    behavioral: "Behavioral",
    mixed: "Mixed",
    resume_round: "Resume Round"
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition-all ${
        selected
          ? "border-[rgba(59,42,225,0.4)] bg-rb-primary-light shadow-sm"
          : "border-rb-border bg-white hover:border-[rgba(59,42,225,0.2)] hover:bg-[#fafafe]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-[#1b1b24] leading-snug">{template.title}</p>
        {selected && (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#3b2ae1]" />
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[#3b2ae1]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3b2ae1]">
          {TYPE_LABELS[template.type] ?? template.type}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${DIFFICULTY_BADGE[template.difficulty] ?? "bg-rb-sub text-rb-muted"}`}>
          {template.difficulty}
        </span>
        {template.role && (
          <span className="rounded-full bg-rb-sub px-2 py-0.5 text-[10px] font-semibold text-rb-muted">
            {template.role}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-[#777588]">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {template.estimatedDuration} min
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {template.totalQuestions} Qs
        </span>
      </div>
    </button>
  );
}

export function InterviewDrawer({
  isOpen,
  conversationId,
  partnerDomain,
  currentUserId,
  onClose,
  onRequestInterview,
  onOpenTemplateManager,
  onConnectGoogleCalendar,
  onDisconnectGoogleCalendar,
  googleCalendarConfigured = true,
  googleCalendarConnected,
  onOpenScheduleMeeting
}: InterviewDrawerProps) {

  const [step, setStep] = useState<"type" | "template" | "role" | "mode" | "confirm">("type");
  const [selectedType, setSelectedType] = useState<InterviewTemplateType | null>(null);
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InterviewTemplate | null>(null);
  const [interviewerRole, setInterviewerRole] = useState<"interviewer" | "candidate" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMode, setSelectedMode] = useState<InterviewMode | null>(null);
  const [slot1, setSlot1] = useState("");
  const [slot2, setSlot2] = useState("");
  const [slot3, setSlot3] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [templateSource, setTemplateSource] = useState<"system" | "mine" | "public">("system");

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep("type");
      setSelectedType(null);
      setSelectedTemplate(null);
      setInterviewerRole(null);
      setError(null);
      setTemplateError(null);
      setSuccess(false);
      setSelectedMode(null);
      setSlot1("");
      setSlot2("");
      setSlot3("");
      setTemplateSource("system");
    }
  }, [isOpen]);

  // Fetch templates when type/source is selected
  useEffect(() => {
    if (!selectedType) return;

    setLoadingTemplates(true);
    setSelectedTemplate(null);
    setTemplateError(null);

    const domain = partnerDomain ?? undefined;
    const templateRequest =
      templateSource === "mine"
        ? getMyInterviewTemplates()
        : templateSource === "public"
        ? getPublicInterviewTemplates({ domain, type: selectedType })
        : getInterviewTemplates(domain, selectedType);

    templateRequest
      .then((res) => {
        setTemplates(res.data.templates);
      })
      .catch(() => {
        setTemplates([]);
        setTemplateError("Failed to load templates.");
      })
      .finally(() => setLoadingTemplates(false));
  }, [selectedType, partnerDomain, templateSource, isOpen]);

  if (!isOpen) return null;

  async function handleSendRequest() {
    if (!conversationId || !selectedTemplate || !interviewerRole) return;
    setSubmitting(true);
    setError(null);
    try {
      await onRequestInterview({
        conversationId,
        templateId: selectedTemplate.id,
        interviewerRole,
        mode: selectedMode ?? "text_async",
        proposedSlots:
          selectedMode === "live_online"
            ? [slot1, slot2, slot3]
                .filter(Boolean)
                .map((localValue) => new Date(localValue).toISOString())
            : undefined,
        timezoneHint:
          selectedMode === "live_online"
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : undefined
      });
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send interview request.");
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = "text-[10px] font-black uppercase tracking-widest text-rb-muted";
  const isLiveScheduleInvalid =
    selectedMode === "live_online" &&
    [slot1, slot2, slot3].filter(Boolean).length < 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-rb-border bg-white p-4 pb-24 shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-l-3xl sm:rounded-tr-none sm:pb-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b2ae1]/10 text-[#3b2ae1]">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <h3 className="font-headline text-base font-black text-rb-text">Start Interview</h3>
          </div>
          <div className="flex items-center gap-2">
            {onOpenTemplateManager && (
              <button className="text-xs font-bold text-rb-primary hover:underline" type="button" onClick={onOpenTemplateManager}>
                Manage templates
              </button>
            )}
            <button className="text-sm font-bold text-rb-muted" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Progress steps */}
        <div className="mt-4 flex items-center gap-1.5">
          {(["type", "template", "role", "mode", "confirm"] as const).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step === s
                  ? "bg-[#3b2ae1]"
                  : (["type", "template", "role", "mode", "confirm"] as const).indexOf(step) > i
                  ? "bg-[#3b2ae1]/40"
                  : "bg-rb-border"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {/* Success state */}
          {success && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f5ec]">
                <CheckCircle2 className="h-7 w-7 text-[#1f6d42]" />
              </div>
              <p className="font-headline text-base font-black text-rb-text">Request Sent!</p>
              <p className="text-sm text-rb-muted">Waiting for your partner's response in chat.</p>
            </div>
          )}

          {!success && (
            <>
              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-3 py-2.5 text-xs text-rb-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1 — Type selection */}
              {step === "type" && (
                <div className="space-y-3">
                  <p className={labelClass}>Step 1 — Choose interview type</p>
                  <div className="space-y-2">
                    {TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedType(opt.value);
                          setStep("template");
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-rb-border bg-white p-3 text-left transition-all hover:border-[rgba(59,42,225,0.3)] hover:bg-[#fafafe]"
                      >
                        <div>
                          <p className="text-sm font-bold text-[#1b1b24]">{opt.label}</p>
                          <p className="mt-0.5 text-xs text-rb-muted">{opt.desc}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-rb-muted" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2 — Template selection */}
              {step === "template" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("type")}
                      className="text-xs font-bold text-rb-primary underline"
                    >
                      ← Back
                    </button>
                    <p className={labelClass}>Step 2 — Choose template</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "system", label: "System" },
                      { key: "mine", label: "My templates" },
                      { key: "public", label: "Public" }
                    ].map((source) => (
                      <button
                        key={source.key}
                        type="button"
                        onClick={() => setTemplateSource(source.key as "system" | "mine" | "public")}
                        className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold ${
                          templateSource === source.key
                            ? "border-[rgba(59,42,225,0.4)] bg-rb-primary-light text-rb-primary"
                            : "border-rb-border bg-white text-rb-muted"
                        }`}
                      >
                        {source.label}
                      </button>
                    ))}
                  </div>

                  {loadingTemplates ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-rb-primary border-t-transparent" />
                    </div>
                  ) : templateError ? (
                    <div className="rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg p-4 text-center text-sm text-rb-danger">
                      {templateError}
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-rb-border bg-rb-surface p-4 text-center text-sm text-rb-muted">
                      No templates found for this category.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((t) => (
                        <TemplateCard
                          key={t.id}
                          template={t}
                          selected={selectedTemplate?.id === t.id}
                          onSelect={() => setSelectedTemplate(t)}
                        />
                      ))}
                      {templateSource === "mine" && onOpenTemplateManager && (
                        <button
                          type="button"
                          onClick={onOpenTemplateManager}
                          className="w-full rounded-xl border border-dashed border-rb-border bg-rb-surface p-3 text-center text-sm font-bold text-rb-primary hover:bg-[#fafafe]"
                        >
                          + Create New Template
                        </button>
                      )}
                    </div>
                  )}

                  {selectedTemplate && (
                    <button
                      type="button"
                      onClick={() => setStep("role")}
                      className="rb-button-primary w-full"
                    >
                      Continue with this template
                    </button>
                  )}
                </div>
              )}

              {/* STEP 3 — Role selection */}
              {step === "role" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("template")}
                      className="text-xs font-bold text-rb-primary underline"
                    >
                      ← Back
                    </button>
                    <p className={labelClass}>Step 3 — Your role</p>
                  </div>

                  {selectedTemplate && (
                    <div className="rounded-xl border border-rb-border bg-rb-surface p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">Selected template</p>
                      <p className="mt-1 text-sm font-bold text-[#1b1b24]">{selectedTemplate.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-rb-muted">
                        <span>{selectedTemplate.totalQuestions} questions</span>
                        <span>·</span>
                        <span>{selectedTemplate.estimatedDuration} min</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInterviewerRole("interviewer");
                        setStep("mode");
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                        interviewerRole === "interviewer"
                          ? "border-[rgba(59,42,225,0.4)] bg-rb-primary-light"
                          : "border-rb-border bg-white hover:border-[rgba(59,42,225,0.2)]"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3b2ae1]/10 text-[#3b2ae1]">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1b1b24]">I am the Interviewer</p>
                        <p className="text-xs text-rb-muted">You ask questions, provide feedback and ratings</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInterviewerRole("candidate");
                        setStep("mode");
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                        interviewerRole === "candidate"
                          ? "border-[rgba(59,42,225,0.4)] bg-rb-primary-light"
                          : "border-rb-border bg-white hover:border-[rgba(59,42,225,0.2)]"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f7f5] text-[#108278]">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1b1b24]">I am the Candidate</p>
                        <p className="text-xs text-rb-muted">You answer questions, receive feedback and ratings</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {step === "mode" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setStep("role")} className="text-xs font-bold text-rb-primary underline">
                      ← Back
                    </button>
                    <p className={labelClass}>Step 4 — Choose mode</p>
                  </div>
                  {[
                    { value: "text_async", title: "Text Interview (Async)", desc: "Fully async flow with question cards and chat-based responses." },
                    { value: "live_online", title: "Live Online Interview", desc: "Same Q/A flow, but both users must stay socket-online." },
                    { value: "live_video", title: "Live Video Interview", desc: "Schedule a Google Meet or Jitsi video call with your partner." }
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => {
                        if (mode.value === "live_video") {
                          onClose();
                          onOpenScheduleMeeting?.();
                          return;
                        }
                        setSelectedMode(mode.value as InterviewMode);
                        setStep("confirm");
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                        selectedMode === mode.value ? "border-[rgba(59,42,225,0.4)] bg-rb-primary-light" : "border-rb-border bg-white"
                      }`}
                    >

                      <div>
                        <p className="text-sm font-bold text-[#1b1b24]">{mode.title}</p>
                        <p className="text-xs text-rb-muted">{mode.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}


              {/* STEP 5 — Confirm and send */}
              {step === "confirm" && selectedTemplate && interviewerRole && selectedMode && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("mode")}
                      className="text-xs font-bold text-rb-primary underline"
                    >
                      ← Back
                    </button>
                    <p className={labelClass}>Step 5 — Confirm & send</p>
                  </div>

                  <div className="rounded-2xl border border-[rgba(59,42,225,0.2)] bg-gradient-to-br from-[#f5f5ff] to-white p-4 space-y-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#5755a4]">Interview Summary</p>
                      <p className="mt-1 text-base font-black text-[#1b1b24]">{selectedTemplate.title}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-white border border-rb-border p-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-rb-muted">Type</p>
                        <p className="mt-0.5 font-semibold text-[#1b1b24] capitalize">{selectedTemplate.type.replace("_", " ")}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-rb-border p-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-rb-muted">Difficulty</p>
                        <p className="mt-0.5 font-semibold text-[#1b1b24] capitalize">{selectedTemplate.difficulty}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-rb-border p-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-rb-muted">Duration</p>
                        <p className="mt-0.5 font-semibold text-[#1b1b24]">{selectedTemplate.estimatedDuration} min</p>
                      </div>
                      <div className="rounded-lg bg-white border border-rb-border p-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-rb-muted">Questions</p>
                        <p className="mt-0.5 font-semibold text-[#1b1b24]">{selectedTemplate.totalQuestions}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-[rgba(59,42,225,0.15)] bg-rb-primary-light p-2.5">
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#5755a4]">Your Role</p>
                      <p className="mt-0.5 text-sm font-bold text-[#3b2ae1]">
                        {interviewerRole === "interviewer" ? "Interviewer" : "Candidate"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[rgba(59,42,225,0.15)] bg-rb-primary-light p-2.5">
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#5755a4]">Mode</p>
                      <p className="mt-0.5 text-sm font-bold text-[#3b2ae1]">{selectedMode.replace("_", " ")}</p>
                    </div>
                  </div>

                  <p className="text-xs text-rb-muted leading-5">
                    Your partner will receive this request in the conversation. Normal chat continues while the request is pending.
                  </p>
                  {selectedMode === "live_online" && (
                    <div className="space-y-2 rounded-xl border border-rb-border bg-rb-surface p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">Propose 2-3 time slots</p>
                      <div className="flex items-center justify-between rounded-lg border border-rb-border bg-white px-3 py-2">
                        <p className="text-xs text-rb-muted">
                          Google Calendar: <span className="font-semibold text-rb-text">{googleCalendarConnected ? "Connected" : googleCalendarConfigured ? "Not connected" : "Not configured"}</span>
                        </p>
                        {googleCalendarConnected ? (
                          <button type="button" className="text-xs font-bold text-rb-danger hover:underline" onClick={() => void onDisconnectGoogleCalendar?.()}>
                            Disconnect
                          </button>
                        ) : !googleCalendarConfigured ? (
                          <button type="button" className="text-xs font-bold text-rb-muted cursor-not-allowed" disabled>
                            Setup required
                          </button>
                        ) : (
                          <button type="button" className="text-xs font-bold text-rb-primary hover:underline" onClick={() => void onConnectGoogleCalendar?.()}>
                            Connect
                          </button>
                        )}
                      </div>
                      {!googleCalendarConfigured && (
                        <p className="text-xs text-rb-muted leading-5">
                          Google Calendar is not enabled for this deployment yet. The app owner needs to configure the OAuth credentials before users can connect.
                        </p>
                      )}
                      <input type="datetime-local" className="w-full rounded-lg border border-rb-border px-3 py-2 text-sm" value={slot1} onChange={(e) => setSlot1(e.target.value)} />
                      <input type="datetime-local" className="w-full rounded-lg border border-rb-border px-3 py-2 text-sm" value={slot2} onChange={(e) => setSlot2(e.target.value)} />
                      <input type="datetime-local" className="w-full rounded-lg border border-rb-border px-3 py-2 text-sm" value={slot3} onChange={(e) => setSlot3(e.target.value)} />
                      <p className="text-xs text-rb-muted">
                        Times are converted to UTC and shared with your partner.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    className="rb-button-primary w-full"
                    onClick={handleSendRequest}
                    disabled={submitting || isLiveScheduleInvalid}
                  >
                    {submitting ? "Sending…" : "Send Interview Request"}
                  </button>

                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
