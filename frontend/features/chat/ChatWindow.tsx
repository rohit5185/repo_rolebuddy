"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrainCircuit, MessageCircle, Users, LoaderCircle, Video, ArrowLeft, XCircle } from "lucide-react";


import { InterviewBanner } from "./InterviewBanner";
import { InputBox } from "./InputBox";
import { MessageBubble } from "./MessageBubble";
import type { ChatConversation, ChatMessage, InterviewSession } from "./types";

type ChatWindowProps = {
  currentUserId: string | null;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  connectionStatus: "idle" | "loading" | "connected" | "disconnected";
  isBusy: boolean;
  partnerProgress?: {
    activeToday: boolean;
    reliabilityLabel: string | null;
    contributionCount: number;
  } | null;
  activeInterviewSession?: InterviewSession | null;
  onSelectConversation: (conversationId: string) => void;
  onSendMessage: (content: string) => Promise<void> | void;
  onRespondCheckin: (payload: { sourceCheckinId: string; status: "done" | "not_done" }) => Promise<void> | void;
  onOpenExchange: () => void;
  onOpenInterview: () => void;
  onExitInterviewMode: () => void;
  onAcceptInterview: (sessionId: string) => Promise<void> | void;
  onDeclineInterview: (sessionId: string) => Promise<void> | void;
  onProposeInterviewSlots: (sessionId: string) => Promise<void> | void;
  onConfirmInterviewSlot: (sessionId: string, slot: string) => Promise<void> | void;
  onDeclineInterviewSchedule: (sessionId: string) => Promise<void> | void;
  onSubmitInterviewAnswer: (sessionId: string, answer: string) => Promise<void> | void;
  onSendInterviewQuestion: (sessionId: string) => Promise<void> | void;
  onSubmitInterviewFeedback: (
    sessionId: string,
    payload: { ratings: { communication?: number | null; technical?: number | null; problemSolving?: number | null; overall?: number | null }; feedback: string }
  ) => Promise<void> | void;
  onEndInterviewSession: (sessionId: string, status: InterviewSession["status"]) => Promise<void> | void;
  // Phase 3: Meeting scheduling
  onOpenScheduleMeeting: () => void;
  onAcceptMeeting: (meetingId: string) => Promise<void> | void;
  onDeclineMeeting: (meetingId: string) => Promise<void> | void;
  onCancelMeeting: (meetingId: string) => Promise<void> | void;
  onProposeNewTime: (meetingId: string) => Promise<void> | void;
};


// ── Anonymous username display helpers ─────────────────────────────────────

/**
 * Extracts initials from a CamelCase anonymous username.
 * "BackendTiger" → "BT", "ReactFalcon" → "RF", null → "RB"
 */
function getInitials(anonUsername: string | null | undefined): string {
  if (!anonUsername) return "RB";
  const words = anonUsername.match(/[A-Z][a-z]*/g) ?? [];
  if (words.length >= 2) return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
  return anonUsername.slice(0, 2).toUpperCase();
}

/** Returns the display name for a partner — falls back to "Matched partner". */
function getPartnerName(partner: { anonUsername: string | null } | null | undefined): string {
  return partner?.anonUsername ?? "Matched partner";
}

const CONNECTION_STATUS_STYLE: Record<string, string> = {
  connected: "bg-[#e6f5ec] text-[#1f6d42] border border-[rgba(31,109,66,0.2)]",
  loading: "bg-rb-primary-light text-rb-primary border border-[rgba(59,42,225,0.15)]",
  disconnected: "bg-rb-danger-bg text-rb-danger border border-[rgba(181,75,54,0.2)]",
  idle: "bg-rb-sub text-rb-muted border border-rb-border"
};

export function ChatWindow({
  currentUserId,
  conversations,
  activeConversationId,
  messages,
  connectionStatus,
  isBusy,
  partnerProgress,
  activeInterviewSession,
  onSelectConversation,
  onSendMessage,
  onRespondCheckin,
  onOpenExchange,
  onOpenInterview,
  onExitInterviewMode,
  onAcceptInterview,
  onDeclineInterview,
  onProposeInterviewSlots,
  onConfirmInterviewSlot,
  onDeclineInterviewSchedule,
  onSubmitInterviewAnswer,
  onSendInterviewQuestion,
  onSubmitInterviewFeedback,
  onEndInterviewSession,
  onOpenScheduleMeeting,
  onAcceptMeeting,
  onDeclineMeeting,
  onCancelMeeting,
  onProposeNewTime
}: ChatWindowProps) {

  const [feedbackText, setFeedbackText] = useState("");
  // Mobile: show conversation list (true) or active chat (false)
  const [showMobileList, setShowMobileList] = useState(true);
  const [ratings, setRatings] = useState<{ communication: number | null; technical: number | null; problemSolving: number | null; overall: number | null }>({
    communication: null,
    technical: null,
    problemSolving: null,
    overall: null
  });
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // When a conversation is selected on mobile, hide list and show chat
  function handleMobileSelectConversation(conversationId: string) {
    onSelectConversation(conversationId);
    setShowMobileList(false);
  }

  // When there's an active conversation, also show chat (e.g. on initial load)
  useEffect(() => {
    if (activeConversationId && conversations.length > 0) {
      // Don't auto-hide list on desktop — only track for mobile rendering
    }
  }, [activeConversationId, conversations.length]);

  const currentUserResponses = useMemo(() => {
    const responseIds = new Map<string, boolean>();
    for (const message of messages) {
      if (
        message.type === "checkin" &&
        message.metadata.kind === "checkin_response" &&
        typeof message.metadata.sourceCheckinId === "string" &&
        message.senderId === currentUserId
      ) {
        responseIds.set(message.metadata.sourceCheckinId, true);
      }
    }
    return responseIds;
  }, [currentUserId, messages]);

  // Track which question indices the candidate has already answered
  const answeredQuestionIndices = useMemo(() => {
    const answered = new Set<number>();
    const activeSessionId = activeInterviewSession?.id ?? null;
    if (!activeSessionId) return answered;

    for (const message of messages) {
      if (message.type === "interview_answer" && message.senderId === currentUserId) {
        const metadata = message.metadata as Record<string, unknown>;
        const messageSessionId = String(metadata.sessionId ?? "");
        if (messageSessionId !== activeSessionId) {
          continue;
        }

        const qIdx = Number(metadata.questionIndex ?? -1);
        if (qIdx >= 0) answered.add(qIdx);
      }
    }
    return answered;
  }, [activeInterviewSession?.id, currentUserId, messages]);

  const sessionCandidateId = activeInterviewSession?.candidateId ?? null;
  const isInterviewLocked = Boolean(
    activeInterviewSession &&
    ["active", "paused"].includes(activeInterviewSession.status) &&
    activeInterviewSession.mode === "text_async"
  );
  const isInterviewer = Boolean(activeInterviewSession && currentUserId === activeInterviewSession.interviewerId);

  const showInterviewerControls = Boolean(activeInterviewSession && activeInterviewSession.status === "active" && isInterviewer);
  const showRescheduleAction = Boolean(
    activeInterviewSession &&
    activeInterviewSession.mode === "live_online" &&
    activeInterviewSession.status !== "cancelled" &&
    activeInterviewSession.status !== "completed" &&
    activeInterviewSession.scheduleStatus !== "confirmed"
  );
  const showEndInterviewAction = Boolean(
    activeInterviewSession && ["pending", "active", "paused"].includes(activeInterviewSession.status)
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // ── Mobile Conversations List ──────────────────────────────────────────────
  function MobileConversationsList() {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* List header */}
        <div className="flex items-center justify-between gap-3 border-b border-rb-border px-4 py-4 shrink-0 bg-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted">RoleBuddy</p>
            <h1 className="font-headline text-xl font-black text-rb-text mt-0.5">Chats</h1>
          </div>
          <span className={`rb-pill ${CONNECTION_STATUS_STYLE[connectionStatus] ?? CONNECTION_STATUS_STYLE.idle}`}>
            {connectionStatus}
          </span>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto rb-scroll-area">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rb-primary-light">
                <MessageCircle className="h-8 w-8 text-rb-primary" />
              </div>
              <div>
                <p className="font-headline text-base font-black text-rb-text">No conversations yet</p>
                <p className="text-sm text-rb-muted mt-1">Get matched with a partner to start chatting.</p>
              </div>
            </div>
          ) : (
            conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => handleMobileSelectConversation(conversation.id)}
                  className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors border-b border-rb-border/50 ${
                    isActive ? "bg-rb-primary-light" : "bg-white hover:bg-rb-surface"
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rb-primary text-sm font-black text-white">
                    {getInitials(conversation.partner?.anonUsername)}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[15px] font-bold text-rb-text">
                        {getPartnerName(conversation.partner)}
                      </p>
                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${
                        conversation.isActive ? "text-[#1f6d42]" : "text-rb-muted"
                      }`}>
                        {conversation.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-rb-muted">
                      {conversation.lastMessage?.content ?? "Start the accountability thread."}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rb-chat-mobile-height grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]"
    >
      {/* ── Sidebar: Conversations list (hidden on mobile, full on desktop) ─────── */}
      <aside className="hidden lg:flex flex-col overflow-hidden rounded-2xl border border-rb-border bg-white shadow-rb-card">
        <div className="flex items-center justify-between gap-3 border-b border-rb-border px-4 py-3.5 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted">Conversations</p>
            <h1 className="font-headline text-lg font-black text-rb-text mt-0.5">Chat</h1>
          </div>
          <span className={`rb-pill ${CONNECTION_STATUS_STYLE[connectionStatus] ?? CONNECTION_STATUS_STYLE.idle}`}>
            {connectionStatus}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 rb-scroll-area">
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-rb-border bg-rb-surface p-4 text-sm text-rb-muted m-2">
              Your matched conversation will appear here once created.
            </div>
          ) : (
            conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                    isActive
                      ? "border-rb-primary/20 bg-rb-primary-light shadow-sm"
                      : "border-transparent bg-white hover:border-rb-border hover:bg-rb-surface"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rb-primary text-sm font-black text-white">
                    {getInitials(conversation.partner?.anonUsername)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-rb-text">
                        {getPartnerName(conversation.partner)}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rb-muted whitespace-nowrap">
                        {conversation.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-rb-muted">
                      {conversation.lastMessage?.content ?? "Start the accountability thread."}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Mobile: show either conversation list OR active chat ─────────────── */}
      {/* On mobile (lg:hidden), show conversation list OR active chat */}
      <div className="lg:hidden flex flex-col overflow-hidden border border-rb-border bg-white shadow-rb-card">
        {showMobileList ? (
          <MobileConversationsList />
        ) : (
          // Active chat on mobile - same as desktop main section but full width
          <section className={`flex flex-col h-full overflow-hidden transition-colors ${activeInterviewSession ? "border-[rgba(59,42,225,0.4)] bg-[linear-gradient(to_bottom,rgba(59,42,225,0.03),transparent)] shadow-[0_0_24px_rgba(59,42,225,0.12)]" : "bg-white"}`}>
            {/* Mobile Chat Header */}
            <header className={`flex items-center gap-2 border-b border-rb-border px-3 py-3 shrink-0 ${activeInterviewSession ? "bg-[rgba(59,42,225,0.02)]" : ""}`}>
              {/* Back button */}
              <button
                type="button"
                onClick={() => setShowMobileList(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rb-surface text-rb-muted hover:bg-rb-primary-light hover:text-rb-primary transition"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              {/* Partner info */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rb-primary text-[11px] font-black text-white">
                  {getInitials(activeConversation?.partner?.anonUsername)}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-rb-muted leading-none mb-0.5">Partner</p>
                  <h2 className="font-headline text-sm font-black text-rb-text leading-tight truncate max-w-[130px]">
                    {getPartnerName(activeConversation?.partner)}
                  </h2>
                </div>
              </div>

              {/* 2x2 action buttons on mobile */}
              <div className="flex flex-col gap-1 shrink-0">
                <div className="flex gap-1">
                  <button
                    type="button"
                    id="mobile-interview-btn"
                    onClick={onOpenInterview}
                    className="flex items-center gap-1 rounded-lg border border-rb-border bg-rb-surface px-2.5 py-1.5 text-[10px] font-bold text-rb-primary transition hover:bg-rb-primary-light"
                  >
                    <BrainCircuit className="h-3 w-3" />
                    Interview
                  </button>
                  <button
                    type="button"
                    id="mobile-schedule-btn"
                    onClick={onOpenScheduleMeeting}
                    className="flex items-center gap-1 rounded-lg border border-rb-border bg-rb-surface px-2.5 py-1.5 text-[10px] font-bold text-rb-primary transition hover:bg-rb-primary-light"
                  >
                    <Video className="h-3 w-3" />
                    Live
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    id="mobile-exchange-btn"
                    onClick={onOpenExchange}
                    className="flex items-center gap-1 rounded-lg border border-rb-border bg-rb-surface px-2.5 py-1.5 text-[10px] font-bold text-rb-primary transition hover:bg-rb-primary-light"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Exchange
                  </button>
                  {showEndInterviewAction && activeInterviewSession ? (
                    <button
                      type="button"
                      id="mobile-end-interview-btn"
                      onClick={() => onEndInterviewSession(activeInterviewSession.id, activeInterviewSession.status)}
                      className="flex items-center gap-1 rounded-lg border border-[rgba(181,75,54,0.3)] bg-rb-danger-bg px-2.5 py-1.5 text-[10px] font-bold text-rb-danger transition hover:bg-red-100"
                    >
                      <XCircle className="h-3 w-3" />
                      End Interview
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onExitInterviewMode}
                      className="flex items-center gap-1 rounded-lg border border-rb-border bg-rb-surface px-2.5 py-1.5 text-[10px] font-bold text-rb-muted transition hover:bg-rb-surface"
                    >
                      <Users className="h-3 w-3" />
                      More
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 rb-scroll-area rb-drawer-bottom-pb">
              {renderMessages()}
            </div>

            {/* Input */}
            <footer className="border-t border-rb-border bg-white px-3 py-3 pb-[calc(0.75rem+68px+env(safe-area-inset-bottom,0px))] shrink-0">
              <InputBox
                disabled={!activeConversation || isBusy || isInterviewLocked}
                placeholder={isInterviewLocked ? "Interview mode active. Regular chat is temporarily locked." : "Type a message…"}
                onSend={onSendMessage}
              />
            </footer>
          </section>
        )}
      </div>

      {/* ── Desktop: Main message area (hidden on mobile) ─────────────────────── */}
      <section className={`hidden lg:flex flex-col overflow-hidden lg:rounded-2xl border transition-colors ${activeInterviewSession ? "border-[rgba(59,42,225,0.4)] bg-[linear-gradient(to_bottom,rgba(59,42,225,0.03),transparent)] shadow-[0_0_24px_rgba(59,42,225,0.12)]" : "border-rb-border bg-white shadow-rb-card"}`}>
        {/* Desktop Header */}
        <header className={`flex items-center justify-between gap-2 border-b border-rb-border px-4 py-3 shrink-0 ${activeInterviewSession ? "bg-[rgba(59,42,225,0.02)]" : ""}`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rb-primary-light text-rb-primary">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-rb-muted leading-none mb-0.5">Partner</p>
              <h2 className="font-headline text-sm font-black text-rb-text leading-tight truncate max-w-[140px] sm:max-w-xs">
                {activeConversation ? getPartnerName(activeConversation.partner) : "Select a conversation"}
              </h2>
              {/* Partner progress — desktop */}
              {partnerProgress && activeConversation && (
                <div className="hidden sm:flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide ${
                    partnerProgress.activeToday ? "text-[#1f6d42]" : "text-rb-muted"
                  }`}>
                    <span className={`mr-1 h-1.5 w-1.5 rounded-full inline-block ${
                      partnerProgress.activeToday ? "bg-[#1f6d42]" : "bg-rb-muted"
                    }`} aria-hidden />
                    {partnerProgress.activeToday ? "Active today" : "Inactive today"}
                  </span>
                  {partnerProgress.reliabilityLabel && (
                    <span className="text-[10px] font-semibold text-rb-muted">· {partnerProgress.reliabilityLabel}</span>
                  )}
                  <span className="text-[10px] text-rb-muted">
                    · {partnerProgress.contributionCount} contribution{partnerProgress.contributionCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-rb-border bg-rb-surface px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-rb-muted">
              <MessageCircle className="h-3.5 w-3.5" />
              Accountability chat
            </div>
            <button type="button" className="rb-button-secondary !py-2 !px-3 text-xs" onClick={onOpenInterview}>
              <BrainCircuit className="mr-1.5 h-3.5 w-3.5 inline" />
              Interview
            </button>
            <button type="button" className="rb-button-secondary !py-2 !px-3 text-xs" onClick={onOpenScheduleMeeting}>
              <Video className="mr-1.5 h-3.5 w-3.5 inline" />
              <span className="hidden md:inline">Schedule </span>Live
            </button>
            {showEndInterviewAction && activeInterviewSession && (
              <button
                type="button"
                className="rb-button-secondary !py-2 !px-3 text-xs"
                onClick={() => onEndInterviewSession(activeInterviewSession.id, activeInterviewSession.status)}
              >
                End Interview
              </button>
            )}
            <button type="button" className="rb-button-secondary !py-2 !px-3 text-xs" onClick={onOpenExchange}>
              Exchange
            </button>
          </div>
        </header>

        {/* Desktop Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 rb-scroll-area rb-drawer-bottom-pb">
          {renderInterviewBannerAndControls()}
          {renderMessages()}
        </div>

        {/* Desktop Input */}
        <footer className="border-t border-rb-border bg-rb-surface px-4 py-3 sm:px-5 shrink-0">
          <InputBox
            disabled={!activeConversation || isBusy || isInterviewLocked}
            placeholder={isInterviewLocked ? "Interview mode active. Regular chat is temporarily locked." : "Type a message…"}
            onSend={onSendMessage}
          />
        </footer>
      </section>
    </div>
  );

  function renderInterviewBannerAndControls() {
    return (
      <>
        {activeInterviewSession && (activeInterviewSession.status === "active" || activeInterviewSession.status === "pending" || activeInterviewSession.status === "paused") && (
          <div className="mb-3">
            <InterviewBanner
              session={activeInterviewSession}
              currentUserId={currentUserId}
              onExit={onExitInterviewMode}
            />
          </div>
        )}
        {showInterviewerControls && activeInterviewSession && (
          <div className="mb-3 rounded-xl border border-rb-border bg-rb-surface p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rb-button-primary !py-2 !px-3 text-xs"
                onClick={() => onSendInterviewQuestion(activeInterviewSession.id)}
              >
                Send Next Question
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {(["overall", "technical", "communication", "problemSolving"] as const).map((key) => (
                <select
                  key={key}
                  className="rounded-lg border border-rb-border bg-white px-2 py-2 text-xs"
                  value={ratings[key] ?? ""}
                  onChange={(event) =>
                    setRatings((current) => ({
                      ...current,
                      [key]: event.target.value ? Number(event.target.value) : null
                    }))
                  }
                >
                  <option value="">{key}</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              ))}
            </div>
            <textarea
              className="mt-2 w-full rounded-lg border border-rb-border bg-white px-3 py-2 text-sm"
              placeholder="Feedback (optional)"
              rows={2}
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
            />
            <button
              type="button"
              className="rb-button-secondary mt-2 !py-2 !px-3 text-xs"
              onClick={() =>
                onSubmitInterviewFeedback(activeInterviewSession.id, {
                  ratings,
                  feedback: feedbackText
                })
              }
            >
              Submit Feedback
            </button>
          </div>
        )}
        {showRescheduleAction && activeInterviewSession && (
          <div className="mb-3 rounded-xl border border-rb-border bg-rb-surface p-3">
            <p className="text-xs text-rb-muted">
              {activeInterviewSession.scheduleStatus === "missed"
                ? "Scheduled live-online slot was missed. Propose new slots to continue."
                : "Need a different time? Propose new slots before accepting."}
            </p>
            <button
              type="button"
              className="rb-button-primary mt-2 !py-2 !px-3 text-xs"
              onClick={() => onProposeInterviewSlots(activeInterviewSession.id)}
            >
              Propose New Time
            </button>
          </div>
        )}
      </>
    );
  }

  function renderMessages() {
    if (!activeConversation) {
      return (
        <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-rb-border bg-rb-surface text-center">
          <div className="max-w-sm space-y-2 px-6">
            <p className="font-headline text-base font-black text-rb-text">No conversation selected</p>
            <p className="text-sm text-rb-muted">Choose your matched partner to start the accountability thread.</p>
          </div>
        </div>
      );
    }
    if (isBusy && messages.length === 0) {
      return (
        <div className="flex h-full min-h-[200px] items-center justify-center">
          <LoaderCircle className="h-5 w-5 animate-spin text-rb-muted" />
        </div>
      );
    }
    if (messages.length === 0) {
      return (
        <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-rb-border bg-rb-surface text-center">
          <div className="max-w-sm space-y-2 px-6">
            <p className="font-headline text-base font-black text-rb-text">Ready to begin</p>
            <p className="text-sm text-rb-muted">
              Send a message or respond to the daily check-in to keep the loop going.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId;
          const hasCurrentUserResponded =
            message.type === "checkin" && message.metadata.kind === "daily_checkin"
              ? Boolean(currentUserResponses.get(message.id))
              : false;
          return (
            <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <MessageBubble
                message={message}
                isOwn={isOwn}
                currentUserId={currentUserId}
                hasCurrentUserResponded={hasCurrentUserResponded}
                activeInterviewSession={activeInterviewSession}
                onRespondCheckin={onRespondCheckin}
                onOpenExchange={onOpenExchange}
                sessionCandidateId={sessionCandidateId}
                sessionAnsweredQuestions={answeredQuestionIndices}
                onProposeInterviewSlots={(id) => void onProposeInterviewSlots(id)}
                onAcceptInterview={(id) => void onAcceptInterview(id)}
                onDeclineInterview={(id) => void onDeclineInterview(id)}
                onConfirmInterviewSlot={(id, slot) => void onConfirmInterviewSlot(id, slot)}
                onDeclineInterviewSchedule={(id) => void onDeclineInterviewSchedule(id)}
                onSubmitAnswer={(id, ans) => void onSubmitInterviewAnswer(id, ans)}
                onAcceptMeeting={(id) => void onAcceptMeeting(id)}
                onDeclineMeeting={(id) => void onDeclineMeeting(id)}
                onCancelMeeting={(id) => void onCancelMeeting(id)}
                onProposeNewTime={(id) => void onProposeNewTime(id)}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    );
  }
}
