"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProfileSuggestion, UserProfile } from "./types";

interface ProfileCardProps {
  profile: ProfileSuggestion | UserProfile;
  showMatchScore?: boolean;
  onConnect?: (userId: string) => void;
  onProfile?: (userId: string) => void;
  isConnected?: boolean;
  hasRequestPending?: boolean;
  loading?: boolean;
}

export function ProfileCard({
  profile,
  showMatchScore = true,
  onConnect,
  onProfile,
  isConnected = false,
  hasRequestPending = false,
  loading = false
}: ProfileCardProps) {
  const profileId = profile.userId || profile._id || "";
  const displayName = profile.displayName || "Anonymous User";
  const role = profile.role || "Role not specified";
  const matchScore = (profile as ProfileSuggestion).matchScore;

  return (
    <Card
      className="p-4 flex flex-col gap-2"
      onClick={() => {
        if (profileId) {
          onProfile?.(profileId);
        }
      }}
    >
      <h2 className="text-lg font-semibold">{displayName}</h2>
      <p className="text-sm text-muted-foreground">{role}</p>

      {showMatchScore && typeof matchScore === "number" && (
        <p className="text-sm font-medium">Match: {matchScore}%</p>
      )}

      {onConnect && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (profileId) {
              onConnect(profileId);
            }
          }}
          disabled={!profileId || isConnected || hasRequestPending || loading}
          className="w-full"
        >
          {loading
            ? "Sending..."
            : isConnected
              ? "Connected"
              : hasRequestPending
                ? "Pending"
                : "Connect"}
        </Button>
      )}
    </Card>
  );
}
