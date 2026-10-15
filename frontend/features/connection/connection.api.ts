import { apiRequest } from "@/services/api";
import type {
  SuggestionsResponse,
  ProfileResponse,
  ConnectionRequestsResponse,
  ConnectionsResponse,
  SearchResponse
} from "./types";

export function generateDisplayName() {
  return apiRequest<{ message: string; data: { displayName: string } }>("/connection/display-name", {
    method: "POST",
    credentials: "include"
  });
}

export function getSuggestions(limit: number = 10) {
  return apiRequest<SuggestionsResponse>(`/connection/suggestions?limit=${limit}`, {
    method: "GET",
    credentials: "include"
  });
}

export function searchProfiles(query: string, limit: number = 20) {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("limit", limit.toString());

  return apiRequest<SearchResponse>(`/connection/search?${params.toString()}`, {
    method: "GET",
    credentials: "include"
  });
}

export function getProfile(userId: string) {
  return apiRequest<ProfileResponse>(`/connection/profile/${userId}`, {
    method: "GET",
    credentials: "include"
  });
}

export function sendConnectionRequest(toUserId: string) {
  return apiRequest<{ message: string; data: { request: { from: string; to: string; status: string } } }>(
    "/connection/request",
    {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ toUserId })
    }
  );
}

export function acceptConnectionRequest(fromUserId: string) {
  return apiRequest<{
    message: string;
    data: { connection: { userId: string; displayName: string; role: string | null } };
  }>("/connection/request/accept", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ fromUserId })
  });
}

export function rejectConnectionRequest(fromUserId: string) {
  return apiRequest<{ message: string; data: null }>("/connection/request/reject", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ fromUserId })
  });
}

export function getPendingRequests() {
  return apiRequest<ConnectionRequestsResponse>("/connection/requests", {
    method: "GET",
    credentials: "include"
  });
}

export function getConnections() {
  return apiRequest<ConnectionsResponse>("/connection/list", {
    method: "GET",
    credentials: "include"
  });
}
