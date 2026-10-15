import { apiRequest } from "@/services/api";

import type {
  ConversationsResponse,
  CreateConversationPayload,
  CreateConversationResponse,
  MessagesResponse,
  SendMessagePayload,
  SendMessageResponse,
  ExchangeRecord,
  ExchangeEntry,
  ExchangeType,
  ExchangeProfile,
  SensitiveTemplate
} from "./types";

export function getConversations() {
  return apiRequest<ConversationsResponse>("/conversations", {
    method: "GET",
    credentials: "include"
  });
}

export function createConversation(payload: CreateConversationPayload = {}) {
  return apiRequest<CreateConversationResponse>("/conversations", {
    method: "POST",
    body: JSON.stringify(payload),
    credentials: "include"
  });
}

export function getMessages(conversationId: string, page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });

  return apiRequest<MessagesResponse>(`/messages/${conversationId}?${params.toString()}`, {
    method: "GET",
    credentials: "include"
  });
}

export function sendMessage(payload: SendMessagePayload) {
  return apiRequest<SendMessageResponse>("/messages", {
    method: "POST",
    body: JSON.stringify(payload),
    credentials: "include"
  });
}

export function markMessageSeen(messageId: string) {
  return apiRequest<{ message: string; data: { message: unknown } }>(`/messages/${messageId}/seen`, {
    method: "POST",
    body: JSON.stringify({}),
    credentials: "include"
  });
}

export function getExchanges() {
  return apiRequest<{ message: string; data: { exchanges: ExchangeRecord[] } }>("/exchanges", {
    method: "GET",
    credentials: "include"
  });
}

export function createExchange(payload: { targetUserId: string; exchangeType: ExchangeType }) {
  return apiRequest<{ message: string; data: { exchange: ExchangeRecord; warnings: string[]; created?: boolean } }>("/exchanges", {
    method: "POST",
    body: JSON.stringify(payload),
    credentials: "include"
  });
}

export function acceptExchange(exchangeId: string) {
  return apiRequest<{ message: string; data: { exchange: ExchangeRecord } }>(`/exchanges/${exchangeId}/accept`, {
    method: "POST",
    body: JSON.stringify({}),
    credentials: "include"
  });
}

export function unlockSensitiveExchange(exchangeId: string) {
  return apiRequest<{ message: string; data: { exchange: ExchangeRecord; warning: string } }>(
    `/exchanges/${exchangeId}/unlock-sensitive`,
    {
      method: "POST",
      body: JSON.stringify({}),
      credentials: "include"
    }
  );
}

export function completeExchange(exchangeId: string) {
  return apiRequest<{ message: string; data: { exchange: ExchangeRecord } }>(`/exchanges/${exchangeId}/complete`, {
    method: "POST",
    body: JSON.stringify({}),
    credentials: "include"
  });
}

export function reportExchange(exchangeId: string, reason: string) {
  return apiRequest<{ message: string; data: { reported: boolean } }>("/exchanges/report", {
    method: "POST",
    body: JSON.stringify({ exchangeId, reason }),
    credentials: "include"
  });
}

export function listExchangeEntries(exchangeId: string, page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiRequest<{ message: string; data: { entries: ExchangeEntry[] } }>(
    `/exchanges/${exchangeId}/entries?${params.toString()}`,
    { method: "GET", credentials: "include" }
  );
}

export function shareExchangeEntry(payload: {
  exchangeId: string;
  entryType: "role" | "interview" | "sensitive";
  content: string;
  metadata?: Record<string, unknown>;
}) {
  return apiRequest<{ message: string; data: { entry: ExchangeEntry } }>("/exchanges/entries", {
    method: "POST",
    body: JSON.stringify(payload),
    credentials: "include"
  });
}

export function getExchangeProfile() {
  return apiRequest<{ message: string; data: { profile: ExchangeProfile } }>("/exchanges/profile", {
    method: "GET",
    credentials: "include"
  });
}

export function saveExchangeProfile(payload: {
  lastJobExperience?: string;
  lastInterviewExperience?: string;
  roleTransitionNotes?: string;
  roleTemplate?: ExchangeProfile["roleTemplate"];
  interviewTemplate?: ExchangeProfile["interviewTemplate"];
}) {
  return apiRequest<{ message: string; data: { profile: ExchangeProfile } }>("/exchanges/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
    credentials: "include"
  });
}

export function shareSensitiveInfo(exchangeId: string, template: SensitiveTemplate) {
  return apiRequest<{ message: string; data: { shared: boolean; waiting: boolean; message: string } }>(
    `/exchanges/${exchangeId}/share-sensitive`,
    {
      method: "POST",
      body: JSON.stringify({ template }),
      credentials: "include"
    }
  );
}
