"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Flame,
  LoaderCircle,
  MessageSquareText,
  RefreshCcw,
  Search,
  Users,
  CheckCircle2,
  Circle,
  AlertCircle,
  Compass,
  Clock,
  Target
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { findMatch } from "@/features/matching";
import { ConnectionRequests } from "@/features/connection";
import { AppLayout } from "@/components/AppLayout";

import { getDashboard } from "./dashboard.api";
import type { DashboardResponse, DashboardTodayStatus } from "./types";
import { logout } from "@/features/profile";
import { ProfessionalProgressCard, ProfessionalProgressCardSkeleton } from "./ProfessionalProgressCard";

type DashboardData = DashboardResponse["data"];

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_META: Record<DashboardTodayStatus, {
  label: string;
  hint: string;
  icon: typeof CheckCircle2;
  cardClass: string;
  badgeClass: string;
  iconBg: string;
}> = {
  done: {
    label: "Done",
    hint: "You checked in today. Streak protected.",
    icon: CheckCircle2,
    cardClass: "border-emerald-200/60 bg-emerald-50/70",
    badgeClass: "bg-emerald-600 text-white",
    iconBg: "bg-emerald-600"
  },
  not_done: {
    label: "Not done",
    hint: "You checked in but did not meet today's goal.",
    icon: AlertCircle,
    cardClass: "border-red-200/60 bg-red-50/70",
    badgeClass: "bg-red-600 text-white",
    iconBg: "bg-red-500"
  },
  pending: {
    label: "Pending",
    hint: "No check-in recorded yet today.",
    icon: Circle,
    cardClass: "border-white/60",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
    iconBg: "bg-white/70 border border-sky-200"
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatDailyGoal(goal: number | null) {
  if (!goal) return "Not set";
  return goal === 3 ? "3+ hrs" : `${goal} hr${goal > 1 ? "s" : ""}`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-5">
      <div className="grid gap-4">
        <Skeleton className="h-44 w-full rounded-2xl bg-white/40" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-2xl bg-white/40" />
          <Skeleton className="h-28 w-full rounded-2xl bg-white/40" />
          <Skeleton className="h-28 w-full rounded-2xl bg-white/40" />
        </div>
        <ProfessionalProgressCardSkeleton />
      </div>
      <div className="grid gap-4">
        <Skeleton className="h-56 w-full rounded-2xl bg-white/40" />
        <Skeleton className="h-40 w-full rounded-2xl bg-white/40" />
      </div>
    </div>
  );
}

// ── Glass card wrapper ────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        rounded-2xl border border-white/70 
        bg-white/60 backdrop-blur-xl
        shadow-[0_2px_20px_rgba(14,54,100,0.07)]
        p-5
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ── Stat cell ─────────────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string | number;
  large?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/50 border border-white/70 px-3.5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/60 mb-1.5">
        {label}
      </p>
      <p
        className={`font-black text-sky-950 leading-none ${
          large ? "text-4xl" : "text-sm font-semibold"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ── Meta cell (Role / Experience / Goal) ──────────────────────────────────────

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/50 border border-white/70 px-3.5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/60 mb-1.5">
        {label}
      </p>
      <p className="text-sm font-bold text-sky-950 capitalize leading-snug">{value}</p>
    </div>
  );
}

// ── Quick action button ────────────────────────────────────────────────────────

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  spinning = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  spinning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        flex items-center gap-3 w-full rounded-xl
        border border-white/70 bg-white/40
        px-4 py-3 text-sm font-semibold text-sky-900
        hover:bg-white/65 hover:border-white/90
        transition-all text-left
        disabled:opacity-50
      "
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100/80 text-sky-700 flex-shrink-0">
        {spinning ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </span>
      {label}
    </button>
  );
}

// ── Main DashboardPage ────────────────────────────────────────────────────────

export function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── All logic below is IDENTICAL to the original ──────────────────────────

  async function loadDashboard(showSpinner = false) {
    if (showSpinner) setIsLoading(true);
    try {
      const response = await getDashboard();
      if (response.data.user.onboardingCompleted === false) {
        router.replace("/onboarding");
        return;
      }
      setDashboard(response.data);
      setError(null);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Unable to load dashboard.";
      if (/unauthorized|401/i.test(message)) {
        router.replace("/login");
        return;
      }
      setError(message);
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFindMatch() {
    setIsFindingMatch(true);
    setError(null);
    try {
      await findMatch();
      await loadDashboard(false);
    } catch (matchError) {
      const message =
        matchError instanceof Error
          ? matchError.message
          : "Unable to find a match right now.";
      setError(message);
    } finally {
      setIsFindingMatch(false);
    }
  }

  const todayStatus = dashboard?.todayStatus ?? "pending";
  const todayMeta = STATUS_META[todayStatus];
  const StatusIcon = todayMeta.icon;
  const isMatched =
    dashboard?.matching.status === "matched" && Boolean(dashboard.partner);
  const streakCount = dashboard?.user.streakCount ?? null;
  const userRole = dashboard?.user.role ?? null;

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <AppLayout streakCount={streakCount} userRole={userRole}>
        <div className="rb-page-container">
          <div className="mb-6">
            <div className="h-5 w-36 rounded-full bg-white/50 mb-3 animate-pulse" />
            <div className="h-8 w-72 rounded-xl bg-white/50 mb-2 animate-pulse" />
            <div className="h-4 w-96 rounded-lg bg-white/40 animate-pulse" />
          </div>
          <DashboardSkeleton />
        </div>
      </AppLayout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout streakCount={streakCount} userRole={userRole}>
      <div className="rb-page-container">

        {/* ── Page title ── */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 border border-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-700 backdrop-blur-sm">
              Daily control panel
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">
            {dashboard?.user.role
              ? `Preparing for ${dashboard.user.role}`
              : "Your Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-sky-800/60 max-w-xl">
            Track your consistency, see your partner status, and jump to the next action.
          </p>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200/60 bg-red-50/80 backdrop-blur-sm px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              className="font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {dashboard && (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-5">

            {/* ════════════ LEFT COLUMN ════════════ */}
            <div className="grid gap-4 content-start order-last lg:order-first">

              {/* Today's check-in card */}
              <GlassCard className={`border ${todayMeta.cardClass}`}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${todayMeta.iconBg}`}
                    >
                      <StatusIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/60">
                        Today's check-in
                      </p>
                      <p className="text-xl font-black text-sky-950 mt-0.5">
                        {todayMeta.label}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${todayMeta.badgeClass}`}>
                    {todayMeta.label}
                  </span>
                </div>

                <p className="text-sm text-sky-800/60 mb-4">{todayMeta.hint}</p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCell
                    label="Current streak"
                    value={dashboard.user.streakCount}
                    large
                  />
                  <StatCell
                    label="Last check-in"
                    value={formatDateTime(dashboard.user.lastCheckInDate)}
                  />
                  <StatCell
                    label="Last active"
                    value={formatDateTime(dashboard.user.lastActiveAt)}
                  />
                </div>
              </GlassCard>

              {/* Role / Experience / Goal row */}
              <div className="grid gap-3 sm:grid-cols-3">
                <MetaCell label="Role" value={dashboard.user.role ?? "Not set"} />
                <MetaCell
                  label="Experience"
                  value={dashboard.user.experience ?? "Not set"}
                />
                <MetaCell
                  label="Daily goal"
                  value={formatDailyGoal(dashboard.user.dailyGoal)}
                />
              </div>

              {/* Professional Progress Card — unchanged component, just wrapped */}
              <ProfessionalProgressCard
                consistencyStreak={dashboard.user.consistencyStreak ?? 0}
                contributionCount={dashboard.user.contributionCount ?? 0}
                reliabilityLabel={dashboard.user.reliability?.label ?? null}
                preparationStatus={dashboard.user.preparationStatus ?? null}
              />
            </div>

            {/* ════════════ RIGHT COLUMN ════════════ */}
            <div className="grid gap-4 content-start order-first lg:order-last">

              {/* Partner card */}
              <GlassCard>
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/60">
                    Partner status
                  </p>
                  <h2 className="text-lg font-black text-sky-950 mt-1">
                    {isMatched ? "Matched partner" : "No partner yet"}
                  </h2>
                </div>

                {isMatched && dashboard.partner ? (
                  <>
                    <div className="grid gap-3 rounded-xl border border-white/70 bg-white/40 p-4 mb-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/60 mb-1">
                            Partner role
                          </p>
                          <p className="text-sm font-semibold text-sky-950 capitalize">
                            {dashboard.partner.partnerRole ?? "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/60 mb-1">
                            Partner experience
                          </p>
                          <p className="text-sm font-semibold text-sky-950 capitalize">
                            {dashboard.partner.partnerExperience ?? "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/60 mb-1">
                            Partner streak
                          </p>
                          <p className="text-2xl font-black text-sky-950 flex items-center gap-1.5">
                            <Flame className="h-4 w-4 text-orange-500" />
                            {dashboard.partner.partnerStreak}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/60 mb-1">
                            Last check-in
                          </p>
                          <p className="text-xs font-semibold text-sky-950">
                            {formatDateTime(dashboard.partner.partnerLastCheckIn)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/60 mb-1">
                          Partner last active
                        </p>
                        <p className="text-xs font-semibold text-sky-950">
                          {formatDateTime(dashboard.partner.partnerLastActive)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/chat")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-700 py-3 text-sm font-bold text-white hover:bg-sky-800 transition-colors shadow-[0_4px_20px_rgba(14,86,168,0.30)]"
                    >
                      <MessageSquareText className="h-4 w-4" />
                      Open chat
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-sky-800/60 mb-4">
                      You are in the matching pool. Trigger a search to find a partner
                      preparing for the same role.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleFindMatch()}
                      disabled={isFindingMatch}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-700 py-3 text-sm font-bold text-white hover:bg-sky-800 transition-colors disabled:opacity-60 shadow-[0_4px_20px_rgba(14,86,168,0.30)]"
                    >
                      {isFindingMatch ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      {isFindingMatch ? "Finding match…" : "Find Match"}
                    </button>
                  </>
                )}
              </GlassCard>

              {/* Quick actions */}
              <GlassCard>
                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/60 mb-4">
                  Quick actions
                </p>
                <div className="grid gap-2">
                  <ActionBtn
                    icon={MessageSquareText}
                    label="Go to Chat"
                    onClick={() => router.push("/chat")}
                  />
                  <ActionBtn
                    icon={Compass}
                    label="Discover Partners"
                    onClick={() => router.push("/discovery")}
                  />
                  <ActionBtn
                    icon={Users}
                    label="Find Match"
                    onClick={() => void handleFindMatch()}
                    disabled={isFindingMatch}
                    spinning={isFindingMatch}
                  />
                  <ActionBtn
                    icon={RefreshCcw}
                    label="Refresh dashboard"
                    onClick={() => void loadDashboard(true)}
                  />
                </div>
              </GlassCard>

              {/* Connection requests — unchanged */}
              <ConnectionRequests />
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}
