import { Activity, BookOpen, TrendingUp } from "lucide-react";
import type { PreparationStatus } from "./types";

type ProfessionalProgressCardProps = {
  consistencyStreak: number;
  contributionCount: number;
  reliabilityLabel: string | null;
  preparationStatus: PreparationStatus | null;
};

const PREPARATION_META: Record<
  PreparationStatus,
  { label: string; labelClass: string }
> = {
  "Starting Preparation": {
    label: "Starting Preparation",
    labelClass: "text-rb-muted"
  },
  "Preparing Actively": {
    label: "Preparing Actively",
    labelClass: "text-rb-primary"
  },
  "Interview Ready": {
    label: "Interview Ready",
    labelClass: "text-[#1f6d42]"
  }
};

export function ProfessionalProgressCard({
  consistencyStreak,
  contributionCount,
  reliabilityLabel,
  preparationStatus
}: ProfessionalProgressCardProps) {
  const status = preparationStatus ?? "Starting Preparation";
  const meta = PREPARATION_META[status] ?? PREPARATION_META["Starting Preparation"];

  return (
    <div className="rb-card">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted">
          Professional Progress
        </p>
        <h2 className="text-lg font-black text-rb-text mt-1">{meta.label}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        {/* Consistency streak */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-rb-border bg-rb-surface px-3.5 py-3">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-rb-primary shrink-0" aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted leading-none">
              Active days
            </p>
          </div>
          <p className="text-2xl font-black text-rb-text leading-none">
            {consistencyStreak}
            <span className="text-xs font-semibold text-rb-muted ml-1">
              {consistencyStreak === 1 ? "day" : "days"}
            </span>
          </p>
          <p className="text-[10px] text-rb-muted">consecutive</p>
        </div>

        {/* Contribution count */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-rb-border bg-rb-surface px-3.5 py-3">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-rb-primary shrink-0" aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted leading-none">
              Contributions
            </p>
          </div>
          <p className="text-2xl font-black text-rb-text leading-none">
            {contributionCount}
          </p>
          <p className="text-[10px] text-rb-muted">exchanges &amp; interviews</p>
        </div>
      </div>

      {/* Reliability + preparation status row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {reliabilityLabel && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(31,109,66,0.25)] bg-[#e6f5ec] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1f6d42]">
            <TrendingUp className="h-3 w-3 shrink-0" aria-hidden />
            {reliabilityLabel}
          </span>
        )}
        <span
          className={`text-[11px] font-semibold ${meta.labelClass}`}
          aria-label={`Preparation status: ${status}`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

/** Skeleton placeholder that matches the card height. */
export function ProfessionalProgressCardSkeleton() {
  return (
    <div className="rb-card">
      <div className="mb-4">
        <div className="h-2.5 w-32 rb-skeleton rounded mb-2" />
        <div className="h-5 w-40 rb-skeleton rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-[84px] rb-skeleton rounded-xl" />
        <div className="h-[84px] rb-skeleton rounded-xl" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-28 rb-skeleton rounded-full" />
        <div className="h-5 w-32 rb-skeleton rounded" />
      </div>
    </div>
  );
}
