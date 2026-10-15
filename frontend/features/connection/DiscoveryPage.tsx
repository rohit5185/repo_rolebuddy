"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  ChevronRight,
  Users,
  Briefcase,
  Clock,
  Target,
  ShieldCheck,
  X,
  LoaderCircle,
  SlidersHorizontal,
  Zap,
  CheckCircle2
} from "lucide-react";

import {
  getSuggestions,
  searchProfiles,
  sendConnectionRequest,
  getPendingRequests,
  getConnections
} from "./connection.api";
import type { ProfileSuggestion, UserProfile, ConnectionRequest, Connection } from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

type DisplayProfile = (ProfileSuggestion | UserProfile) & {
  matchScore?: number;
  requestSent?: boolean;
};

// ── Match score logic (mirrors the backend hierarchy) ────────────────────────

type MatchUser = {
  role: string | null;
  specialization: string | null;
  domainArea: string | null;
  experience: string | null;
};

function norm(v: string | null | undefined) {
  return String(v ?? "").trim().toLowerCase();
}

function calcMatchScore(a: MatchUser, b: MatchUser): number {
  if (norm(a.role) && norm(a.role) === norm(b.role) && norm(a.experience) === norm(b.experience)) return 100;
  if (norm(a.role) && norm(a.role) === norm(b.role)) return 90;
  if (norm(a.specialization) && norm(a.specialization) === norm(b.specialization) && norm(a.experience) === norm(b.experience)) return 80;
  if (norm(a.specialization) && norm(a.specialization) === norm(b.specialization)) return 70;
  if (norm(a.domainArea) && norm(a.domainArea) === norm(b.domainArea) && norm(a.experience) === norm(b.experience)) return 60;
  if (norm(a.domainArea) && norm(a.domainArea) === norm(b.domainArea)) return 50;
  return 40;
}

function getMatchReasons(a: MatchUser, b: MatchUser): string[] {
  const r: string[] = [];
  if (norm(a.role) && norm(a.role) === norm(b.role)) r.push("Same role");
  if (norm(a.experience) && norm(a.experience) === norm(b.experience)) r.push("Same experience level");
  if (norm(a.specialization) && norm(a.specialization) === norm(b.specialization)) r.push("Same specialization");
  if (norm(a.domainArea) && norm(a.domainArea) === norm(b.domainArea)) r.push("Same domain");
  return r;
}

function getScoreColor(score: number) {
  if (score >= 90) return { text: "text-rb-primary", bg: "bg-rb-primary-light border border-[rgba(59,42,225,0.15)]" };
  if (score >= 70) return { text: "text-[#1f6d42]", bg: "bg-[#e6f5ec] border border-[rgba(31,109,66,0.18)]" };
  return { text: "text-rb-muted", bg: "bg-rb-sub border border-rb-border" };
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "RB";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatDailyGoal(goal: number | null) {
  if (!goal) return "Not set";
  return goal === 3 ? "3+ hrs/day" : `${goal} hr${goal > 1 ? "s" : ""}/day`;
}

// ── Profile Modal ─────────────────────────────────────────────────────────────

type ProfileModalProps = {
  profile: DisplayProfile;
  currentUser: MatchUser | null;
  isConnected: boolean;
  hasRequestPending: boolean;
  loading: boolean;
  onClose: () => void;
  onConnect: (userId: string) => void;
};

function ProfileModal({ profile, currentUser, isConnected, hasRequestPending, loading, onClose, onConnect }: ProfileModalProps) {
  const profileId = (profile as ProfileSuggestion).userId || (profile as ProfileSuggestion)._id || "";
  const displayName = profile.displayName || "Anonymous User";
  const role = profile.role || "Role not specified";

  const score = currentUser
    ? calcMatchScore(currentUser, { role: profile.role, specialization: profile.specialization, domainArea: profile.domainArea, experience: profile.experience })
    : profile.matchScore ?? 40;
  const reasons = currentUser
    ? getMatchReasons(currentUser, { role: profile.role, specialization: profile.specialization, domainArea: profile.domainArea, experience: profile.experience })
    : [];
  const colors = getScoreColor(score);

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1b1b24]/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.15)] overflow-hidden rb-scale-in">
        {/* Header strip */}
        <div className="h-24 bg-gradient-to-br from-[#3b2ae1] to-[#554bf9] relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 -mt-10 relative">
          {/* Avatar + Name */}
          <div className="flex items-end justify-between gap-4 mb-5">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl bg-white ring-4 ring-white shadow-lg flex items-center justify-center text-[#3b2ae1] font-black text-xl shrink-0">
                {getInitials(displayName)}
              </div>
              <div className="pb-1">
                <h2 className="text-[17px] font-black text-rb-text leading-tight">{displayName}</h2>
                <p className="text-sm font-semibold text-rb-primary flex items-center gap-1 mt-0.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  {role}
                </p>
              </div>
            </div>
            {/* Score */}
            <div className={`rounded-xl px-3 py-2 flex flex-col items-center shrink-0 ${colors.bg}`}>
              <span className={`text-2xl font-black ${colors.text}`}>{score}%</span>
              <span className="text-[10px] font-bold text-rb-muted uppercase tracking-widest">Match</span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rb-stat-cell">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-1">Experience</p>
              <p className="text-sm font-semibold text-rb-text capitalize">{profile.experience ?? "Not set"}</p>
            </div>
            <div className="rb-stat-cell">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-1">Daily Goal</p>
              <p className="text-sm font-semibold text-rb-text">{formatDailyGoal(profile.dailyGoal)}</p>
            </div>
            {profile.specialization && (
              <div className="rb-stat-cell">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-1">Specialization</p>
                <p className="text-sm font-semibold text-rb-text capitalize">{profile.specialization}</p>
              </div>
            )}
            {profile.availability && (
              <div className="rb-stat-cell">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-1">Availability</p>
                <p className="text-sm font-semibold text-rb-text capitalize">{profile.availability}</p>
              </div>
            )}
          </div>

          {/* Match reasons */}
          {reasons.length > 0 && (
            <div className="mb-5 rounded-xl border border-rb-border bg-rb-surface p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted mb-3">Why you match</p>
              <ul className="space-y-2">
                {reasons.map((r) => (
                  <li key={r} className="flex items-center gap-2 text-sm font-medium text-rb-text">
                    <ShieldCheck className="h-3.5 w-3.5 text-rb-primary shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Connect button */}
          <button
            type="button"
            onClick={() => { if (profileId && !isConnected && !hasRequestPending && !loading) onConnect(profileId); }}
            disabled={!profileId || isConnected || hasRequestPending || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rb-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-rb-primary-dark active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(59,42,225,0.25)]"
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : isConnected ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading ? "Sending…" : isConnected ? "Connected" : hasRequestPending ? "Request Sent" : "Send Connection Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile Card ─────────────────────────────────────────────────────────────

type ProfileCardProps = {
  profile: DisplayProfile;
  currentUser: MatchUser | null;
  isConnected: boolean;
  hasRequestPending: boolean;
  loading: boolean;
  onConnect: (userId: string) => void;
  onViewProfile: (profile: DisplayProfile) => void;
};

function ProfileCard({ profile, currentUser, isConnected, hasRequestPending, loading, onConnect, onViewProfile }: ProfileCardProps) {
  const profileId = (profile as ProfileSuggestion).userId || (profile as ProfileSuggestion)._id || "";
  const displayName = profile.displayName || "Anonymous User";
  const role = profile.role || "Role not specified";

  const score = currentUser
    ? calcMatchScore(currentUser, { role: profile.role, specialization: profile.specialization, domainArea: profile.domainArea, experience: profile.experience })
    : profile.matchScore ?? 40;
  const reasons = currentUser
    ? getMatchReasons(currentUser, { role: profile.role, specialization: profile.specialization, domainArea: profile.domainArea, experience: profile.experience })
    : [];
  const colors = getScoreColor(score);

  return (
    <div
      className="group relative bg-white border border-rb-border rounded-2xl p-5 transition-all hover:shadow-rb-card-hover hover:-translate-y-0.5 cursor-pointer flex flex-col"
      onClick={() => onViewProfile(profile)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onViewProfile(profile); }}
    >
      {/* Top: Avatar + Name + Score */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-rb-primary/10 flex items-center justify-center text-rb-primary font-black text-sm shrink-0 group-hover:bg-rb-primary group-hover:text-white transition-colors">
            {getInitials(displayName)}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-rb-text truncate leading-tight">{displayName}</p>
            <p className="text-xs font-medium text-rb-muted flex items-center gap-1 mt-0.5 truncate">
              <Briefcase className="h-3 w-3 shrink-0" />
              {role}
            </p>
          </div>
        </div>
        {/* Score badge */}
        <div className={`shrink-0 rounded-lg px-2.5 py-1 ${colors.bg}`}>
          <span className={`text-xs font-black ${colors.text}`}>{score}%</span>
        </div>
      </div>

      {/* Info row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {profile.experience && (
          <span className="rb-pill bg-rb-surface border border-rb-border text-rb-muted">
            {profile.experience}
          </span>
        )}
        {profile.availability && (
          <span className="rb-pill bg-rb-surface border border-rb-border text-rb-muted">
            <Clock className="h-2.5 w-2.5" />
            {profile.availability}
          </span>
        )}
        {profile.dailyGoal && (
          <span className="rb-pill bg-rb-surface border border-rb-border text-rb-muted">
            <Target className="h-2.5 w-2.5" />
            {profile.dailyGoal === 3 ? "3+" : profile.dailyGoal}h/day
          </span>
        )}
      </div>

      {/* Match reasons */}
      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {reasons.map((r) => (
            <span key={r} className="rb-pill bg-rb-primary-light text-rb-primary border border-[rgba(59,42,225,0.12)]">
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="mt-auto pt-4 border-t border-rb-border flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (profileId && !isConnected && !hasRequestPending && !loading) onConnect(profileId);
          }}
          disabled={!profileId || isConnected || hasRequestPending || loading}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rb-text py-2.5 text-xs font-bold text-white transition-all hover:bg-rb-primary active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : isConnected ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          {loading ? "…" : isConnected ? "Connected" : hasRequestPending ? "Pending" : "Connect"}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onViewProfile(profile); }}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-rb-border text-rb-muted hover:bg-rb-surface hover:border-rb-border-strong transition-all"
          aria-label="View profile details"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Page skeleton ─────────────────────────────────────────────────────────────

function DiscoverySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 rb-skeleton" />
      ))}
    </div>
  );
}

// ── Main DiscoveryPage ────────────────────────────────────────────────────────

export function DiscoveryPage() {
  const [currentUser, setCurrentUser] = useState<MatchUser | null>(null);
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<DisplayProfile | null>(null);

  const getProfileId = (profile: DisplayProfile) =>
    (profile as ProfileSuggestion).userId || (profile as ProfileSuggestion)._id || "";

  const normalizeSuggestion = (p: ProfileSuggestion): ProfileSuggestion => ({
    ...p,
    userId: p.userId || p._id,
    displayName: p.displayName || "Anonymous User"
  });

  const normalizeSearchProfile = (p: UserProfile): UserProfile => ({
    ...p,
    userId: p.userId || p._id,
    displayName: p.displayName || "Anonymous User"
  });

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [suggestionsData, connectionsData, requestsData, profileData] = await Promise.all([
          getSuggestions(20),
          getConnections(),
          getPendingRequests(),
          import("@/features/auth/auth.api").then((m) => m.getProfile()).catch(() => null)
        ]);

        setSuggestions(suggestionsData.data.map(normalizeSuggestion));
        setConnections(connectionsData.data);
        setPendingRequests(requestsData.data);

        if (profileData?.data?.user) {
          const u = profileData.data.user;
          setCurrentUser({
            role: u.role ?? null,
            specialization: u.specialization ?? null,
            domainArea: u.domainArea ?? u.primaryArea ?? null,
            experience: u.experience ?? null
          });
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchMode(false);
      return;
    }
    try {
      setIsSearching(true);
      setIsSearchMode(true);
      const results = await searchProfiles(searchQuery, 30);
      setSearchResults(results.data.map(normalizeSearchProfile));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchMode(false);
  };

  const updateSentState = (userId: string) => {
    setSuggestions((prev) => prev.map((p) => getProfileId(p) === userId ? { ...p, requestSent: true } : p));
    setSearchResults((prev) => prev.map((p) => getProfileId(p) === userId ? { ...p, requestSent: true } : p));
  };

  const handleConnect = async (userId: string) => {
    if (!userId) return;
    try {
      setSendingRequestId(userId);
      await sendConnectionRequest(userId);
      updateSentState(userId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setSendingRequestId(null);
    }
  };

  const isConnected = (userId: string) =>
    connections.some((conn) => (conn.userId.userId || conn.userId._id) === userId);

  const hasRequestPending = (userId: string) =>
    pendingRequests.some((req) => (req.from.userId || req.from._id) === userId);

  const displayProfiles: DisplayProfile[] = isSearchMode ? searchResults : suggestions;

  const resultCount = displayProfiles.length;

  return (
    <>
      {/* Profile modal */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          currentUser={currentUser}
          isConnected={isConnected(getProfileId(selectedProfile))}
          hasRequestPending={Boolean((selectedProfile as ProfileSuggestion).requestSent) || hasRequestPending(getProfileId(selectedProfile))}
          loading={sendingRequestId === getProfileId(selectedProfile)}
          onClose={() => setSelectedProfile(null)}
          onConnect={handleConnect}
        />
      )}

      <div className="page-container">
        {/* Page header */}
        <div className="mb-6">
          <div className="rb-pill bg-rb-primary-light text-rb-primary mb-3">
            <Zap className="h-2.5 w-2.5" />
            Discovery
          </div>
          <h1 className="text-2xl font-black tracking-tight text-rb-text sm:text-3xl">
            Find accountability partners
          </h1>
          <p className="mt-1 text-sm text-rb-muted max-w-xl">
            Connect with professionals preparing for the same role. Ranked by compatibility with your profile.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-rb-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role, specialization, or domain…"
                maxLength={60}
                className="w-full rounded-xl border border-rb-border bg-white pl-10 pr-4 py-2.5 text-sm text-rb-text placeholder:text-rb-muted shadow-[0_1px_4px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-rb-primary/20 focus:border-rb-primary transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center gap-1.5 rounded-xl bg-rb-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-rb-primary-dark transition-colors disabled:opacity-60 shrink-0"
            >
              {isSearching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
            {isSearchMode && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="flex items-center gap-1.5 rounded-xl border border-rb-border bg-white px-4 py-2.5 text-sm font-medium text-rb-muted hover:bg-rb-surface transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Error banner */}
        {error && (
          <div className="mb-5 rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-4 py-3 text-sm text-rb-danger">
            {error}
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-rb-muted" />
            <h2 className="text-sm font-semibold text-rb-text">
              {isSearchMode
                ? `Search results · ${resultCount}`
                : `Suggested partners · ${resultCount}`}
            </h2>
          </div>
          {!isSearchMode && resultCount > 0 && (
            <span className="text-xs text-rb-muted">Ranked by compatibility</span>
          )}
        </div>

        {/* Loading state */}
        {loading && !isSearchMode && <DiscoverySkeleton />}

        {/* Searching state */}
        {isSearching && (
          <div className="flex items-center gap-2 text-sm text-rb-muted py-8 justify-center">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Searching profiles…
          </div>
        )}

        {/* Empty states */}
        {!loading && !isSearching && displayProfiles.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-rb-border rounded-2xl">
            <div className="h-14 w-14 rounded-2xl bg-rb-surface flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-rb-muted" />
            </div>
            <h3 className="text-base font-bold text-rb-text mb-1">
              {isSearchMode ? "No profiles found" : "No suggestions available"}
            </h3>
            <p className="text-sm text-rb-muted max-w-xs mx-auto">
              {isSearchMode
                ? "Try a different search term."
                : "No profiles available right now. Try searching for a specific role."}
            </p>
            {isSearchMode && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-5 rounded-xl border border-rb-border px-4 py-2 text-sm font-medium text-rb-muted hover:bg-rb-surface transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !isSearching && displayProfiles.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayProfiles.map((profile, index) => {
              const profileId = getProfileId(profile);
              return (
                <ProfileCard
                  key={profileId || `profile-${index}`}
                  profile={{ ...profile, displayName: profile.displayName || "Anonymous User" }}
                  currentUser={currentUser}
                  isConnected={isConnected(profileId)}
                  hasRequestPending={Boolean((profile as ProfileSuggestion).requestSent) || hasRequestPending(profileId)}
                  loading={sendingRequestId === profileId}
                  onConnect={handleConnect}
                  onViewProfile={setSelectedProfile}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default DiscoveryPage;
