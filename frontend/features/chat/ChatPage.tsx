"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Zap } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import {
  acceptExchange,
  createConversation,
  createExchange,
  getConversations,
  getExchangeProfile,
  getExchanges,
  getMessages,
  listExchangeEntries,
  reportExchange,
  saveExchangeProfile,
  sendMessage,
  shareExchangeEntry,
  unlockSensitiveExchange,
  shareSensitiveInfo
} from "./chat.api";
import {
  acceptInterview,
  completeInterview,
  confirmInterviewSlot,
  declineInterviewScheduling,
  disconnectGoogleCalendar,
  declineInterview,
  getGoogleCalendarConnectUrl,
  getGoogleCalendarStatus,
  getActiveInterviewSession,
  pauseInterview,
  proposeInterviewSlots,
  requestInterview,
  sendInterviewQuestion,
  submitInterviewFeedback,
  submitInterviewAnswer
} from "./interview.api";
import { createChatSocket, emitWithAck } from "./chat.socket";
import { ExchangeDrawer } from "./ExchangeDrawer";
import { InterviewDrawer } from "./InterviewDrawer";
import { TemplateManager } from "./TemplateManager";
import { ChatWindow } from "./ChatWindow";
import type { ChatConversation, ChatMessage, ExchangeEntry, ExchangeProfile, ExchangeRecord, ExchangeType, InterviewSession, SensitiveTemplate } from "./types";
import type { AuthUser } from "../auth/types";
import { getProfile } from "../auth/auth.api";
import { getProfile as getPartnerProfile } from "../connection/connection.api";
import { scheduleMeeting, acceptMeeting, declineMeeting, cancelMeeting } from "./meeting.api";
import { MeetingSchedulerModal } from "./MeetingSchedulerModal";
import type { InterviewMeetingSession, ScheduleMeetingPayload } from "./types";


const GOOGLE_CALENDAR_SETUP_MESSAGE =
  "Google Calendar is not enabled for this deployment yet. The app owner needs to set the Google OAuth credentials before users can connect.";

type SocketState = "idle" | "loading" | "connected" | "disconnected";

function generateClientMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function upsertMessage(list: ChatMessage[], nextMessage: ChatMessage) {
  const existingIndex = list.findIndex((message) => message.id === nextMessage.id);
  if (existingIndex >= 0) {
    const nextList = [...list];
    nextList[existingIndex] = nextMessage;
    return nextList;
  }
  return [...list, nextMessage].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

export function ChatPage() {
  const router = useRouter();
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<SocketState>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeFeedback, setExchangeFeedback] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>([]);
  const [activeExchange, setActiveExchange] = useState<ExchangeRecord | null>(null);
  const [exchangeEntries, setExchangeEntries] = useState<ExchangeEntry[]>([]);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeProfile, setExchangeProfile] = useState<ExchangeProfile | null>(null);
  const [partnerProgress, setPartnerProgress] = useState<{
    activeToday: boolean;
    reliabilityLabel: string | null;
    contributionCount: number;
  } | null>(null);

  // Interview state
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [activeInterviewSession, setActiveInterviewSession] = useState<InterviewSession | null>(null);
  const [showInterviewBanner, setShowInterviewBanner] = useState(true);
  const [googleCalendarConfigured, setGoogleCalendarConfigured] = useState(false);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);

  // Phase 3: Meeting scheduling state
  const [meetingSchedulerOpen, setMeetingSchedulerOpen] = useState(false);


  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const profileResponse = await getProfile();
        if (!mounted) return;

        const user = profileResponse.data.user;
        setCurrentUser(user);

        if (!user.onboardingCompleted) {
          router.replace("/onboarding");
          return;
        }

        const conversationsResponse = await getConversations();
        let nextConversations = conversationsResponse.data.conversations;

        if (user.status === "matched" && user.matchedUserId && nextConversations.length === 0) {
          const createdConversation = await createConversation({ partnerId: user.matchedUserId });
          nextConversations = [createdConversation.data.conversation];
        }

        if (!mounted) return;

        setConversations(nextConversations);
        const exchangeResponse = await getExchanges();
        if (mounted) setExchanges(exchangeResponse.data.exchanges);
        const exchangeProfileResponse = await getExchangeProfile();
        if (mounted) setExchangeProfile(exchangeProfileResponse.data.profile);
        try {
          const calendarStatus = await getGoogleCalendarStatus();
          if (mounted) {
            setGoogleCalendarConfigured(calendarStatus.data.configured);
            setGoogleCalendarConnected(calendarStatus.data.connected);
          }
        } catch {
          if (mounted) {
            setGoogleCalendarConfigured(false);
            setGoogleCalendarConnected(false);
          }
        }

        const initialConversation = nextConversations[0] ?? null;
        if (initialConversation) {
          setActiveConversationId(initialConversation.id);
          const messageResponse = await getMessages(initialConversation.id);
          if (mounted) setMessages(messageResponse.data.messages);
          // Fetch active interview session for initial conversation
          try {
            const sessionRes = await getActiveInterviewSession(initialConversation.id);
            if (mounted) {
              setActiveInterviewSession(sessionRes.data.session);
              setShowInterviewBanner(sessionRes.data.session?.status !== "paused");
            }
          } catch {
            // No active session — not an error
          }
        }
      } catch (bootstrapError) {
        if (!mounted) return;
        setError(bootstrapError instanceof Error ? bootstrapError.message : "Unable to load chat.");
        router.replace("/login");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => { mounted = false; };
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    const socket = createChatSocket();
    socketRef.current = socket;
    setConnectionStatus("loading");

    socket.on("connect", () => setConnectionStatus("connected"));
    socket.on("disconnect", () => setConnectionStatus("disconnected"));
    socket.on("connect_error", () => setConnectionStatus("disconnected"));

    socket.on("receive_message", (message: ChatMessage) => {
      if (message.conversationId !== activeConversationId) {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === message.conversationId
              ? { ...conversation, lastMessage: message, updatedAt: message.createdAt }
              : conversation
          )
        );
        return;
      }
      setMessages((current) => upsertMessage(current, message));
    });

    socket.on("mark_seen", ({ message }: { message: ChatMessage }) => {
      if (message.conversationId !== activeConversationId) return;
      setMessages((current) => current.map((item) => (item.id === message.id ? message : item)));
    });

    socket.on("exchange_updated", async () => {
      const response = await getExchanges();
      setExchanges(response.data.exchanges);
    });

    socket.on("exchange_trust_updated", async () => {
      const [exchangeResponse, exchangeProfileResponse] = await Promise.all([getExchanges(), getExchangeProfile()]);
      setExchanges(exchangeResponse.data.exchanges);
      setExchangeProfile(exchangeProfileResponse.data.profile);
    });

    // Interview socket events
    socket.on("interview_started", ({ session }: { session: InterviewSession }) => {
      setActiveInterviewSession(session);
      setShowInterviewBanner(true);
    });

    socket.on("interview_question_sent", ({ session }: { session: InterviewSession }) => {
      setActiveInterviewSession(session);
    });

    socket.on("interview_answer_submitted", () => {
      // Message already in timeline via receive_message
    });

    socket.on("interview_feedback_added", ({ session }: { session: InterviewSession }) => {
      setActiveInterviewSession(session);
    });

    socket.on("interview_completed", ({ session }: { session: InterviewSession }) => {
      setActiveInterviewSession(session);
    });

    socket.on("interview_paused", ({ session }: { session: InterviewSession }) => {
      setActiveInterviewSession(session);
      setShowInterviewBanner(false);
    });
    socket.on("interview_presence_changed", ({ liveOnlineStatus }: { liveOnlineStatus: InterviewSession["liveOnlineStatus"] }) => {
      setActiveInterviewSession((prev) => (prev ? { ...prev, liveOnlineStatus } : prev));
    });

    // Phase 3: Meeting socket events
    // The meeting service emits new messages directly via receive_message,
    // so the conversation timeline updates automatically.
    // These events let the UI update any meeting-specific state if needed.
    socket.on("interview_schedule_requested", ({ meeting }: { meeting: InterviewMeetingSession }) => {
      // Message already in timeline via receive_message
      void meeting;
    });
    socket.on("interview_meeting_created", ({ meeting }: { meeting: InterviewMeetingSession }) => {
      void meeting;
    });
    socket.on("interview_meeting_cancelled", ({ meeting }: { meeting: InterviewMeetingSession }) => {
      void meeting;
    });


    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeConversationId, currentUser]);

  useEffect(() => {
    if (!socketRef.current || !activeConversationId || !activeConversation) return;
    socketRef.current.emit("join_conversation", {
      conversationId: activeConversationId,
      partnerId: activeConversation.partner?.id ?? null
    });
  }, [activeConversation, activeConversationId]);

  useEffect(() => {
    if (!activeConversation?.partner?.id || !exchanges.length) {
      setActiveExchange(null);
      setExchangeEntries([]);
      return;
    }

    const partnerId = activeConversation.partner.id;
    const match = exchanges.find((exchange) => {
      return conversationHasPartner(exchange, currentUser?.id ?? null, partnerId);
    }) ?? null;
    setActiveExchange(match);
    if (match) {
      void listExchangeEntries(match.id).then((result) => setExchangeEntries(result.data.entries)).catch(() => {});
    } else {
      setExchangeEntries([]);
    }
  }, [activeConversation?.partner?.id, currentUser?.id, exchanges]);

  // Fetch partner professional progress when active conversation changes
  useEffect(() => {
    const partnerId = activeConversation?.partner?.id ?? null;
    if (!partnerId) {
      setPartnerProgress(null);
      return;
    }

    getPartnerProfile(partnerId)
      .then((res) => {
        const profile = res.data;
        setPartnerProgress({
          activeToday: profile.activeToday ?? false,
          reliabilityLabel: profile.reliabilityLabel ?? null,
          contributionCount: profile.contributionCount ?? 0
        });
      })
      .catch(() => {
        setPartnerProgress(null);
      });
  }, [activeConversation?.partner?.id]);

  useEffect(() => {
    if (!socketRef.current || connectionStatus !== "connected" || !messages.length || !currentUser || !activeConversationId) return;
    const unreadMessages = messages.filter(
      (message) => message.senderId !== currentUser.id && !message.seenBy.includes(currentUser.id)
    );
    for (const unreadMessage of unreadMessages) {
      socketRef.current.emit("mark_seen", { messageId: unreadMessage.id });
    }
  }, [activeConversationId, connectionStatus, currentUser, messages]);

  async function handleSelectConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setIsBusy(true);
    // Reset interview state for new conversation
    setActiveInterviewSession(null);
    setShowInterviewBanner(false);
    try {
      const [messageResponse, sessionResponse] = await Promise.allSettled([
        getMessages(conversationId),
        getActiveInterviewSession(conversationId)
      ]);
      if (messageResponse.status === "fulfilled") {
        setMessages(messageResponse.value.data.messages);
      }
      if (sessionResponse.status === "fulfilled") {
        setActiveInterviewSession(sessionResponse.value.data.session);
        setShowInterviewBanner(sessionResponse.value.data.session?.status !== "paused");
      }
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Unable to load messages.");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendChatMessage(content: string) {
    if (!activeConversationId) return;
    setIsBusy(true);
    const payload = {
      conversationId: activeConversationId,
      type: "text" as const,
      content,
      metadata: { clientMessageId: generateClientMessageId() }
    };
    try {
      if (socketRef.current && connectionStatus === "connected") {
        const nextMessage = await emitWithAck<ChatMessage>(socketRef.current, "send_message", payload);
        setMessages((current) => upsertMessage(current, nextMessage));
      } else {
        const response = await sendMessage(payload);
        setMessages((current) => upsertMessage(current, response.data.message));
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === activeConversationId
              ? { ...conversation, lastMessage: response.data.message, updatedAt: response.data.message.createdAt }
              : conversation
          )
        );
      }
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Unable to send message.");
    } finally {
      setIsBusy(false);
    }
  }

  async function respondToCheckin(payload: { sourceCheckinId: string; status: "done" | "not_done" }) {
    if (!activeConversationId) return;
    setIsBusy(true);
    const requestPayload = {
      conversationId: activeConversationId,
      type: "checkin" as const,
      metadata: {
        clientMessageId: generateClientMessageId(),
        sourceCheckinId: payload.sourceCheckinId,
        status: payload.status,
        dateKey: new Date().toISOString().slice(0, 10)
      }
    };
    try {
      if (socketRef.current && connectionStatus === "connected") {
        const nextMessage = await emitWithAck<ChatMessage>(socketRef.current, "send_message", requestPayload);
        setMessages((current) => upsertMessage(current, nextMessage));
      } else {
        const response = await sendMessage(requestPayload);
        setMessages((current) => upsertMessage(current, response.data.message));
        if (response.data.alert) {
          setMessages((current) => upsertMessage(current, response.data.alert as ChatMessage));
        }
      }
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Unable to submit check-in response.");
    } finally {
      setIsBusy(false);
    }
  }

  async function refreshExchanges() {
    const response = await getExchanges();
    setExchanges(response.data.exchanges);
  }

  async function refreshExchangeProfile() {
    const response = await getExchangeProfile();
    setExchangeProfile(response.data.profile);
  }

  async function handleCreateExchange(exchangeType: ExchangeType) {
    if (!activeConversation?.partner?.id) return;
    setIsBusy(true);
    setError(null);
    setExchangeFeedback(null);
    try {
      await createExchange({ targetUserId: activeConversation.partner.id, exchangeType });
      await refreshExchanges();
      setExchangeOpen(true);
    } catch (exchangeError) {
      setError(
        exchangeError instanceof Error
          ? exchangeError.message
          : "Unable to start professional exchange. Please ensure you’re matched or connected to this user."
      );
      setExchangeOpen(true);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAcceptExchange() {
    if (!activeExchange) return;
    setIsBusy(true);
    setError(null);
    try {
      await acceptExchange(activeExchange.id);
    } catch (acceptError) {
      // If the exchange was already accepted/activated on another refresh, just reload state.
      setError(acceptError instanceof Error ? acceptError.message : "Unable to accept exchange.");
    } finally {
      await refreshExchanges();
      setIsBusy(false);
    }
  }

  async function handleUnlockSensitive() {
    if (!activeExchange) return;
    setIsBusy(true);
    setError(null);
    setExchangeFeedback(null);
    try {
      await unlockSensitiveExchange(activeExchange.id);
      setExchangeFeedback("Sensitive unlock preference saved. If both approve, the sensitive layer unlocks.");
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : "Unable to update sensitive unlock.");
    } finally {
      await refreshExchanges();
      setIsBusy(false);
    }
  }

  async function handleShareEntry(entryType: "role" | "interview" | "sensitive", content: string) {
    if (!activeExchange) return;
    await shareExchangeEntry({ exchangeId: activeExchange.id, entryType, content });
    const response = await listExchangeEntries(activeExchange.id);
    setExchangeEntries(response.data.entries);
  }

  async function handleShareSensitive(template: SensitiveTemplate) {
    if (!activeExchange) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await shareSensitiveInfo(activeExchange.id, template);
      if (response.data.waiting) {
        setExchangeFeedback(response.data.message ?? "Your sensitive info is saved. Waiting for your partner to submit theirs — both will be revealed simultaneously.");
      } else {
        setExchangeFeedback("Both sensitive templates revealed in chat!");
      }
      // Refresh messages to show the new system messages
      if (activeConversationId) {
        const msgResponse = await getMessages(activeConversationId);
        setMessages(msgResponse.data.messages);
      }
    } catch (sensitiveError) {
      // Re-throw so the drawer's inline form can catch and display it
      throw sensitiveError;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReportExchange(reason: string) {
    if (!activeExchange) return;
    await reportExchange(activeExchange.id, reason);
    await refreshExchanges();
  }

  // ── Interview handlers ──────────────────────────────────────────────────────

  async function handleRequestInterview(payload: {
    conversationId: string;
    templateId: string;
    interviewerRole: "interviewer" | "candidate";
    mode: "text_async" | "live_online" | "live_video";
    proposedSlots?: string[];
    timezoneHint?: string;
  }) {
    setError(null);
    try {
      const response = await requestInterview(payload);
      setActiveInterviewSession(response.data.session);
      setShowInterviewBanner(true);
      setInterviewOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send interview request.");
      throw err;
    }
  }

  async function handleAcceptInterview(sessionId: string) {
    setError(null);
    try {
      const response = await acceptInterview(sessionId);
      setActiveInterviewSession(response.data.session);
      setShowInterviewBanner(true);
      if (activeConversationId) {
        const msgResponse = await getMessages(activeConversationId);
        setMessages(msgResponse.data.messages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept interview.");
    }
  }

  async function handleConfirmInterviewSlot(sessionId: string, slot: string) {
    setError(null);
    try {
      const response = await confirmInterviewSlot(sessionId, slot);
      setActiveInterviewSession(response.data.session);
      setShowInterviewBanner(true);
      if (activeConversationId) {
        const msgResponse = await getMessages(activeConversationId);
        setMessages(msgResponse.data.messages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm slot.");
    }
  }

  async function handleDeclineInterviewSchedule(sessionId: string) {
    setError(null);
    try {
      const response = await declineInterviewScheduling(sessionId);
      setActiveInterviewSession(response.data.session);
      setShowInterviewBanner(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to decline schedule.");
    }
  }

  async function handleProposeInterviewSlots(sessionId: string) {
    const slotA = typeof window === "undefined" ? null : window.prompt("Enter slot 1 (YYYY-MM-DDTHH:mm)");
    const slotB = typeof window === "undefined" ? null : window.prompt("Enter slot 2 (YYYY-MM-DDTHH:mm)");
    const slotC = typeof window === "undefined" ? null : window.prompt("Optional slot 3 (YYYY-MM-DDTHH:mm)");
    const slots = [slotA, slotB, slotC].filter((slot): slot is string => Boolean(slot && slot.trim()));
    if (slots.length < 2) {
      setError("At least 2 slots are required.");
      return;
    }

    setError(null);
    try {
      const response = await proposeInterviewSlots(sessionId, {
        proposedSlots: slots.map((slot) => new Date(slot).toISOString()),
        timezoneHint: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      setActiveInterviewSession(response.data.session);
      setShowInterviewBanner(true);
      if (activeConversationId) {
        const msgResponse = await getMessages(activeConversationId);
        setMessages(msgResponse.data.messages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to re-propose slots.");
    }
  }

  async function handleDeclineInterview(sessionId: string) {
    setError(null);
    try {
      const response = await declineInterview(sessionId);
      setActiveInterviewSession(response.data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to decline interview.");
    }
  }

  async function handleSubmitInterviewAnswer(sessionId: string, answer: string) {
    setError(null);
    try {
      await submitInterviewAnswer(sessionId, answer);
      // Realtime should update via socket, but keep deterministic fallback to avoid requiring manual refresh.
      if (activeConversationId) {
        const [msgResponse, sessionResponse] = await Promise.allSettled([
          getMessages(activeConversationId),
          getActiveInterviewSession(activeConversationId)
        ]);
        if (msgResponse.status === "fulfilled") {
          setMessages(msgResponse.value.data.messages);
        }
        if (sessionResponse.status === "fulfilled") {
          setActiveInterviewSession(sessionResponse.value.data.session);
          setShowInterviewBanner(Boolean(sessionResponse.value.data.session));
        } else {
          setActiveInterviewSession(null);
          setShowInterviewBanner(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit answer.");
    }
  }

  async function handleSendInterviewQuestion(sessionId: string) {
    setError(null);
    try {
      const response = await sendInterviewQuestion(sessionId);
      setActiveInterviewSession(response.data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send interview question.");
    }
  }

  async function handleSubmitInterviewFeedback(
    sessionId: string,
    payload: {
      ratings: { communication?: number | null; technical?: number | null; problemSolving?: number | null; overall?: number | null };
      feedback: string;
    }
  ) {
    setError(null);
    try {
      const response = await submitInterviewFeedback(sessionId, payload);
      setActiveInterviewSession(response.data.session);
      setShowInterviewBanner(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit interview feedback.");
    }
  }

  async function handleExitInterviewMode() {
    if (!activeInterviewSession || activeInterviewSession.status !== "active") {
      setShowInterviewBanner(false);
      return;
    }
    setError(null);
    try {
      const response = await pauseInterview(activeInterviewSession.id);
      setActiveInterviewSession(response.data.session);
      setShowInterviewBanner(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to exit interview mode.");
    }
  }

  async function handleEndInterviewSession(sessionId: string, status: InterviewSession["status"]) {
    const confirmed = typeof window === "undefined" ? true : window.confirm("End this interview session and resume normal chat?");
    if (!confirmed) return;

    setError(null);
    try {
      if (status === "pending") {
        const response = await declineInterview(sessionId);
        setActiveInterviewSession(response.data.session);
      } else {
        const response = await completeInterview(sessionId);
        setActiveInterviewSession(response.data.session);
      }
      setShowInterviewBanner(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to end interview session.");
    }
  }

  async function handleSaveProfile(payload: {
    lastJobExperience?: string;
    lastInterviewExperience?: string;
    roleTransitionNotes?: string;
    roleTemplate?: ExchangeProfile["roleTemplate"];
    interviewTemplate?: ExchangeProfile["interviewTemplate"];
  }) {
    await saveExchangeProfile(payload);
    await refreshExchangeProfile();
  }

  async function handleConnectGoogleCalendar() {
    setError(null);
    try {
      const response = await getGoogleCalendarConnectUrl();
      if (typeof window !== "undefined") {
        window.location.href = response.data.connectUrl;
      }
    } catch (err) {
      const message = err instanceof Error && err.message.includes("not configured")
        ? GOOGLE_CALENDAR_SETUP_MESSAGE
        : err instanceof Error
          ? err.message
          : "Unable to start Google Calendar connection.";
      setError(message);
    }
  }

  async function handleDisconnectGoogleCalendar() {
    setError(null);
    try {
      const response = await disconnectGoogleCalendar();
      setGoogleCalendarConnected(response.data.connected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to disconnect Google Calendar.");
    }
  }

  // ── Phase 3: Meeting handlers ────────────────────────────────────────────────

  async function handleScheduleMeeting(payload: ScheduleMeetingPayload) {
    setError(null);
    try {
      await scheduleMeeting(payload);
      // The new message arrives via socket/receive_message, so no manual refresh needed.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to schedule meeting.");
      throw err;
    }
  }

  async function handleAcceptMeeting(meetingId: string) {
    setError(null);
    try {
      await acceptMeeting(meetingId);
      // Meeting card message arrives via receive_message socket event.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept meeting.");
    }
  }

  async function handleDeclineMeeting(meetingId: string) {
    setError(null);
    try {
      await declineMeeting(meetingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to decline meeting.");
    }
  }

  async function handleCancelMeeting(meetingId: string) {
    setError(null);
    try {
      await cancelMeeting(meetingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel meeting.");
    }
  }

  async function handleProposeNewTime(meetingId: string) {
    setError(null);
    try {
      await declineMeeting(meetingId);
      setMeetingSchedulerOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to propose new time.");
    }
  }


  // Full page loader

  if (isLoading && !currentUser) {
    return (
      <AppLayout>
        <div className="rb-page-loader">
          <div className="rb-page-loader-inner">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rb-primary">
              <Zap className="h-6 w-6 text-white fill-white" />
            </div>
            <div className="rb-spinner" />
            <p className="text-xs font-bold uppercase tracking-widest text-rb-muted">Loading chat workspace</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-0 py-0 sm:page-container sm:!py-5">
        {error && (
          <div className="mb-4 rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-4 py-3 text-sm text-rb-danger">
            {error}
          </div>
        )}
        {exchangeFeedback && !error && (
          <div className="mb-4 rounded-xl border border-[rgba(31,109,66,0.2)] bg-rb-success-bg px-4 py-3 text-sm text-rb-success">
            {exchangeFeedback}
          </div>
        )}

        <ChatWindow
          currentUserId={currentUser?.id ?? null}
          conversations={conversations}
          activeConversationId={activeConversationId}
          messages={messages}
          connectionStatus={connectionStatus}
          isBusy={isBusy}
          partnerProgress={partnerProgress}
          activeInterviewSession={showInterviewBanner ? activeInterviewSession : null}
          onSelectConversation={handleSelectConversation}
          onSendMessage={sendChatMessage}
          onRespondCheckin={respondToCheckin}
          onOpenExchange={() => setExchangeOpen(true)}
          onOpenInterview={() => setInterviewOpen(true)}
          onExitInterviewMode={handleExitInterviewMode}
          onAcceptInterview={handleAcceptInterview}
          onDeclineInterview={handleDeclineInterview}
          onProposeInterviewSlots={handleProposeInterviewSlots}
          onConfirmInterviewSlot={handleConfirmInterviewSlot}
          onDeclineInterviewSchedule={handleDeclineInterviewSchedule}
          onSubmitInterviewAnswer={handleSubmitInterviewAnswer}
          onSendInterviewQuestion={handleSendInterviewQuestion}
          onSubmitInterviewFeedback={handleSubmitInterviewFeedback}
          onEndInterviewSession={handleEndInterviewSession}
          onOpenScheduleMeeting={() => setMeetingSchedulerOpen(true)}
          onAcceptMeeting={handleAcceptMeeting}
          onDeclineMeeting={handleDeclineMeeting}
          onCancelMeeting={handleCancelMeeting}
          onProposeNewTime={handleProposeNewTime}
        />


        <ExchangeDrawer
          isOpen={exchangeOpen}
          exchange={activeExchange}
          entries={exchangeEntries}
          profile={exchangeProfile}
          onClose={() => setExchangeOpen(false)}
          onCreateExchange={handleCreateExchange}
          onAccept={handleAcceptExchange}
          onUnlockSensitive={handleUnlockSensitive}
          onShareEntry={handleShareEntry}
          onReport={handleReportExchange}
          onSaveProfile={handleSaveProfile}
          onShareSensitive={handleShareSensitive}
        />
        <InterviewDrawer
          isOpen={interviewOpen}
          conversationId={activeConversationId}
          partnerDomain={currentUser?.domain ?? null}
          currentUserId={currentUser?.id ?? null}
          onClose={() => setInterviewOpen(false)}
          onRequestInterview={handleRequestInterview}
          onOpenTemplateManager={() => setTemplateManagerOpen(true)}
          onConnectGoogleCalendar={handleConnectGoogleCalendar}
          onDisconnectGoogleCalendar={handleDisconnectGoogleCalendar}
          googleCalendarConfigured={googleCalendarConfigured}
          googleCalendarConnected={googleCalendarConnected}
        />
        <TemplateManager
          isOpen={templateManagerOpen}
          onClose={() => setTemplateManagerOpen(false)}
        />
        <MeetingSchedulerModal
          isOpen={meetingSchedulerOpen}
          conversationId={activeConversationId}
          onClose={() => setMeetingSchedulerOpen(false)}
          onSchedule={handleScheduleMeeting}
        />
      </div>

      {/* Chat-page only: white strip behind the floating nav on mobile.
          Prevents the rb-app-bg blue gradient from bleeding through below the chat card.
          z-[49] keeps it below the floating nav (z-50) but above page content. */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden bg-white"
        style={{ height: "calc(88px + env(safe-area-inset-bottom, 0px))", zIndex: 49 }}
        aria-hidden
      />

    </AppLayout>
  );
}



function conversationHasPartner(exchange: ExchangeRecord, currentUserId: string | null, partnerId: string) {
  if (!currentUserId) return false;
  return exchange.participants.includes(currentUserId) && exchange.participants.includes(partnerId);
}
