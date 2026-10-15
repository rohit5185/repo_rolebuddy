"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Zap,
  CheckCircle2,
  Target,
  BookOpen,
  Hammer,
  Send,
  Mic,
  Trophy,
  Activity,
  ChevronRight,
} from "lucide-react";

import type { RoleData } from "./role-data";
import { getRoleBySlug } from "./role-data";
import { EcosystemAnalyticsPanel } from "./EcosystemAnalyticsPanel";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Journey step icons ────────────────────────────────────────────────────────

const JOURNEY_ICONS = [BookOpen, Hammer, Send, Mic, Trophy];

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function RolePageSkeleton() {
  return (
    <div className="page-container flex flex-col gap-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-3xl bg-rb-surface border border-rb-border overflow-hidden">
        <div className="h-2 bg-rb-sub w-full" />
        <div className="p-6 sm:p-8 flex flex-col gap-5">
          <div className="h-4 w-24 rb-skeleton rounded-lg" />
          <div className="h-9 w-3/4 rb-skeleton rounded-xl" />
          <div className="h-4 w-full rb-skeleton rounded-lg" />
          <div className="h-4 w-2/3 rb-skeleton rounded-lg" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rb-skeleton rounded-2xl" />
            ))}
          </div>
          <div className="h-12 rb-skeleton rounded-xl" />
        </div>
      </div>
      {/* Section skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rb-card flex flex-col gap-4">
          <div className="h-5 w-40 rb-skeleton rounded-lg" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div key={j} className="h-8 rb-skeleton rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Not Found ─────────────────────────────────────────────────────────────────

function RoleNotFound({ slug, onBack }: { slug: string; onBack: () => void }) {
  return (
    <div className="page-container flex items-center justify-center py-24">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-3xl bg-rb-surface border border-rb-border flex items-center justify-center mx-auto mb-5">
          <Target className="h-7 w-7 text-rb-muted" />
        </div>
        <h1 className="text-xl font-black text-rb-text mb-2">Role not found</h1>
        <p className="text-sm text-rb-muted mb-6">
          No ecosystem page exists for <code className="text-rb-primary font-mono text-xs bg-rb-primary-light px-1.5 py-0.5 rounded">{slug}</code> yet.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rb-button-primary gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discovery
        </button>
      </div>
    </div>
  );
}

// ── Animated Counter ──────────────────────────────────────────────────────────

function AnimatedCount({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = 0;
    const duration = 900;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (value - start) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <span>
      {displayed >= 1000 ? `${(displayed / 1000).toFixed(1)}k` : displayed}
      {suffix}
    </span>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection({
  role,
  onFindPartner,
  onExploreDiscovery,
}: {
  role: RoleData;
  onFindPartner: () => void;
  onExploreDiscovery: () => void;
}) {
  return (
    <section className="rounded-3xl border border-rb-border bg-white overflow-hidden shadow-rb-card rb-animate-in">
      {/* Accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: role.color }} />

      <div className="p-6 sm:p-8 flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <span
            className="rb-pill text-[10px]"
            style={{
              backgroundColor: `${role.color}14`,
              color: role.color,
              border: `1px solid ${role.color}25`,
            }}
          >
            <Zap className="h-2.5 w-2.5" />
            {role.ecosystemLabel}
          </span>
          {role.growthPercent > 25 && (
            <span className="rb-pill bg-[#fff8e1] border border-[rgba(245,158,11,0.25)] text-rb-warning text-[10px]">
              <TrendingUp className="h-2.5 w-2.5" />
              +{role.growthPercent}% growth
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-rb-text sm:text-3xl lg:text-4xl leading-tight">
            {role.title}
          </h1>
          <p className="mt-3 text-sm text-rb-muted leading-relaxed max-w-2xl sm:text-base">
            {role.summary}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-rb-surface border border-rb-border p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-1.5">
              Total Preparing
            </p>
            <p className="text-2xl font-black text-rb-text">
              <AnimatedCount value={role.totalAspirants} />
            </p>
            <p className="text-[10px] text-rb-muted mt-0.5">aspirants</p>
          </div>
          <div className="rounded-2xl bg-[#e6f5ec] border border-[rgba(31,109,66,0.15)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1f6d42] mb-1.5">
              Active Today
            </p>
            <p className="text-2xl font-black text-[#1f6d42]">
              <AnimatedCount value={role.activeToday} />
            </p>
            <p className="text-[10px] text-[#1f6d42] mt-0.5">checked in</p>
          </div>
          <div
            className="col-span-2 sm:col-span-1 rounded-2xl p-4"
            style={{
              backgroundColor: `${role.color}10`,
              border: `1px solid ${role.color}22`,
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: role.color }}
            >
              Growth Rate
            </p>
            <p className="text-2xl font-black" style={{ color: role.color }}>
              +{role.growthPercent}%
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: role.color }}>
              month-over-month
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            id="role-find-partner-cta"
            type="button"
            onClick={onFindPartner}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
            style={{ backgroundColor: role.color }}
          >
            <Users className="h-4 w-4" />
            Find Preparation Partner
          </button>
          <button
            id="role-explore-discovery-cta"
            type="button"
            onClick={onExploreDiscovery}
            className="flex items-center justify-center gap-2 rounded-xl border border-rb-border bg-white px-5 py-3 text-sm font-semibold text-rb-muted transition-all duration-200 hover:bg-rb-surface hover:text-rb-text active:scale-[0.98]"
          >
            Explore Similar Roles
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Active Signals Section ────────────────────────────────────────────────────

function SignalsSection({ role }: { role: RoleData }) {
  return (
    <section className="rb-card rb-animate-in flex flex-col gap-5" aria-label="Active preparation signals">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: `${role.color}15`, color: role.color }}
        >
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-black text-rb-text">Active Preparation Signals</h2>
          <p className="text-[11px] text-rb-muted">Anonymous ecosystem activity — right now</p>
        </div>
      </div>

      {/* Signal items */}
      <div className="flex flex-col gap-2">
        {role.signals.map((signal, index) => (
          <div
            key={signal.id}
            className="flex items-center gap-3 rounded-xl border border-rb-border bg-rb-surface px-4 py-3 transition-all duration-200 hover:border-rb-border-strong"
            style={{
              animationDelay: `${index * 80}ms`,
            }}
          >
            {/* Pulse dot */}
            <div className="relative shrink-0">
              <span
                className="block h-2 w-2 rounded-full"
                style={{ backgroundColor: role.color }}
              />
              <span
                className="absolute inset-0 h-2 w-2 rounded-full animate-ping opacity-40"
                style={{ backgroundColor: role.color }}
              />
            </div>
            {/* Count + text */}
            <p className="text-sm text-rb-text">
              <span className="font-black" style={{ color: role.color }}>
                {signal.count}
              </span>{" "}
              <span className="font-medium">{signal.text}</span>
            </p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-rb-muted">
        Signals are aggregated and anonymous. No individual identities are exposed.
      </p>
    </section>
  );
}

// ── Skills Section ────────────────────────────────────────────────────────────

function SkillsSection({ role }: { role: RoleData }) {
  return (
    <section className="rb-card rb-animate-in flex flex-col gap-5" aria-label="Popular skills">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: `${role.color}15`, color: role.color }}
        >
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-black text-rb-text">Popular Skills & Technologies</h2>
          <p className="text-[11px] text-rb-muted">What people preparing for this role focus on</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {role.skills.map((skill, index) => (
          <span
            key={skill}
            className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[11px] font-bold border transition-all duration-200 hover:scale-105 cursor-default"
            style={{
              backgroundColor: index < 4 ? `${role.color}14` : "var(--rb-surface-sub)",
              borderColor: index < 4 ? `${role.color}28` : "var(--rb-border)",
              color: index < 4 ? role.color : "var(--rb-muted)",
            }}
          >
            {skill}
            {index < 4 && (
              <span
                className="ml-1.5 text-[9px] font-black opacity-60"
                style={{ color: role.color }}
              >
                ★
              </span>
            )}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-rb-muted">
        ★ Most commonly focused on by active aspirants
      </p>
    </section>
  );
}

// ── Daily Goals Section ───────────────────────────────────────────────────────

function GoalsSection({ role }: { role: RoleData }) {
  return (
    <section className="rb-card rb-animate-in flex flex-col gap-5" aria-label="Common daily goals">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: `${role.color}15`, color: role.color }}
        >
          <Target className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-black text-rb-text">Common Daily Goals</h2>
          <p className="text-[11px] text-rb-muted">What aspirants commit to every day</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {role.commonGoals.map((goal, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border border-rb-border bg-rb-surface px-4 py-3 transition-all duration-200 hover:bg-white hover:border-rb-border-strong group"
          >
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-200"
              style={{
                backgroundColor: `${role.color}18`,
                border: `1.5px solid ${role.color}30`,
              }}
            >
              <CheckCircle2
                className="h-3.5 w-3.5"
                style={{ color: role.color }}
              />
            </div>
            <span className="text-sm font-medium text-rb-text group-hover:text-rb-text">
              {goal}
            </span>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl px-4 py-3 text-sm font-medium"
        style={{
          backgroundColor: `${role.color}0a`,
          border: `1px solid ${role.color}18`,
          color: role.color,
        }}
      >
        💡 Set a daily goal when you join RoleBuddy — your partner sees it every day.
      </div>
    </section>
  );
}

// ── Journey Section ───────────────────────────────────────────────────────────

function JourneySection({ role }: { role: RoleData }) {
  return (
    <section className="rb-card rb-animate-in flex flex-col gap-6" aria-label="Preparation journey">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: `${role.color}15`, color: role.color }}
        >
          <TrendingUp className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-black text-rb-text">Preparation Journey</h2>
          <p className="text-[11px] text-rb-muted">Common stages aspirants go through</p>
        </div>
      </div>

      {/* Desktop: horizontal connector / Mobile: vertical stack */}
      <div className="hidden md:flex items-start gap-0">
        {role.journeyStages.map((stage, index) => {
          const Icon = JOURNEY_ICONS[index] ?? BookOpen;
          const isLast = index === role.journeyStages.length - 1;
          return (
            <div key={stage.step} className="flex flex-1 items-start gap-0 min-w-0">
              <div className="flex flex-col items-center min-w-0 flex-1">
                {/* Step circle */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white shadow-rb-card transition-transform duration-200 hover:scale-110"
                  style={{
                    borderColor: role.color,
                    color: role.color,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {/* Label */}
                <div className="mt-3 text-center px-1">
                  <p className="text-[11px] font-black text-rb-text leading-tight">{stage.title}</p>
                  <p className="text-[10px] text-rb-muted mt-1 leading-relaxed line-clamp-2">{stage.description}</p>
                </div>
              </div>
              {/* Connector line */}
              {!isLast && (
                <div
                  className="flex-none h-0.5 mt-5 w-full max-w-[24px] mx-0"
                  style={{ backgroundColor: `${role.color}30` }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical list */}
      <div className="flex flex-col gap-3 md:hidden">
        {role.journeyStages.map((stage, index) => {
          const Icon = JOURNEY_ICONS[index] ?? BookOpen;
          const isLast = index === role.journeyStages.length - 1;
          return (
            <div key={stage.step} className="flex gap-3">
              {/* Left: icon + vertical line */}
              <div className="flex flex-col items-center">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-white shadow-rb-card"
                  style={{ borderColor: role.color, color: role.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {!isLast && (
                  <div
                    className="flex-1 w-0.5 mt-1"
                    style={{ backgroundColor: `${role.color}25` }}
                  />
                )}
              </div>
              {/* Right: content */}
              <div className={`flex-1 ${isLast ? "" : "pb-3"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: role.color }}
                  >
                    Stage {stage.step}
                  </span>
                </div>
                <p className="text-sm font-bold text-rb-text leading-tight">{stage.title}</p>
                <p className="text-xs text-rb-muted mt-1 leading-relaxed">{stage.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {stage.focus.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={{
                        backgroundColor: `${role.color}10`,
                        color: role.color,
                        border: `1px solid ${role.color}20`,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-rb-muted">
        Journey stages are informational. Your actual path will vary based on your background and goals.
      </p>
    </section>
  );
}

// ── Preparation Insights Section ─────────────────────────────────────────────

function InsightsSection({ role }: { role: RoleData }) {
  const insights = [
    {
      label: "Daily check-in rate",
      value: `${Math.round((role.activeToday / role.totalAspirants) * 100)}%`,
      description: "of total aspirants are active today",
      color: "#1f6d42",
      bg: "#e6f5ec",
      border: "rgba(31,109,66,0.15)",
    },
    {
      label: "Interview preparation",
      value: `${Math.round(role.activeToday * 0.14)}`,
      description: "aspirants focused on interview prep today",
      color: role.color,
      bg: `${role.color}10`,
      border: `${role.color}20`,
    },
    {
      label: "Active learners",
      value: formatCount(Math.round(role.activeToday * 0.61)),
      description: "engaged in learning activities this week",
      color: "#9a6200",
      bg: "#fff8e1",
      border: "rgba(154,98,0,0.15)",
    },
  ];

  return (
    <section className="rb-card rb-animate-in flex flex-col gap-5" aria-label="Preparation insights">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: `${role.color}15`, color: role.color }}
        >
          <TrendingUp className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-black text-rb-text">Preparation Insights</h2>
          <p className="text-[11px] text-rb-muted">Anonymous ecosystem momentum indicators</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {insights.map((insight) => (
          <div
            key={insight.label}
            className="rounded-2xl p-4 flex flex-col gap-1.5"
            style={{
              backgroundColor: insight.bg,
              border: `1px solid ${insight.border}`,
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: insight.color }}
            >
              {insight.label}
            </p>
            <p className="text-2xl font-black" style={{ color: insight.color }}>
              {insight.value}
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: insight.color, opacity: 0.8 }}>
              {insight.description}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-rb-muted">
        All metrics are aggregated and anonymous. Individual preparation data is never exposed.
      </p>
    </section>
  );
}

// ── Related Roles Section ─────────────────────────────────────────────────────

function RelatedRolesSection({
  role,
  onNavigate,
}: {
  role: RoleData;
  onNavigate: (slug: string) => void;
}) {
  // Dynamic import to avoid circular dependency
  const [relatedRoles, setRelatedRoles] = useState<RoleData[]>([]);

  useEffect(() => {
    import("./role-data").then(({ getRoleBySlug }) => {
      const resolved = role.relatedSlugs
        .map((s) => getRoleBySlug(s))
        .filter((r): r is RoleData => r !== null);
      setRelatedRoles(resolved);
    });
  }, [role.relatedSlugs]);

  if (relatedRoles.length === 0) return null;

  return (
    <section className="rb-card rb-animate-in flex flex-col gap-5" aria-label="Related roles">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: `${role.color}15`, color: role.color }}
        >
          <Users className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-black text-rb-text">Related Roles</h2>
          <p className="text-[11px] text-rb-muted">Other preparation communities you might explore</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {relatedRoles.map((related) => (
          <button
            key={related.slug}
            type="button"
            onClick={() => onNavigate(related.slug)}
            className="group flex flex-col gap-3 rounded-2xl border border-rb-border bg-rb-surface p-4 text-left transition-all duration-200 hover:bg-white hover:shadow-rb-card-hover hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {/* Accent dot */}
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
                style={{ backgroundColor: related.color }}
              />
              <span
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: related.color }}
              >
                {related.ecosystemLabel}
              </span>
            </div>
            <p className="text-sm font-bold text-rb-text group-hover:text-rb-primary transition-colors leading-tight">
              {related.title}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-rb-muted">
                {formatCount(related.activeToday)} active today
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-rb-muted group-hover:text-rb-primary group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Bottom CTA Banner ─────────────────────────────────────────────────────────

function CtaBanner({
  role,
  onFindPartner,
}: {
  role: RoleData;
  onFindPartner: () => void;
}) {
  return (
    <section
      className="rb-animate-in rounded-3xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${role.color} 0%, ${role.color}cc 100%)`,
      }}
    >
      <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest mb-1">
            Ready to prepare seriously?
          </p>
          <h2 className="text-white text-xl font-black sm:text-2xl">
            Find your accountability partner
          </h2>
          <p className="text-white/75 text-sm mt-1 leading-relaxed">
            Get matched with someone preparing for {role.title} right now.
          </p>
        </div>
        <button
          id="role-bottom-find-partner-cta"
          type="button"
          onClick={onFindPartner}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold transition-all duration-200 hover:bg-white/90 active:scale-[0.98] shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
          style={{ color: role.color }}
        >
          <Users className="h-4 w-4" />
          Find Partner
        </button>
      </div>
    </section>
  );
}

// ── Main RoleDetailPage ───────────────────────────────────────────────────────

export function RoleDetailPage({ slug }: { slug: string }) {
  const router = useRouter();
  const [role, setRole] = useState<RoleData | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    // Resolve role data (sync, but wrapped in effect for clean lifecycle)
    const found = getRoleBySlug(slug);
    setRole(found); // null means 404
  }, [slug]);

  const handleFindPartner = useCallback(() => {
    router.push("/discovery");
  }, [router]);

  const handleExploreDiscovery = useCallback(() => {
    router.push("/discovery");
  }, [router]);

  const handleNavigateRole = useCallback(
    (targetSlug: string) => {
      router.push(`/roles/${targetSlug}`);
    },
    [router]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Loading
  if (role === undefined) {
    return <RolePageSkeleton />;
  }

  // Not found
  if (role === null) {
    return <RoleNotFound slug={slug} onBack={handleBack} />;
  }

  return (
    <div className="page-container flex flex-col gap-5 sm:gap-6">
      {/* Back nav */}
      <nav aria-label="Breadcrumb">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-rb-muted hover:text-rb-text transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
          Back
        </button>
      </nav>

      {/* Hero */}
      <HeroSection
        role={role}
        onFindPartner={handleFindPartner}
        onExploreDiscovery={handleExploreDiscovery}
      />

      {/* Two-column layout on large screens */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="flex flex-col gap-5 sm:gap-6">
          <InsightsSection role={role} />
          <SignalsSection role={role} />
          <JourneySection role={role} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5 sm:gap-6">
          <SkillsSection role={role} />
          <GoalsSection role={role} />
          <EcosystemAnalyticsPanel role={role} />
        </div>
      </div>

      {/* Related roles */}
      <RelatedRolesSection role={role} onNavigate={handleNavigateRole} />

      {/* Bottom CTA */}
      <CtaBanner role={role} onFindPartner={handleFindPartner} />
    </div>
  );
}

export default RoleDetailPage;
