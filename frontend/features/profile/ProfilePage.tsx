"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Briefcase,
  Clock,
  Edit3,
  Globe,
  Link2,
  LoaderCircle,
  Save,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
  AlertCircle
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/AppLayout";

import { getMatchHistory, getProfile, logout, updateProfile } from "./profile.api";
import { promoteConnection, acceptPromotionRequest } from "@/features/matching/matching.api";
import type { MatchHistoryEntry, ProfileUser, UpdateProfilePayload } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const EXPERIENCE_OPTIONS = [
  "student / fresher",
  "fresher",
  "beginner",
  "junior",
  "mid-level",
  "senior",
  "manager",
  "lead / head",
  "experienced"
] as const;

const AVAILABILITY_OPTIONS = ["morning", "afternoon", "night"] as const;
const DAILY_GOAL_OPTIONS = [1, 2, 3] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDailyGoal(goal: number | null) {
  if (!goal) return "Not set";
  return goal === 3 ? "3+ hrs" : `${goal} hr${goal > 1 ? "s" : ""}`;
}

function capitalize(str: string | null) {
  if (!str) return "Not set";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const STATUS_BADGE: Record<MatchHistoryEntry["status"], { label: string; className: string }> = {
  active: { label: "Active match", className: "bg-[#1f6d42] text-white" },
  connected: { label: "Connected", className: "bg-rb-primary-light text-rb-primary" }
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline editable field
// ─────────────────────────────────────────────────────────────────────────────

type EditableFieldProps = {
  label: string;
  value: string | null;
  fieldKey: keyof UpdateProfilePayload;
  type?: "text" | "select" | "number";
  options?: readonly string[] | readonly number[];
  isEditing: boolean;
  editValue: string;
  onChange: (key: keyof UpdateProfilePayload, val: string) => void;
  icon?: React.ReactNode;
};

function EditableField({ label, value, fieldKey, type = "text", options, isEditing, editValue, onChange, icon }: EditableFieldProps) {
  return (
    <div className="rb-stat-cell">
      <div className="flex items-center gap-1.5 mb-2">
        {icon && <span className="text-rb-muted">{icon}</span>}
        <Label className="text-[10px] uppercase tracking-widest text-rb-muted font-bold">{label}</Label>
      </div>
      {isEditing ? (
        type === "select" && options ? (
          <select
            id={`edit-${String(fieldKey)}`}
            value={editValue}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="w-full rounded-xl border border-rb-border bg-white px-3 py-2 text-sm text-rb-text focus:outline-none focus:ring-2 focus:ring-rb-primary/20 focus:border-rb-primary transition-all"
          >
            {(options as readonly (string | number)[]).map((opt) => (
              <option key={String(opt)} value={String(opt)}>
                {capitalize(String(opt))}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id={`edit-${String(fieldKey)}`}
            value={editValue}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="text-sm"
          />
        )
      ) : (
        <p className="text-sm font-semibold text-rb-text">{capitalize(value)}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skills editor
// ─────────────────────────────────────────────────────────────────────────────

function SkillsEditor({ skills, isEditing, onChange }: { skills: string[]; isEditing: boolean; onChange: (skills: string[]) => void }) {
  const [inputValue, setInputValue] = useState("");

  function addSkill() {
    const trimmed = inputValue.trim();
    if (!trimmed || skills.includes(trimmed) || skills.length >= 20) return;
    onChange([...skills, trimmed]);
    setInputValue("");
  }

  function removeSkill(skill: string) {
    onChange(skills.filter((s) => s !== skill));
  }

  return (
    <div className="rb-stat-cell">
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles className="h-3 w-3 text-rb-muted" />
        <Label className="text-[10px] uppercase tracking-widest text-rb-muted font-bold">Skills</Label>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-full border border-rb-border bg-white px-3 py-1 text-xs font-medium text-rb-text"
          >
            {skill}
            {isEditing && (
              <button
                type="button"
                aria-label={`Remove ${skill}`}
                onClick={() => removeSkill(skill)}
                className="ml-1 rounded-full text-rb-muted hover:text-rb-danger transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {skills.length === 0 && (
          <span className="text-xs text-rb-muted">No skills added yet.</span>
        )}
      </div>
      {isEditing && (
        <div className="mt-3 flex gap-2">
          <Input
            id="add-skill-input"
            placeholder="Add a skill…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            className="text-sm"
          />
          <button
            type="button"
            onClick={addSkill}
            className="rounded-xl border border-rb-border px-3 py-2 text-xs font-semibold text-rb-text hover:bg-rb-surface transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Match history section
// ─────────────────────────────────────────────────────────────────────────────

function MatchHistorySection({ user, onProfileChange }: { user: ProfileUser | null; onProfileChange?: (u: ProfileUser) => void }) {
  const [history, setHistory] = useState<MatchHistoryEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getMatchHistory()
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="rb-card">
      <div className="flex items-center gap-2 mb-1">
        <Users className="h-4 w-4 text-rb-primary" />
        <h3 className="text-base font-bold text-rb-text">Match history</h3>
      </div>
      <p className="text-xs text-rb-muted mb-4">Your active match and accepted connections.</p>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-3 py-2 text-xs text-rb-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Incoming match requests */}
      {user?.pendingMatchRequests && user.pendingMatchRequests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-2">Incoming Match Requests</h4>
          <div className="grid gap-2">
            {user.pendingMatchRequests.map((req) => (
              <div key={req._id} className="flex flex-col gap-3 rounded-xl border border-rb-primary/30 bg-rb-primary-light/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-rb-text">{req.from?.displayName || "Anonymous"}</p>
                  <p className="mt-0.5 text-xs text-rb-muted capitalize">{req.from?.role || "Unknown role"}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!req.from?.userId) return;
                    setProcessingId(req.from.userId);
                    setErrorMsg(null);
                    try {
                      await acceptPromotionRequest(req.from.userId);
                      window.location.reload();
                    } catch (err: unknown) {
                      setErrorMsg(err instanceof Error ? err.message : "Failed to accept.");
                      setProcessingId(null);
                    }
                  }}
                  disabled={processingId !== null}
                  className="rounded-xl bg-rb-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-rb-primary-dark disabled:opacity-60"
                >
                  {processingId === req.from?.userId ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : "Accept Match"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h4 className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-2 mt-2">Active & Past</h4>

      {isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : !history || history.length === 0 ? (
        <p className="text-sm text-rb-muted">
          No match history yet. Once you match or connect with peers, they will appear here.
        </p>
      ) : (
        <div className="grid gap-3">
          {history.map((entry) => {
            const badge = STATUS_BADGE[entry.status];
            return (
              <div
                key={entry.userId}
                className="flex flex-col gap-2 rounded-xl border border-rb-border bg-rb-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-rb-text">{entry.role ?? "Unknown role"}</p>
                  <p className="mt-0.5 text-xs text-rb-muted capitalize">{entry.experience ?? "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={badge.className}>{badge.label}</Badge>
                  {entry.status === "connected" && (
                    <button
                      type="button"
                      onClick={async () => {
                        setProcessingId(entry.userId);
                        setErrorMsg(null);
                        try {
                          await promoteConnection(entry.userId);
                          setErrorMsg("Request sent successfully.");
                        } catch (err: unknown) {
                          setErrorMsg(err instanceof Error ? err.message : "Failed to promote.");
                        } finally {
                          setProcessingId(null);
                        }
                      }}
                      disabled={processingId !== null}
                      className="rounded-xl border border-rb-border px-3 py-1 text-xs font-bold text-rb-muted hover:bg-rb-surface hover:text-rb-primary transition-colors disabled:opacity-60"
                      title="Promote to Accountability Match"
                    >
                      {processingId === entry.userId ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : "Promote"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ProfilePage
// ─────────────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editSkills, setEditSkills] = useState<string[]>([]);

  function initEditState(u: ProfileUser) {
    setEditValues({
      role: u.role ?? "",
      experience: u.experience ?? "junior",
      specialization: u.specialization ?? "",
      goal: u.goal ?? "",
      intent: u.intent ?? "",
      dailyGoal: String(u.dailyGoal ?? 1),
      availabilityTime: u.availabilityTime ?? "morning",
      availabilityFrequency: u.availabilityFrequency ?? "",
      domain: u.domain ?? "tech",
      primaryArea: u.primaryArea ?? "",
      area: u.area ?? ""
    });
    setEditSkills(u.skills ?? []);
  }

  useEffect(() => {
    getProfile()
      .then((res) => {
        setUser(res.data.user);
        initEditState(res.data.user);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Unable to load profile.";
        if (/unauthorized|401/i.test(message)) { router.replace("/login"); return; }
        setError(message);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFieldChange(key: keyof UpdateProfilePayload, val: string) {
    setEditValues((prev) => ({ ...prev, [key as string]: val }));
  }

  function handleCancelEdit() {
    if (user) initEditState(user);
    setIsEditing(false);
    setSaveError(null);
  }

  async function handleSave() {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload: UpdateProfilePayload = {
        domain: editValues.domain as "tech" | "non-tech",
        role: editValues.role,
        experience: editValues.experience,
        specialization: editValues.specialization,
        goal: editValues.goal,
        intent: editValues.intent || null,
        dailyGoal: Number(editValues.dailyGoal) as 1 | 2 | 3,
        availabilityTime: editValues.availabilityTime as "morning" | "afternoon" | "night",
        availability: editValues.availabilityTime as "morning" | "afternoon" | "night",
        availabilityFrequency: editValues.availabilityFrequency,
        skills: editSkills,
        primaryArea: editValues.domain === "tech" ? editValues.primaryArea || null : null,
        area: editValues.domain === "non-tech" ? editValues.area || null : null,
        preferences: user.preferences ?? []
      };
      const res = await updateProfile(payload);
      setUser(res.data.user);
      initEditState(res.data.user);
      setIsEditing(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save profile.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container">
          <ProfileSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (error || !user) {
    return (
      <AppLayout>
        <div className="page-container">
          <div className="rb-card flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rb-danger">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-bold text-rb-text">Profile unavailable</p>
                <p className="text-sm text-rb-muted">{error ?? "Unable to load your profile."}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-xl bg-rb-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-rb-primary-dark transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole={user.role}>
      <div className="page-container">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="rb-pill bg-rb-primary-light text-rb-primary">
              <Zap className="h-2.5 w-2.5" />
              Your Profile
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-rb-text sm:text-3xl">
                Account &amp; Preferences
              </h1>
              <p className="mt-1 text-sm text-rb-muted max-w-xl">
                Keep your profile accurate — it directly affects who you match with.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-5">
          {/* ── LEFT: Profile data ── */}
          <div className="grid gap-4 content-start">
            <div className="rb-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-rb-primary" />
                  <div>
                    <h2 className="text-base font-bold text-rb-text">Preparation profile</h2>
                    <p className="text-xs text-rb-muted mt-0.5">Your role, experience, and goals for matching.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        id="profile-cancel-btn"
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1.5 rounded-xl border border-rb-border px-3 py-2 text-xs font-bold text-rb-muted hover:bg-rb-surface transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                      <button
                        id="profile-save-btn"
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 rounded-xl bg-rb-primary px-3 py-2 text-xs font-bold text-white hover:bg-rb-primary-dark transition-colors disabled:opacity-60"
                      >
                        {isSaving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      id="profile-edit-btn"
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-rb-border px-3 py-2 text-xs font-bold text-rb-text hover:bg-rb-surface transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit profile
                    </button>
                  )}
                </div>
              </div>

              {saveError && (
                <div className="mb-4 rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-4 py-3 text-sm text-rb-danger">
                  {saveError}
                </div>
              )}

              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditableField label="Role" value={user.role} fieldKey="role" isEditing={isEditing} editValue={editValues.role ?? ""} onChange={handleFieldChange} icon={<Briefcase className="h-3 w-3" />} />
                  <EditableField label="Specialization" value={user.specialization} fieldKey="specialization" isEditing={isEditing} editValue={editValues.specialization ?? ""} onChange={handleFieldChange} icon={<Target className="h-3 w-3" />} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditableField label="Experience" value={user.experience} fieldKey="experience" type="select" options={EXPERIENCE_OPTIONS} isEditing={isEditing} editValue={editValues.experience ?? "junior"} onChange={handleFieldChange} icon={<BadgeCheck className="h-3 w-3" />} />
                  <EditableField label="Domain" value={user.domain} fieldKey="domain" type="select" options={["tech", "non-tech"]} isEditing={isEditing} editValue={editValues.domain ?? "tech"} onChange={handleFieldChange} icon={<Globe className="h-3 w-3" />} />
                </div>
                {(user.domain === "tech" || editValues.domain === "tech") && (
                  <EditableField label="Primary area" value={user.primaryArea} fieldKey="primaryArea" isEditing={isEditing} editValue={editValues.primaryArea ?? ""} onChange={handleFieldChange} icon={<Link2 className="h-3 w-3" />} />
                )}
                {(user.domain === "non-tech" || editValues.domain === "non-tech") && (
                  <EditableField label="Area" value={user.area} fieldKey="area" isEditing={isEditing} editValue={editValues.area ?? ""} onChange={handleFieldChange} icon={<Link2 className="h-3 w-3" />} />
                )}
                <EditableField label="Goal" value={user.goal} fieldKey="goal" isEditing={isEditing} editValue={editValues.goal ?? ""} onChange={handleFieldChange} icon={<Target className="h-3 w-3" />} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditableField label="Daily goal (hrs)" value={user.dailyGoal !== null ? String(user.dailyGoal) : null} fieldKey="dailyGoal" type="select" options={DAILY_GOAL_OPTIONS.map(String)} isEditing={isEditing} editValue={editValues.dailyGoal ?? "1"} onChange={handleFieldChange} icon={<Clock className="h-3 w-3" />} />
                  <EditableField label="Availability" value={user.availabilityTime} fieldKey="availabilityTime" type="select" options={AVAILABILITY_OPTIONS} isEditing={isEditing} editValue={editValues.availabilityTime ?? "morning"} onChange={handleFieldChange} icon={<Clock className="h-3 w-3" />} />
                </div>
                <EditableField label="Availability frequency" value={user.availabilityFrequency} fieldKey="availabilityFrequency" isEditing={isEditing} editValue={editValues.availabilityFrequency ?? ""} onChange={handleFieldChange} icon={<Clock className="h-3 w-3" />} />
                <SkillsEditor skills={isEditing ? editSkills : (user.skills ?? [])} isEditing={isEditing} onChange={setEditSkills} />
              </div>
            </div>
          </div>

          {/* ── RIGHT: Stats + History ── */}
          <div className="grid gap-4 content-start">
            {/* Accountability stats */}
            <div className="rb-card">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-rb-primary" />
                <h3 className="text-base font-bold text-rb-text">Accountability stats</h3>
              </div>
              <p className="text-xs text-rb-muted mb-4">Read-only — managed by the system.</p>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rb-stat-cell">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-1.5">Streak</p>
                  <p className="text-3xl font-black text-rb-text">—</p>
                  <p className="text-xs text-rb-muted mt-1">View on dashboard</p>
                </div>
                <div className="rb-stat-cell">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-1.5">Match status</p>
                  <p className="text-sm font-semibold text-rb-text capitalize">{user.status ?? "waiting"}</p>
                </div>
                <div className="rb-stat-cell">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rb-muted mb-1.5">Onboarding</p>
                  <p className="text-sm font-semibold text-rb-text">
                    {user.onboardingCompleted ? "Complete" : "Incomplete"}
                  </p>
                </div>
              </div>
            </div>

            {/* Match history */}
            <MatchHistorySection user={user} onProfileChange={setUser} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
