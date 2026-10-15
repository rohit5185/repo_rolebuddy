import { apiRequest } from "@/services/api";

import type { MatchingResponse } from "./types";

export function findMatch() {
  return apiRequest<MatchingResponse>("/match/find", {
    method: "POST",
    credentials: "include"
  });
}

export function promoteConnection(targetUserId: string) {
  return apiRequest<{ message: string; data: { request: { from: string; to: string; status: string } } }>(
    "/match/promote",
    {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ targetUserId })
    }
  );
}

export function acceptPromotionRequest(fromUserId: string) {
  return apiRequest<MatchingResponse>("/match/promote/accept", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ fromUserId })
  });
}
