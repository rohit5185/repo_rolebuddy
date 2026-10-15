"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Users, CheckCircle2, X, AlertCircle } from "lucide-react";

import { getProfile } from "@/features/auth/auth.api";
import { createConversation } from "@/features/chat";
import {
  getPendingRequests,
  acceptConnectionRequest,
  rejectConnectionRequest
} from "./connection.api";
import type { ConnectionRequest } from "./types";

type MatchUser = {
  role: string | null;
  specialization: string | null;
  domainArea: string | null;
  experience: string | null;
};

function normalizeValue(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function calculateMatchScore(currentUser: MatchUser, otherUser: MatchUser) {
  if (
    normalizeValue(currentUser.role) === normalizeValue(otherUser.role) &&
    normalizeValue(currentUser.experience) === normalizeValue(otherUser.experience)
  ) return 100;
  if (normalizeValue(currentUser.role) === normalizeValue(otherUser.role)) return 90;
  if (
    normalizeValue(currentUser.specialization) === normalizeValue(otherUser.specialization) &&
    normalizeValue(currentUser.experience) === normalizeValue(otherUser.experience)
  ) return 80;
  if (normalizeValue(currentUser.specialization) === normalizeValue(otherUser.specialization)) return 70;
  if (
    normalizeValue(currentUser.domainArea) === normalizeValue(otherUser.domainArea) &&
    normalizeValue(currentUser.experience) === normalizeValue(otherUser.experience)
  ) return 60;
  if (normalizeValue(currentUser.domainArea) === normalizeValue(otherUser.domainArea)) return 50;
  return 40;
}

function getRequesterId(request: ConnectionRequest) {
  return request.from.userId || request.from._id || "";
}

function dedupeRequests(requests: ConnectionRequest[]) {
  const map = new Map<string, ConnectionRequest>();
  for (const request of requests) {
    const requesterId = getRequesterId(request);
    if (!requesterId || map.has(requesterId)) continue;
    map.set(requesterId, request);
  }
  return Array.from(map.values());
}

function getScoreColor(score: number) {
  if (score >= 90) return "text-rb-primary bg-rb-primary-light border-[rgba(59,42,225,0.15)]";
  if (score >= 70) return "text-[#1f6d42] bg-[#e6f5ec] border-[rgba(31,109,66,0.18)]";
  return "text-rb-muted bg-rb-sub border-rb-border";
}

export function ConnectionRequests() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<MatchUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? false;
    try {
      if (showLoading) setLoading(true);
      const [requestsResponse, profileResponse] = await Promise.all([getPendingRequests(), getProfile()]);
      setRequests(dedupeRequests(requestsResponse.data));
      setCurrentUser({
        role: profileResponse.data.user.role,
        specialization: profileResponse.data.user.specialization,
        domainArea: profileResponse.data.user.domainArea,
        experience: profileResponse.data.user.experience
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests({ showLoading: true });
    const intervalId = window.setInterval(() => void fetchRequests(), 5000);
    const handleWindowFocus = () => void fetchRequests();
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [fetchRequests]);

  const removeFromUI = (userId: string) => {
    setRequests((prev) => prev.filter((request) => getRequesterId(request) !== userId));
  };

  const handleAccept = async (userId: string) => {
    try {
      setProcessingId(userId);
      await acceptConnectionRequest(userId);
      removeFromUI(userId);
      await createConversation({ partnerId: userId });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      setProcessingId(userId);
      await rejectConnectionRequest(userId);
      removeFromUI(userId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="rb-card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-rb-primary" />
          <h2 className="text-base font-bold text-rb-text">Incoming Requests</h2>
        </div>
        {requests.length > 0 && (
          <span className="rb-pill bg-rb-primary text-white">
            {requests.length} new
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-3 py-2.5 text-xs text-rb-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-rb-muted py-2">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading requests…
        </div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-rb-muted">No incoming requests right now.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const requesterId = getRequesterId(request);
            const isProcessing = processingId === requesterId;
            const matchScore = currentUser
              ? calculateMatchScore(currentUser, {
                  role: request.from.role,
                  specialization: request.from.specialization,
                  domainArea: request.from.domainArea,
                  experience: request.from.experience
                })
              : 40;
            const scoreColorClass = getScoreColor(matchScore);

            return (
              <div
                key={request._id}
                className="flex flex-col gap-3 rounded-xl border border-rb-border bg-rb-surface p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-rb-primary/10 flex items-center justify-center text-rb-primary font-bold text-xs">
                    {(request.from.displayName || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-rb-text truncate">{request.from.displayName || "Anonymous User"}</p>
                    <p className="text-xs text-rb-muted truncate">{request.from.role || "Role not set"}</p>
                  </div>
                  <span className={`rb-pill border shrink-0 ${scoreColorClass}`}>{matchScore}%</span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => void handleAccept(requesterId)}
                    disabled={!requesterId || isProcessing}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl bg-rb-primary px-3 py-2 text-xs font-bold text-white hover:bg-rb-primary-dark transition-colors disabled:opacity-60"
                  >
                    {isProcessing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReject(requesterId)}
                    disabled={!requesterId || isProcessing}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border border-rb-border px-3 py-2 text-xs font-bold text-rb-muted hover:bg-rb-surface transition-colors disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
