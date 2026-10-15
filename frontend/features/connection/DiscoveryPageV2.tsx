"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { COMMUNITY_ID_TO_SLUG } from "@/features/roles";
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
  Zap,
  CheckCircle2,
  TrendingUp,
  Building2,
  ArrowRight,
  Flame,
  BarChart3,
  Code2,
  Database,
  Globe,
  Shield,
  Cpu,
  LineChart,
  Layers,
  Server,
} from "lucide-react";

import {
  getSuggestions,
  searchProfiles,
  sendConnectionRequest,
  getPendingRequests,
  getConnections,
} from "./connection.api";
import type {
  ProfileSuggestion,
  UserProfile,
  ConnectionRequest,
  Connection,
} from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "recommended" | "communities" | "trending";

type DisplayProfile = (ProfileSuggestion | UserProfile) & {
  matchScore?: number;
  requestSent?: boolean;
};

type MatchUser = {
  role: string | null;
  specialization: string | null;
  domainArea: string | null;
  experience: string | null;
};

// ── Static Communities Data ──────────────────────────────────────────────────

type RoleCommunity = {
  id: string;
  role: string;
  totalAspirants: number;
  activeToday: number;
  tags: string[];
  ecosystemLabel: string;
  color: string;
  icon: React.ReactNode;
  momentumLabel: string;      // e.g. "↑ Strong preparation activity this week"
  momentumStrength: "high" | "medium" | "growing"; // controls badge styling
  topFocus: string;           // most focused skill/topic right now
};

const ROLE_COMMUNITIES: RoleCommunity[] = [
  {
    id: "backend-node",
    role: "Backend Node.js Engineer",
    totalAspirants: 2340,
    activeToday: 381,
    tags: ["Express.js", "MongoDB", "REST APIs", "JWT"],
    ecosystemLabel: "Server-side",
    color: "#3b2ae1",
    icon: <Server className="h-5 w-5" />,
    momentumLabel: "↑ Strong preparation activity this week",
    momentumStrength: "high",
    topFocus: "System design & APIs",
  },
  {
    id: "frontend-react",
    role: "Frontend React Engineer",
    totalAspirants: 3120,
    activeToday: 512,
    tags: ["React", "TypeScript", "Tailwind", "Next.js"],
    ecosystemLabel: "UI Engineering",
    color: "#0ea5e9",
    icon: <Globe className="h-5 w-5" />,
    momentumLabel: "↑ Highest active community today",
    momentumStrength: "high",
    topFocus: "React portfolio projects",
  },
  {
    id: "data-analyst",
    role: "Data Analyst",
    totalAspirants: 1870,
    activeToday: 294,
    tags: ["SQL", "Python", "Tableau", "Excel"],
    ecosystemLabel: "Data & Insights",
    color: "#10b981",
    icon: <BarChart3 className="h-5 w-5" />,
    momentumLabel: "↑ Rising preparation activity",
    momentumStrength: "high",
    topFocus: "SQL interview practice",
  },
  {
    id: "fullstack",
    role: "Full Stack Developer",
    totalAspirants: 2780,
    activeToday: 443,
    tags: ["React", "Node.js", "PostgreSQL", "Docker"],
    ecosystemLabel: "Full Stack",
    color: "#8b5cf6",
    icon: <Layers className="h-5 w-5" />,
    momentumLabel: "↑ Active evening preparation",
    momentumStrength: "high",
    topFocus: "End-to-end project building",
  },
  {
    id: "devops",
    role: "DevOps Engineer",
    totalAspirants: 1240,
    activeToday: 186,
    tags: ["Kubernetes", "AWS", "CI/CD", "Terraform"],
    ecosystemLabel: "Infrastructure",
    color: "#f59e0b",
    icon: <Cpu className="h-5 w-5" />,
    momentumLabel: "→ Steady preparation consistency",
    momentumStrength: "medium",
    topFocus: "Kubernetes & cloud",
  },
  {
    id: "ml-engineer",
    role: "ML Engineer",
    totalAspirants: 1560,
    activeToday: 248,
    tags: ["PyTorch", "Python", "NumPy", "MLOps"],
    ecosystemLabel: "AI / ML",
    color: "#ec4899",
    icon: <LineChart className="h-5 w-5" />,
    momentumLabel: "↑ Fastest-growing community",
    momentumStrength: "high",
    topFocus: "LLMs & transformer models",
  },
  {
    id: "backend-python",
    role: "Backend Python Engineer",
    totalAspirants: 1980,
    activeToday: 319,
    tags: ["Django", "FastAPI", "PostgreSQL", "Redis"],
    ecosystemLabel: "Server-side",
    color: "#3b82f6",
    icon: <Code2 className="h-5 w-5" />,
    momentumLabel: "↑ Active preparation momentum",
    momentumStrength: "high",
    topFocus: "FastAPI & async Python",
  },
  {
    id: "data-engineer",
    role: "Data Engineer",
    totalAspirants: 1120,
    activeToday: 164,
    tags: ["Spark", "Airflow", "dbt", "Snowflake"],
    ecosystemLabel: "Data Platform",
    color: "#14b8a6",
    icon: <Database className="h-5 w-5" />,
    momentumLabel: "→ Growing ecosystem interest",
    momentumStrength: "growing",
    topFocus: "Pipeline design & Airflow",
  },
  {
    id: "cybersecurity",
    role: "Cybersecurity Analyst",
    totalAspirants: 890,
    activeToday: 127,
    tags: ["SIEM", "Penetration Testing", "OWASP", "Networking"],
    ecosystemLabel: "Security",
    color: "#ef4444",
    icon: <Shield className="h-5 w-5" />,
    momentumLabel: "→ Consistent preparation activity",
    momentumStrength: "medium",
    topFocus: "OWASP & penetration testing",
  },
];

// ── Static Trending Data ─────────────────────────────────────────────────────

type TrendingArea = {
  id: string;
  category: string;
  description: string;
  aspirantCount: number;
  growthPercent: number;
  weeklyActive: number;         // active in past 7 days
  tags: string[];
  color: string;
  bgGradient: string;
  icon: React.ReactNode;
  trending: boolean;
  risingLabel: string;          // e.g. "Rapidly rising" / "High demand"
  preparationPhrase: string;    // e.g. "Most aspirants focus on projects"
};

const TRENDING_AREAS: TrendingArea[] = [
  {
    id: "backend",
    category: "Backend Development",
    description: "API design, databases, scalable systems and server-side engineering",
    aspirantCount: 7840,
    growthPercent: 18,
    weeklyActive: 2140,
    tags: ["Node.js", "Python", "Go", "Databases", "REST", "GraphQL"],
    color: "#3b2ae1",
    bgGradient: "from-[#3b2ae1]/8 to-[#554bf9]/4",
    icon: <Server className="h-6 w-6" />,
    trending: true,
    risingLabel: "High demand",
    preparationPhrase: "Most focus on system design & APIs",
  },
  {
    id: "frontend",
    category: "Frontend Engineering",
    description: "Modern UI, performance, accessibility and component architecture",
    aspirantCount: 9210,
    growthPercent: 24,
    weeklyActive: 2870,
    tags: ["React", "TypeScript", "Next.js", "CSS", "Testing"],
    color: "#0ea5e9",
    bgGradient: "from-[#0ea5e9]/8 to-[#38bdf8]/4",
    icon: <Globe className="h-6 w-6" />,
    trending: true,
    risingLabel: "Rapidly rising",
    preparationPhrase: "Portfolio projects are the top priority",
  },
  {
    id: "data-analytics",
    category: "Data Analytics",
    description: "Turning raw data into actionable insights with modern tooling",
    aspirantCount: 5490,
    growthPercent: 31,
    weeklyActive: 1620,
    tags: ["SQL", "Python", "Power BI", "Tableau", "Statistics"],
    color: "#10b981",
    bgGradient: "from-[#10b981]/8 to-[#34d399]/4",
    icon: <BarChart3 className="h-6 w-6" />,
    trending: true,
    risingLabel: "Fastest growing",
    preparationPhrase: "SQL & case studies are the top focus",
  },
  {
    id: "aiml",
    category: "AI / Machine Learning",
    description: "Building intelligent systems: NLP, computer vision, generative AI",
    aspirantCount: 4230,
    growthPercent: 47,
    weeklyActive: 1380,
    tags: ["PyTorch", "TensorFlow", "LLMs", "MLOps", "Python"],
    color: "#ec4899",
    bgGradient: "from-[#ec4899]/8 to-[#f472b6]/4",
    icon: <Cpu className="h-6 w-6" />,
    trending: true,
    risingLabel: "Explosive growth",
    preparationPhrase: "LLMs & research papers dominate",
  },
  {
    id: "devops",
    category: "DevOps & Cloud",
    description: "Infrastructure automation, cloud architecture and deployment pipelines",
    aspirantCount: 3610,
    growthPercent: 22,
    weeklyActive: 940,
    tags: ["AWS", "Kubernetes", "Terraform", "CI/CD", "Docker"],
    color: "#f59e0b",
    bgGradient: "from-[#f59e0b]/8 to-[#fbbf24]/4",
    icon: <Layers className="h-6 w-6" />,
    trending: false,
    risingLabel: "Steady growth",
    preparationPhrase: "Hands-on cloud labs are most popular",
  },
  {
    id: "product-design",
    category: "Product Design",
    description: "UX research, interaction design and product thinking for tech roles",
    aspirantCount: 2780,
    growthPercent: 15,
    weeklyActive: 710,
    tags: ["Figma", "UX Research", "Prototyping", "Design Systems"],
    color: "#8b5cf6",
    bgGradient: "from-[#8b5cf6]/8 to-[#a78bfa]/4",
    icon: <Zap className="h-6 w-6" />,
    trending: false,
    risingLabel: "Growing interest",
    preparationPhrase: "Portfolio & case studies are key",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
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

function ProfileModal({
  profile,
  currentUser,
  isConnected,
  hasRequestPending,
  loading,
  onClose,
  onConnect,
}: ProfileModalProps) {
  const profileId = (profile as ProfileSuggestion).userId || (profile as ProfileSuggestion)._id || "";
  const displayName = profile.displayName || "Anonymous User";
  const role = profile.role || "Role not specified";

  const score = currentUser
    ? calcMatchScore(currentUser, {
        role: profile.role,
        specialization: profile.specialization,
        domainArea: profile.domainArea,
        experience: profile.experience,
      })
    : profile.matchScore ?? 40;
  const reasons = currentUser
    ? getMatchReasons(currentUser, {
        role: profile.role,
        specialization: profile.specialization,
        domainArea: profile.domainArea,
        experience: profile.experience,
      })
    : [];
  const colors = getScoreColor(score);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1b1b24]/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.15)] overflow-hidden rb-scale-in">
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
            <div className={`rounded-xl px-3 py-2 flex flex-col items-center shrink-0 ${colors.bg}`}>
              <span className={`text-2xl font-black ${colors.text}`}>{score}%</span>
              <span className="text-[10px] font-bold text-rb-muted uppercase tracking-widest">Match</span>
            </div>
          </div>

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

          <button
            type="button"
            onClick={() => {
              if (profileId && !isConnected && !hasRequestPending && !loading) onConnect(profileId);
            }}
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
            {loading
              ? "Sending…"
              : isConnected
              ? "Connected"
              : hasRequestPending
              ? "Request Sent"
              : "Send Connection Request"}
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

function ProfileCard({
  profile,
  currentUser,
  isConnected,
  hasRequestPending,
  loading,
  onConnect,
  onViewProfile,
}: ProfileCardProps) {
  const profileId = (profile as ProfileSuggestion).userId || (profile as ProfileSuggestion)._id || "";
  const displayName = profile.displayName || "Anonymous User";
  const role = profile.role || "Role not specified";

  const score = currentUser
    ? calcMatchScore(currentUser, {
        role: profile.role,
        specialization: profile.specialization,
        domainArea: profile.domainArea,
        experience: profile.experience,
      })
    : profile.matchScore ?? 40;
  const reasons = currentUser
    ? getMatchReasons(currentUser, {
        role: profile.role,
        specialization: profile.specialization,
        domainArea: profile.domainArea,
        experience: profile.experience,
      })
    : [];
  const colors = getScoreColor(score);

  return (
    <div
      className="group relative bg-white border border-rb-border rounded-2xl p-5 transition-all duration-200 hover:shadow-rb-card-hover hover:-translate-y-0.5 cursor-pointer flex flex-col"
      onClick={() => onViewProfile(profile)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onViewProfile(profile);
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-rb-primary/10 flex items-center justify-center text-rb-primary font-black text-sm shrink-0 group-hover:bg-rb-primary group-hover:text-white transition-colors duration-200">
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
        <div className={`shrink-0 rounded-lg px-2.5 py-1 ${colors.bg}`}>
          <span className={`text-xs font-black ${colors.text}`}>{score}%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {profile.experience && (
          <span className="rb-pill bg-rb-surface border border-rb-border text-rb-muted">{profile.experience}</span>
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

      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {reasons.map((r) => (
            <span key={r} className="rb-pill bg-rb-primary-light text-rb-primary border border-[rgba(59,42,225,0.12)]">
              {r}
            </span>
          ))}
        </div>
      )}

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
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(profile);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-rb-border text-rb-muted hover:bg-rb-surface hover:border-rb-border-strong transition-all"
          aria-label="View profile details"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Discovery Skeleton ────────────────────────────────────────────────────────

function DiscoverySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 rb-skeleton" />
      ))}
    </div>
  );
}

// ── Community Card ────────────────────────────────────────────────────────────

function CommunityCard({ community }: { community: RoleCommunity }) {
  const router = useRouter();
  const slug = COMMUNITY_ID_TO_SLUG[community.id];

  const handleExplore = () => {
    if (slug) {
      router.push(`/roles/${slug}`);
    }
  };

  // Momentum badge styling
  const momentumStyle =
    community.momentumStrength === "high"
      ? { bg: "#e6f5ec", border: "rgba(31,109,66,0.18)", color: "#1f6d42" }
      : community.momentumStrength === "medium"
      ? { bg: `${community.color}10`, border: `${community.color}22`, color: community.color }
      : { bg: "#fff8e1", border: "rgba(245,158,11,0.2)", color: "#9a6200" };

  return (
    <div
      className="group relative bg-white border border-rb-border rounded-2xl p-5 transition-all duration-200 hover:shadow-rb-card-hover hover:-translate-y-0.5 flex flex-col gap-4 overflow-hidden"
    >
      {/* Decorative accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all duration-200 group-hover:h-1.5"
        style={{ backgroundColor: community.color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
            style={{ backgroundColor: `${community.color}18`, color: community.color }}
          >
            {community.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-rb-text leading-tight">{community.role}</p>
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-widest mt-0.5"
              style={{ color: community.color }}
            >
              {community.ecosystemLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-rb-surface border border-rb-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted">Preparing</p>
          <p className="text-lg font-black text-rb-text mt-0.5">{formatCount(community.totalAspirants)}</p>
        </div>
        <div className="rounded-xl bg-[#e6f5ec] border border-[rgba(31,109,66,0.15)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1f6d42]">Active today</p>
          <p className="text-lg font-black text-[#1f6d42] mt-0.5">{formatCount(community.activeToday)}</p>
        </div>
      </div>

      {/* Momentum signal */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2"
        style={{ backgroundColor: momentumStyle.bg, border: `1px solid ${momentumStyle.border}` }}
      >
        <div className="relative shrink-0">
          <span className="block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: momentumStyle.color }} />
          <span className="absolute inset-0 h-1.5 w-1.5 rounded-full animate-ping opacity-50" style={{ backgroundColor: momentumStyle.color }} />
        </div>
        <p className="text-[11px] font-semibold" style={{ color: momentumStyle.color }}>
          {community.momentumLabel}
        </p>
      </div>

      {/* Top focus */}
      <div className="flex items-center gap-2">
        <Target className="h-3 w-3 shrink-0 text-rb-muted" />
        <p className="text-[11px] text-rb-muted">
          <span className="font-semibold text-rb-text">Top focus:</span> {community.topFocus}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {community.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
            style={{
              backgroundColor: `${community.color}0f`,
              borderColor: `${community.color}25`,
              color: community.color,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-auto pt-3 border-t border-rb-border">
        <button
          type="button"
          onClick={handleExplore}
          disabled={!slug}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-default"
          style={{
            backgroundColor: `${community.color}12`,
            color: community.color,
            border: `1px solid ${community.color}20`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${community.color}20`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${community.color}12`;
          }}
        >
          Explore Role
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Trending Area Card ────────────────────────────────────────────────────────

function TrendingCard({ area, rank }: { area: TrendingArea; rank: number }) {
  // Popularity bar: active this week as % of total aspirants, capped at 40%
  const popularityPercent = Math.min(100, Math.round((area.weeklyActive / area.aspirantCount) * 250));

  return (
    <div
      className={`group relative bg-white border border-rb-border rounded-2xl p-5 transition-all duration-200 hover:shadow-rb-card-hover hover:-translate-y-0.5 flex flex-col gap-4 overflow-hidden`}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${area.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}
      />

      {/* Rank + badges */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        {area.trending && (
          <span className="flex items-center gap-1 rounded-full bg-[#fff8e1] border border-[#f59e0b]/25 px-2 py-0.5 text-[10px] font-bold text-[#9a6200]">
            <Flame className="h-2.5 w-2.5" />
            Hot
          </span>
        )}
        <span className="text-[11px] font-black text-rb-muted">#{rank}</span>
      </div>

      {/* Header */}
      <div className="relative flex items-start gap-4">
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: `${area.color}15`, color: area.color }}
        >
          {area.icon}
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <h3 className="text-base font-black text-rb-text leading-tight">{area.category}</h3>
          <p className="text-xs text-rb-muted mt-1 leading-relaxed line-clamp-2">{area.description}</p>
        </div>
      </div>

      {/* Rising label + growth */}
      <div className="relative flex items-center gap-2">
        <span
          className="text-[10px] font-black uppercase tracking-widest rounded-full px-2.5 py-0.5"
          style={{ backgroundColor: `${area.color}14`, color: area.color, border: `1px solid ${area.color}22` }}
        >
          {area.risingLabel}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: area.color }}>
          <TrendingUp className="h-3 w-3" />
          +{area.growthPercent}% growth
        </span>
      </div>

      {/* Preparation popularity bar */}
      <div className="relative flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rb-muted">Weekly active</span>
          <span className="text-[11px] font-black" style={{ color: area.color }}>{formatCount(area.weeklyActive)}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-rb-surface overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${popularityPercent}%`, backgroundColor: area.color }}
          />
        </div>
      </div>

      {/* Preparation phrase */}
      <div className="relative flex items-center gap-1.5">
        <CheckCircle2 className="h-3 w-3 shrink-0 text-rb-muted" />
        <p className="text-[11px] text-rb-muted italic">{area.preparationPhrase}</p>
      </div>

      {/* Stats */}
      <div className="relative flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-rb-muted" />
          <span className="text-sm font-bold text-rb-text">{formatCount(area.aspirantCount)}</span>
          <span className="text-xs text-rb-muted">preparing</span>
        </div>
      </div>

      {/* Tags */}
      <div className="relative flex flex-wrap gap-1.5">
        {area.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
            style={{
              backgroundColor: `${area.color}0f`,
              borderColor: `${area.color}20`,
              color: area.color,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Tab Nav ──────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "recommended", label: "Recommended", icon: <Zap className="h-3.5 w-3.5" /> },
  { id: "communities", label: "Communities", icon: <Building2 className="h-3.5 w-3.5" /> },
  { id: "trending", label: "Trending", icon: <TrendingUp className="h-3.5 w-3.5" /> },
];

function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Discovery sections"
      className="flex gap-1 rounded-2xl border border-rb-border bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)] w-full sm:w-auto"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={[
              "relative flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 whitespace-nowrap min-w-0",
              isActive
                ? "bg-rb-primary text-white shadow-[0_2px_8px_rgba(59,42,225,0.25)]"
                : "text-rb-muted hover:text-rb-text hover:bg-rb-surface",
            ].join(" ")}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Tab Panel Wrapper ─────────────────────────────────────────────────────────

function TabPanel({
  id,
  activeTab,
  children,
}: {
  id: Tab;
  activeTab: Tab;
  children: React.ReactNode;
}) {
  const isActive = id === activeTab;
  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
      className={isActive ? "rb-animate-in" : ""}
    >
      {isActive && children}
    </div>
  );
}

// ── Recommended Tab Content ───────────────────────────────────────────────────

type RecommendedTabProps = {
  currentUser: MatchUser | null;
  suggestions: ProfileSuggestion[];
  searchResults: UserProfile[];
  connections: Connection[];
  pendingRequests: ConnectionRequest[];
  searchQuery: string;
  isSearching: boolean;
  isSearchMode: boolean;
  loading: boolean;
  error: string | null;
  sendingRequestId: string | null;
  onSearch: (e: React.FormEvent) => void;
  onSearchQueryChange: (q: string) => void;
  onClearSearch: () => void;
  onConnect: (userId: string) => void;
  onViewProfile: (profile: DisplayProfile) => void;
  getProfileId: (profile: DisplayProfile) => string;
};

function RecommendedTab({
  currentUser,
  suggestions,
  searchResults,
  connections,
  pendingRequests,
  searchQuery,
  isSearching,
  isSearchMode,
  loading,
  error,
  sendingRequestId,
  onSearch,
  onSearchQueryChange,
  onClearSearch,
  onConnect,
  onViewProfile,
  getProfileId,
}: RecommendedTabProps) {
  const displayProfiles: DisplayProfile[] = isSearchMode ? searchResults : suggestions;
  const resultCount = displayProfiles.length;

  const isConnected = (userId: string) =>
    connections.some((conn) => (conn.userId.userId || conn.userId._id) === userId);

  const hasRequestPending = (userId: string) =>
    pendingRequests.some((req) => (req.from.userId || req.from._id) === userId);

  return (
    <div className="flex flex-col gap-5">
      {/* Search bar */}
      <form onSubmit={onSearch}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-rb-muted pointer-events-none" />
            <input
              id="discovery-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
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
              onClick={onClearSearch}
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
        <div className="rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-4 py-3 text-sm text-rb-danger">
          {error}
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-rb-muted" />
          <h2 className="text-sm font-semibold text-rb-text">
            {isSearchMode ? `Search results · ${resultCount}` : `Suggested partners · ${resultCount}`}
          </h2>
        </div>
        {!isSearchMode && resultCount > 0 && (
          <span className="text-xs text-rb-muted">Ranked by compatibility</span>
        )}
      </div>

      {/* Loading */}
      {loading && !isSearchMode && <DiscoverySkeleton />}

      {/* Searching indicator */}
      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-rb-muted py-8 justify-center">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Searching profiles…
        </div>
      )}

      {/* Empty state */}
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
              onClick={onClearSearch}
              className="mt-5 rounded-xl border border-rb-border px-4 py-2 text-sm font-medium text-rb-muted hover:bg-rb-surface transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Profile grid */}
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
                onConnect={onConnect}
                onViewProfile={onViewProfile}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Communities Tab Content ───────────────────────────────────────────────────

function CommunitiesTab({ searchQuery }: { searchQuery: string }) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return ROLE_COMMUNITIES;
    const q = searchQuery.toLowerCase();
    return ROLE_COMMUNITIES.filter(
      (c) =>
        c.role.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.ecosystemLabel.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-rb-text">Active role communities</h2>
          <p className="text-xs text-rb-muted mt-0.5">Preparation groups organized by engineering role</p>
        </div>
        <span className="rb-pill bg-rb-primary-light text-rb-primary border border-[rgba(59,42,225,0.12)]">
          {filtered.length} roles
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-rb-border rounded-2xl">
          <Building2 className="h-10 w-10 text-rb-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-rb-text">No communities match your search</p>
          <p className="text-xs text-rb-muted mt-1">Try a broader keyword</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Trending Tab Content ──────────────────────────────────────────────────────

function TrendingTab({ searchQuery }: { searchQuery: string }) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return TRENDING_AREAS;
    const q = searchQuery.toLowerCase();
    return TRENDING_AREAS.filter(
      (a) =>
        a.category.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-rb-text">Trending preparation areas</h2>
          <p className="text-xs text-rb-muted mt-0.5">Fastest-growing domains on RoleBuddy</p>
        </div>
        <span className="rb-pill bg-rb-warning-bg text-rb-warning border border-[rgba(154,98,0,0.15)]">
          <TrendingUp className="h-2.5 w-2.5" />
          Live data
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-rb-border rounded-2xl">
          <TrendingUp className="h-10 w-10 text-rb-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-rb-text">No trending areas match your search</p>
          <p className="text-xs text-rb-muted mt-1">Try a broader keyword</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((area, index) => (
            <TrendingCard key={area.id} area={area} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main DiscoveryPageV2 ──────────────────────────────────────────────────────

export function DiscoveryPageV2() {
  const [activeTab, setActiveTab] = useState<Tab>("recommended");

  // Recommended tab state
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

  const getProfileId = useCallback(
    (profile: DisplayProfile) => (profile as ProfileSuggestion).userId || (profile as ProfileSuggestion)._id || "",
    []
  );

  const normalizeSuggestion = (p: ProfileSuggestion): ProfileSuggestion => ({
    ...p,
    userId: p.userId || p._id,
    displayName: p.displayName || "Anonymous User",
  });

  const normalizeSearchProfile = (p: UserProfile): UserProfile => ({
    ...p,
    userId: p.userId || p._id,
    displayName: p.displayName || "Anonymous User",
  });

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [suggestionsData, connectionsData, requestsData, profileData] = await Promise.all([
          getSuggestions(20),
          getConnections(),
          getPendingRequests(),
          import("@/features/auth/auth.api")
            .then((m) => m.getProfile())
            .catch(() => null),
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
            experience: u.experience ?? null,
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
    setSuggestions((prev) => prev.map((p) => (getProfileId(p) === userId ? { ...p, requestSent: true } : p)));
    setSearchResults((prev) => prev.map((p) => (getProfileId(p) === userId ? { ...p, requestSent: true } : p)));
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

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  return (
    <>
      {/* Profile modal */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          currentUser={currentUser}
          isConnected={connections.some(
            (conn) => (conn.userId.userId || conn.userId._id) === getProfileId(selectedProfile)
          )}
          hasRequestPending={
            Boolean((selectedProfile as ProfileSuggestion).requestSent) ||
            pendingRequests.some(
              (req) => (req.from.userId || req.from._id) === getProfileId(selectedProfile)
            )
          }
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
            Explore the preparation ecosystem
          </h1>
          <p className="mt-1 text-sm text-rb-muted max-w-xl">
            Find accountability partners, explore active role communities, and discover where serious aspirants are preparing.
          </p>
        </div>

        {/* Persistent search bar */}
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-rb-border bg-white pl-3.5 pr-3 py-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] focus-within:ring-2 focus-within:ring-rb-primary/20 focus-within:border-rb-primary transition-all">
          <Search className="h-4 w-4 text-rb-muted shrink-0 pointer-events-none" />
          <input
            id="discovery-global-search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Auto-clear search mode when input is cleared
              if (!e.target.value.trim() && isSearchMode) {
                handleClearSearch();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (activeTab === "recommended") {
                  void handleSearch(e as unknown as React.FormEvent);
                }
              }
            }}
            placeholder={
              activeTab === "recommended"
                ? "Search by role, specialization, or domain…"
                : activeTab === "communities"
                ? "Filter communities by role or skill…"
                : "Filter preparation areas or skills…"
            }
            maxLength={60}
            className="flex-1 bg-transparent text-sm text-rb-text placeholder:text-rb-muted focus:outline-none min-w-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                if (isSearchMode) handleClearSearch();
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-rb-muted hover:bg-rb-surface hover:text-rb-text transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {activeTab === "recommended" && (
            <button
              type="button"
              onClick={(e) => void handleSearch(e as unknown as React.FormEvent)}
              disabled={isSearching || !searchQuery.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-rb-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-rb-primary-dark transition-colors disabled:opacity-60 shrink-0"
            >
              {isSearching ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Search</span>
            </button>
          )}
        </div>

        {/* Tab navigation */}
        <div className="mb-6">
          <TabNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Error banner (global) */}
        {error && activeTab === "recommended" && (
          <div className="mb-5 rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-4 py-3 text-sm text-rb-danger">
            {error}
          </div>
        )}

        {/* Tab content */}
        <TabPanel id="recommended" activeTab={activeTab}>
          <RecommendedTab
            currentUser={currentUser}
            suggestions={suggestions}
            searchResults={searchResults}
            connections={connections}
            pendingRequests={pendingRequests}
            searchQuery={searchQuery}
            isSearching={isSearching}
            isSearchMode={isSearchMode}
            loading={loading}
            error={null}
            sendingRequestId={sendingRequestId}
            onSearch={handleSearch}
            onSearchQueryChange={setSearchQuery}
            onClearSearch={handleClearSearch}
            onConnect={handleConnect}
            onViewProfile={setSelectedProfile}
            getProfileId={getProfileId}
          />
        </TabPanel>

        <TabPanel id="communities" activeTab={activeTab}>
          <CommunitiesTab searchQuery={searchQuery} />
        </TabPanel>

        <TabPanel id="trending" activeTab={activeTab}>
          <TrendingTab searchQuery={searchQuery} />
        </TabPanel>
      </div>
    </>
  );
}

export default DiscoveryPageV2;
