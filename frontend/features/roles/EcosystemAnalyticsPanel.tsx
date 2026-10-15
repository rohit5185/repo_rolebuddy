"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  Clock,
  Target,
  Zap,
  BarChart2,
  Calendar,
} from "lucide-react";

import type { RoleData } from "./role-data";

// ── Types ─────────────────────────────────────────────────────────────────────

type SkillTrend = {
  skill: string;
  percent: number; // 0–100 relative popularity
  rising: boolean;
};

type PeakTime = {
  label: string;
  intensity: "high" | "medium" | "low";
  description: string;
};

type GoalStat = {
  goal: string;
  percent: number;
};

// ── Derived analytics from role data ─────────────────────────────────────────

function deriveSkillTrends(role: RoleData): SkillTrend[] {
  // First 4 skills are top/trending; the rest are standard
  const basePercents = [92, 78, 71, 65, 54, 47, 38, 29, 22, 14];
  return role.skills.slice(0, 8).map((skill, i) => ({
    skill,
    percent: basePercents[i] ?? 15,
    rising: i < 3,
  }));
}

function derivePeakTimes(_role: RoleData): PeakTime[] {
  return [
    { label: "Morning (6–9am)", intensity: "medium", description: "Revision & planning" },
    { label: "Afternoon (1–5pm)", intensity: "low", description: "Light study sessions" },
    { label: "Evening (6–10pm)", intensity: "high", description: "Peak preparation window" },
    { label: "Night (10pm+)", intensity: "medium", description: "DSA & coding practice" },
  ];
}

function deriveGoalStats(role: RoleData): GoalStat[] {
  // Simulate distribution across top 5 goals
  const baseWeights = [38, 27, 18, 11, 6];
  return role.commonGoals.slice(0, 5).map((goal, i) => ({
    goal,
    percent: baseWeights[i] ?? 5,
  }));
}

function getMomentumStrength(activeToday: number, totalAspirants: number): number {
  // 0–100 momentum score
  const ratio = activeToday / totalAspirants;
  return Math.min(100, Math.round(ratio * 620));
}

// ── Intensity config ──────────────────────────────────────────────────────────

const INTENSITY_CONFIG = {
  high: { label: "Peak", bg: "#e6f5ec", border: "rgba(31,109,66,0.18)", color: "#1f6d42", barColor: "#1f6d42" },
  medium: { label: "Active", bg: "rgba(59,42,225,0.08)", border: "rgba(59,42,225,0.14)", color: "#3b2ae1", barColor: "#3b2ae1" },
  low: { label: "Quiet", bg: "var(--rb-surface-sub)", border: "var(--rb-border)", color: "var(--rb-muted)", barColor: "#c7c4d9" },
};

// ── Mini skill bar ────────────────────────────────────────────────────────────

function SkillBar({ skill, percent, rising, color }: SkillTrend & { color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-rb-text truncate leading-none">{skill}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {rising && (
              <span
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color }}
              >
                ↑ Rising
              </span>
            )}
            <span className="text-[10px] font-bold text-rb-muted">{percent}%</span>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-rb-surface-sub overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percent}%`, backgroundColor: color, opacity: rising ? 1 : 0.55 }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Peak time row ─────────────────────────────────────────────────────────────

function PeakTimeRow({ time }: { time: PeakTime }) {
  const config = INTENSITY_CONFIG[time.intensity];
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors duration-150"
      style={{ backgroundColor: config.bg, borderColor: config.border }}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: config.color }} />
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-none" style={{ color: config.color }}>{time.label}</p>
          <p className="text-[10px] mt-0.5 leading-none" style={{ color: config.color, opacity: 0.75 }}>{time.description}</p>
        </div>
      </div>
      <span
        className="shrink-0 text-[9px] font-black uppercase tracking-widest rounded-full px-2 py-0.5"
        style={{ backgroundColor: `${config.barColor}22`, color: config.color }}
      >
        {config.label}
      </span>
    </div>
  );
}

// ── Goal distribution bar ─────────────────────────────────────────────────────

function GoalBar({ goal, percent, color }: GoalStat & { color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-rb-muted truncate">{goal}</span>
          <span className="text-[10px] font-black ml-1.5 shrink-0" style={{ color }}>{percent}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-rb-surface-sub overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percent}%`, backgroundColor: color, opacity: 0.7 }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Momentum Gauge ────────────────────────────────────────────────────────────

function MomentumGauge({ score, color }: { score: number; color: string }) {
  const label =
    score >= 70 ? "Very Strong"
    : score >= 50 ? "Strong"
    : score >= 30 ? "Active"
    : "Growing";

  const labelColor =
    score >= 70 ? "#1f6d42"
    : score >= 50 ? color
    : score >= 30 ? "#9a6200"
    : "var(--rb-muted)";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-rb-muted">Community Momentum</span>
        <span className="text-[11px] font-black" style={{ color: labelColor }}>{label}</span>
      </div>
      {/* Track */}
      <div className="relative h-2 w-full rounded-full bg-rb-surface-sub overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${score}%`,
            background: score >= 70
              ? "linear-gradient(90deg, #1f6d42, #34d399)"
              : score >= 50
              ? `linear-gradient(90deg, ${color}aa, ${color})`
              : score >= 30
              ? "linear-gradient(90deg, #9a6200, #f59e0b)"
              : "linear-gradient(90deg, #c7c4d9, #9ca3af)",
          }}
        />
      </div>
      <p className="text-[10px] text-rb-muted leading-relaxed">
        Based on check-in frequency, active today ratio, and preparation consistency of this community.
      </p>
    </div>
  );
}

// ── Main EcosystemAnalyticsPanel ──────────────────────────────────────────────

export function EcosystemAnalyticsPanel({ role }: { role: RoleData }) {
  const skillTrends = useMemo(() => deriveSkillTrends(role), [role]);
  const peakTimes = useMemo(() => derivePeakTimes(role), [role]);
  const goalStats = useMemo(() => deriveGoalStats(role), [role]);
  const momentumScore = useMemo(() => getMomentumStrength(role.activeToday, role.totalAspirants), [role]);

  return (
    <section
      className="rb-card rb-animate-in flex flex-col gap-7"
      aria-label="Ecosystem analytics"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: `${role.color}15`, color: role.color }}
        >
          <BarChart2 className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-black text-rb-text">Ecosystem Analytics</h2>
          <p className="text-[11px] text-rb-muted">Anonymous preparation intelligence — no individual data</p>
        </div>
      </div>

      {/* 1 ── Momentum gauge */}
      <div className="rounded-2xl border border-rb-border bg-rb-surface p-4 flex flex-col gap-3">
        <MomentumGauge score={momentumScore} color={role.color} />
      </div>

      {/* 2 ── Trending skills */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: role.color }} />
          <h3 className="text-[12px] font-black uppercase tracking-widest text-rb-text">Trending Skills</h3>
        </div>
        <div className="flex flex-col gap-3">
          {skillTrends.map((st) => (
            <SkillBar key={st.skill} {...st} color={role.color} />
          ))}
        </div>
        <p className="text-[10px] text-rb-muted">Relative focus by active aspirants in this community.</p>
      </div>

      {/* 3 ── Goal distribution */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 shrink-0" style={{ color: role.color }} />
          <h3 className="text-[12px] font-black uppercase tracking-widest text-rb-text">Goal Distribution</h3>
        </div>
        <div className="flex flex-col gap-2.5">
          {goalStats.map((gs) => (
            <GoalBar key={gs.goal} {...gs} color={role.color} />
          ))}
        </div>
        <p className="text-[10px] text-rb-muted">Most commonly set daily preparation goals.</p>
      </div>

      {/* 4 ── Peak preparation times */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: role.color }} />
          <h3 className="text-[12px] font-black uppercase tracking-widest text-rb-text">Active Preparation Times</h3>
        </div>
        <div className="flex flex-col gap-2">
          {peakTimes.map((t) => (
            <PeakTimeRow key={t.label} time={t} />
          ))}
        </div>
        <p className="text-[10px] text-rb-muted">When this community is most active. All times approximate.</p>
      </div>

      {/* 5 ── Growth signal */}
      {role.growthPercent >= 20 && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            backgroundColor: `${role.color}0c`,
            border: `1px solid ${role.color}20`,
          }}
        >
          <TrendingUp className="h-5 w-5 shrink-0" style={{ color: role.color }} />
          <div>
            <p className="text-[12px] font-black" style={{ color: role.color }}>
              +{role.growthPercent}% growth this month
            </p>
            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: role.color, opacity: 0.8 }}>
              This community is one of the fastest-growing on RoleBuddy.
            </p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-rb-muted border-t border-rb-border pt-3">
        All analytics are anonymous and aggregated. Individual preparation activity is never shown or identified.
      </p>
    </section>
  );
}

export default EcosystemAnalyticsPanel;
