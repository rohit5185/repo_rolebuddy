"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BadgeCheck, CheckCircle2, FileText, Flag } from "lucide-react";

import { ExchangeTemplatePreviewCard } from "./exchangeTemplatePreview";
import type { ExchangeEntry, ExchangeProfile, ExchangeRecord, ExchangeType } from "./types";

const COMPANY_TYPES = [
  "Startup",
  "Product Company",
  "Service Company",
  "Agency",
  "Enterprise",
  "Government",
  "NGO",
  "Educational Institution",
  "Healthcare Organization",
  "Other"
] as const;

const DIFFICULTY_CHIPS = ["Easy", "Medium", "Hard"] as const;
const OUTCOME_CHIPS = ["Selected", "Rejected", "Pending", "Withdrew"] as const;
const EXPERIENCE_LEVEL_CHIPS = ["Intern", "Fresher", "Junior", "Mid-Level", "Senior", "Lead", "Manager"] as const;

const COMMON_ROLES = [
  "Frontend Engineer", "Backend Engineer", "Full Stack Engineer", "DevOps Engineer",
  "Data Scientist", "Data Analyst", "ML Engineer", "Mobile Developer", "QA Engineer",
  "Cloud Engineer", "Security Engineer", "UI/UX Designer", "Product Manager",
  "Project Manager", "Business Analyst", "Marketing Manager", "HR Manager",
  "Content Writer", "Sales Executive", "Operations Manager", "Financial Analyst"
] as const;

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Angular", "Vue.js", "Node.js", "Python", "Java",
  "C++", "Go", "Rust", "SQL", "MongoDB", "PostgreSQL", "Docker", "Kubernetes",
  "AWS", "Azure", "GCP", "Git", "REST API", "GraphQL", "HTML", "CSS",
  "Next.js", "Express.js", "Django", "Flask", "Spring Boot", "TensorFlow", "PyTorch"
] as const;

const ROUND_NUMBERS = ["1", "2", "3", "4", "5"] as const;
const ROLE_DIFFICULTY = ["Easy", "Moderate", "Hard", "Very Hard"] as const;

type ExchangeDrawerProps = {
  isOpen: boolean;
  exchange: ExchangeRecord | null;
  entries: ExchangeEntry[];
  profile: ExchangeProfile | null;
  onClose: () => void;
  onCreateExchange: (exchangeType: ExchangeType) => Promise<void> | void;
  onAccept: () => Promise<void> | void;
  onUnlockSensitive: () => Promise<void> | void;
  onShareEntry: (entryType: "role" | "interview" | "sensitive", content: string) => Promise<void> | void;
  onReport: (reason: string) => Promise<void> | void;
  onSaveProfile: (payload: {
    lastJobExperience?: string;
    lastInterviewExperience?: string;
    roleTransitionNotes?: string;
    roleTemplate?: ExchangeProfile["roleTemplate"];
    interviewTemplate?: ExchangeProfile["interviewTemplate"];
  }) => Promise<void> | void;
  onShareSensitive?: (template: { hrContact: string | null; recruiterDetails: string | null; referralPathway: string | null; internalProcessNotes: string | null; additionalNotes: string | null }) => Promise<void> | void;
};

function ChipRow({
  label,
  options,
  active,
  onPick
}: {
  label: string;
  options: readonly string[];
  active: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onPick(opt)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
              active === opt
                ? "border-rb-primary bg-rb-primary-light text-rb-primary"
                : "border-rb-border bg-white text-rb-muted hover:border-rb-primary/30"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectField({ label, options, value, onChange, placeholder }: {
  label: string; options: readonly string[]; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">{label}</p>
      <select
        className="w-full rounded-xl border border-rb-border px-3 py-2 text-sm bg-white appearance-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder ?? `Select ${label.toLowerCase()}`}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function RolePickerField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const isCustom = value !== "" && !COMMON_ROLES.includes(value as typeof COMMON_ROLES[number]);
  const [showCustom, setShowCustom] = useState(isCustom);

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">{label}</p>
      <select
        className="w-full rounded-xl border border-rb-border px-3 py-2 text-sm bg-white appearance-none"
        value={showCustom ? "__other__" : value}
        onChange={(e) => {
          if (e.target.value === "__other__") { setShowCustom(true); onChange(""); }
          else { setShowCustom(false); onChange(e.target.value); }
        }}
      >
        <option value="">Select role</option>
        {COMMON_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        <option value="__other__">Other (enter manually)</option>
      </select>
      {showCustom && (
        <input className="w-full rounded-xl border border-rb-border px-3 py-2 text-sm" placeholder="Enter your role" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function SkillsPickerField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const currentSkills = value.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">{label}</p>
      <select
        className="w-full rounded-xl border border-rb-border px-3 py-2 text-sm bg-white appearance-none"
        value=""
        onChange={(e) => {
          if (!e.target.value) return;
          const skill = e.target.value;
          if (!currentSkills.includes(skill)) {
            onChange(currentSkills.length ? `${value}, ${skill}` : skill);
          }
          e.target.value = "";
        }}
      >
        <option value="">Add a skill...</option>
        {COMMON_SKILLS.filter((s) => !currentSkills.includes(s)).map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input className="w-full rounded-xl border border-rb-border px-3 py-2 text-sm" placeholder="Skills (comma-separated)" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function hasRoleTemplate(profile: ExchangeProfile | null) {
  const tpl = profile?.roleTemplate;
  if (!tpl?.roleTitle?.trim()) return false;
  const hasNew = Boolean(
    tpl.mainResponsibilities ||
      tpl.typicalWorkflow ||
      tpl.whatHelpedMost ||
      tpl.adviceForSomeoneStartingToday ||
      tpl.toolsMethodsUsed
  );
  const hasLegacy = Boolean(
    (tpl.responsibilities && tpl.responsibilities.length) || tpl.workflow || tpl.preparationStrategy
  );
  return hasNew || hasLegacy;
}

function hasInterviewTemplate(profile: ExchangeProfile | null) {
  const tpl = profile?.interviewTemplate;
  if (!tpl) return false;
  const title = (tpl.roleInterviewedFor || tpl.roleTitle)?.trim();
  if (!title) return false;
  const hasNew = Boolean(
    tpl.roundTypes ||
      tpl.numberOfRounds ||
      tpl.mainTopicsEvaluated ||
      tpl.notableQuestionsOrTasks ||
      tpl.preparationAdvice ||
      tpl.whatHelpedMost ||
      tpl.rounds
  );
  const hasLegacy = Boolean(tpl.questionsTopics?.length);
  return hasNew || hasLegacy;
}

export function ExchangeDrawer({
  isOpen,
  exchange,
  entries,
  profile,
  onClose,
  onCreateExchange,
  onAccept,
  onUnlockSensitive,
  onReport,
  onSaveProfile,
  onShareEntry: _onShareEntry,
  onShareSensitive
}: ExchangeDrawerProps) {
  const [reportReason, setReportReason] = useState("");
  const [activeView, setActiveView] = useState<"templates" | "exchange">("templates");
  // Separate edit modes for each template
  const [roleEditMode, setRoleEditMode] = useState(false);
  const [interviewEditMode, setInterviewEditMode] = useState(false);
  // Save success toast
  const [saveSuccess, setSaveSuccess] = useState<"role" | "interview" | null>(null);
  const saveSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Validation errors
  const [roleValidationError, setRoleValidationError] = useState<string | null>(null);
  const [interviewValidationError, setInterviewValidationError] = useState<string | null>(null);
  // Shake animation for exchange tab when templates not ready
  const [exchangeTabShake, setExchangeTabShake] = useState(false);
  // Confirm accept dialog for user who already has template filled
  const [showConfirmAccept, setShowConfirmAccept] = useState(false);
  // Instruction banner shown when opened from "Confirm Exchange" in chat
  const [showFillInstruction, setShowFillInstruction] = useState(false);

  const roleTemplateReady = hasRoleTemplate(profile);
  const interviewTemplateReady = hasInterviewTemplate(profile);
  const templatesReady = roleTemplateReady && interviewTemplateReady;

  const [rTitle, setRTitle] = useState("");
  const [rIndustry, setRIndustry] = useState("");
  const [rCompanyType, setRCompanyType] = useState("");
  const [rExpLevel, setRExpLevel] = useState("");
  const [rMainResp, setRMainResp] = useState("");
  const [rWorkflow, setRWorkflow] = useState("");
  const [rTools, setRTools] = useState("");
  const [rSkillsReq, setRSkillsReq] = useState("");
  const [rMostSkills, setRMostSkills] = useState("");
  const [rWhatMatters, setRWhatMatters] = useState("");
  const [rHelped, setRHelped] = useState("");
  const [rMistakes, setRMistakes] = useState("");
  const [rDifficultyEnter, setRDifficultyEnter] = useState("");
  const [rAdvice, setRAdvice] = useState("");

  const [iRoleFor, setIRoleFor] = useState("");
  const [iIndustry, setIIndustry] = useState("");
  const [iCompanyType, setICompanyType] = useState("");
  const [iExpTarget, setIExpTarget] = useState("");
  const [iDate, setIDate] = useState("");
  const [iNumRounds, setINumRounds] = useState("");
  const [iRoundTypes, setIRoundTypes] = useState("");
  const [iDifficulty, setIDifficulty] = useState("");
  const [iDuration, setIDuration] = useState("");
  const [iTopics, setITopics] = useState("");
  const [iNotable, setINotable] = useState("");
  const [iOutcome, setIOutcome] = useState("");
  const [iRejectReason, setIRejectReason] = useState("");
  const [iHelped, setIHelped] = useState("");
  const [iDifferent, setIDifferent] = useState("");
  const [iFinalAdvice, setIFinalAdvice] = useState("");

  const [sHrContact, setSHrContact] = useState("");
  const [sRecruiter, setSRecruiter] = useState("");
  const [sReferral, setSReferral] = useState("");
  const [sProcess, setSProcess] = useState("");
  const [sNotes, setSNotes] = useState("");
  const [showSensitiveForm, setShowSensitiveForm] = useState(false);
  const [sensitiveError, setSensitiveError] = useState<string | null>(null);

  const canShareProfessional = Boolean(exchange?.unlockState.professionalUnlocked);
  const canShareSensitive = Boolean(exchange?.unlockState.sensitiveUnlocked);
  const contextualWarnings = exchange?.contextualWarnings ?? [];

  const exchangeLabel = useMemo(() => {
    if (!exchange) return null;
    return exchange.exchangeType === "role_experience" ? "Role exchange" : "Interview exchange";
  }, [exchange]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveView(templatesReady ? "exchange" : "templates");
    // Auto-open edit mode only for the template that isn't ready
    setRoleEditMode(!roleTemplateReady);
    setInterviewEditMode(!interviewTemplateReady);
    // Clear errors and success on open
    setRoleValidationError(null);
    setInterviewValidationError(null);
    setSaveSuccess(null);
    // Show instruction banner when: exchange exists, not yet accepted by self, and redirected here to fill template
    const needsAcceptAndHasExchange = !!(exchange && !exchange.approvals.professional.self);
    const isTargetTemplateReady = exchange?.exchangeType === "role_experience" ? roleTemplateReady : interviewTemplateReady;
    setShowFillInstruction(needsAcceptAndHasExchange && !isTargetTemplateReady);

    const rt = profile?.roleTemplate;
    setRTitle(rt?.roleTitle ?? "");
    setRIndustry(rt?.industryCompanyType ?? rt?.companyContext ?? "");
    setRCompanyType(rt?.companyType ?? "");
    setRExpLevel(rt?.experienceLevel ?? "");
    setRMainResp(rt?.mainResponsibilities ?? (rt?.responsibilities?.length ? rt.responsibilities.join(", ") : ""));
    setRWorkflow(rt?.typicalWorkflow ?? rt?.workflow ?? "");
    setRTools(rt?.toolsMethodsUsed ?? "");
    setRSkillsReq(rt?.skillsRequired ?? (rt?.requiredSkills?.length ? rt.requiredSkills.join(", ") : ""));
    setRMostSkills(rt?.mostImportantSkills ?? "");
    setRWhatMatters(rt?.whatMattersToSucceed ?? "");
    setRHelped(rt?.whatHelpedMost ?? "");
    setRMistakes(rt?.biggestMistakesToAvoid ?? "");
    setRDifficultyEnter(rt?.difficultyEnteringRole ?? "");
    setRAdvice(rt?.adviceForSomeoneStartingToday ?? rt?.preparationStrategy ?? "");

    const it = profile?.interviewTemplate;
    setIRoleFor(it?.roleInterviewedFor ?? it?.roleTitle ?? "");
    setIIndustry(it?.industryCompanyType ?? it?.companyContext ?? "");
    setICompanyType(it?.companyType ?? "");
    setIExpTarget(it?.experienceLevelTargeted ?? it?.experienceLevel ?? "");
    setIDate(it?.interviewDateOptional ?? "");
    setINumRounds(it?.numberOfRounds ?? "");
    setIRoundTypes(it?.roundTypes ?? it?.rounds ?? "");
    setIDifficulty(it?.overallDifficulty ?? it?.difficulty ?? "");
    setIDuration(it?.totalProcessDuration ?? "");
    setITopics(it?.mainTopicsEvaluated ?? (it?.questionsTopics?.length ? it.questionsTopics.join(", ") : ""));
    setINotable(it?.notableQuestionsOrTasks ?? "");
    setIOutcome(it?.outcome ?? "");
    setIRejectReason(it?.ifRejectedLikelyReasonOptional ?? it?.rejectionReasons ?? "");
    setIHelped(it?.whatHelpedMost ?? "");
    setIDifferent(it?.whatYouWouldDoDifferently ?? "");
    setIFinalAdvice(it?.finalAdviceForOthers ?? it?.preparationAdvice ?? "");
  }, [isOpen, profile, roleTemplateReady, interviewTemplateReady, exchange, templatesReady]);

  const verificationBadgeStyle =
    profile?.verificationStatus === "verified"
      ? "bg-rb-success-bg text-rb-success border border-[rgba(31,109,66,0.2)]"
      : profile?.verificationStatus === "unverified"
        ? "bg-rb-danger-bg text-rb-danger border border-[rgba(181,75,54,0.2)]"
        : "bg-rb-sub text-rb-muted border border-rb-border";

  if (!isOpen) return null;

  function showSaveToast(kind: "role" | "interview") {
    if (saveSuccessTimer.current) clearTimeout(saveSuccessTimer.current);
    setSaveSuccess(kind);
    saveSuccessTimer.current = setTimeout(() => setSaveSuccess(null), 3000);
  }

  async function handleSaveInterviewTemplate() {
    if (!iRoleFor.trim()) {
      setInterviewValidationError("Role interviewed for is required to save the interview template.");
      return;
    }
    setInterviewValidationError(null);
    const interviewTemplate: ExchangeProfile["interviewTemplate"] = {
      roleInterviewedFor: iRoleFor.trim() || null,
      industryCompanyType: iIndustry.trim() || null,
      companyType: iCompanyType.trim() || null,
      experienceLevelTargeted: iExpTarget.trim() || null,
      interviewDateOptional: iDate.trim() || null,
      numberOfRounds: iNumRounds.trim() || null,
      roundTypes: iRoundTypes.trim() || null,
      overallDifficulty: iDifficulty.trim() || null,
      totalProcessDuration: iDuration.trim() || null,
      mainTopicsEvaluated: iTopics.trim() || null,
      notableQuestionsOrTasks: iNotable.trim() || null,
      outcome: iOutcome.trim() || null,
      ifRejectedLikelyReasonOptional: iRejectReason.trim() || null,
      whatHelpedMost: iHelped.trim() || null,
      whatYouWouldDoDifferently: iDifferent.trim() || null,
      finalAdviceForOthers: iFinalAdvice.trim() || null
    };
    await onSaveProfile({ interviewTemplate });
    setInterviewEditMode(false);
    setShowFillInstruction(false);
    showSaveToast("interview");
  }

  async function handleSaveRoleTemplate() {
    if (!rTitle.trim()) {
      setRoleValidationError("Role title is required to save the role template.");
      return;
    }
    setRoleValidationError(null);
    const roleTemplate: ExchangeProfile["roleTemplate"] = {
      roleTitle: rTitle.trim() || null,
      industryCompanyType: rIndustry.trim() || null,
      companyType: rCompanyType.trim() || null,
      experienceLevel: rExpLevel.trim() || null,
      mainResponsibilities: rMainResp.trim() || null,
      typicalWorkflow: rWorkflow.trim() || null,
      toolsMethodsUsed: rTools.trim() || null,
      skillsRequired: rSkillsReq.trim() || null,
      mostImportantSkills: rMostSkills.trim() || null,
      whatMattersToSucceed: rWhatMatters.trim() || null,
      whatHelpedMost: rHelped.trim() || null,
      biggestMistakesToAvoid: rMistakes.trim() || null,
      difficultyEnteringRole: rDifficultyEnter.trim() || null,
      adviceForSomeoneStartingToday: rAdvice.trim() || null
    };
    await onSaveProfile({ roleTemplate });
    setRoleEditMode(false);
    setShowFillInstruction(false);
    showSaveToast("role");
  }

  const fieldClass = "w-full rounded-xl border border-rb-border px-3 py-2 text-sm";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-rb-muted";

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-rb-border bg-white p-4 shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-h-none sm:w-[440px] sm:rounded-l-3xl sm:rounded-tr-none">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-base font-black text-rb-text">Professional Exchange</h3>
          <button className="text-sm font-bold text-rb-muted" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rb-pill ${verificationBadgeStyle}`}>
            <BadgeCheck className="h-3.5 w-3.5" />
            {profile?.verificationStatus ?? "not_submitted"}
          </span>
          {exchangeLabel && (
            <span className="rb-pill bg-rb-primary-light text-rb-primary border border-[rgba(59,42,225,0.15)]">
              {exchangeLabel}
            </span>
          )}
        </div>

        <style>{`@keyframes rb-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}`}</style>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveView("templates")}
            className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-widest ${
              activeView === "templates"
                ? "border-[rgba(59,42,225,0.25)] bg-rb-primary-light text-rb-primary"
                : "border-rb-border bg-white text-rb-muted"
            }`}
          >
            Templates
          </button>
          <button
            type="button"
            style={exchangeTabShake ? { animation: "rb-shake 0.4s ease" } : {}}
            onClick={() => {
              if (!templatesReady) {
                setExchangeTabShake(true);
                setTimeout(() => setExchangeTabShake(false), 450);
                setActiveView("templates");
              } else {
                setActiveView("exchange");
              }
            }}
            className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-widest ${
              activeView === "exchange"
                ? "border-[rgba(59,42,225,0.25)] bg-rb-primary-light text-rb-primary"
                : "border-rb-border bg-white text-rb-muted"
            }`}
          >
            Exchange
          </button>
        </div>

        {/* ── Save success toast ── */}
        {saveSuccess && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[rgba(31,109,66,0.25)] bg-[#e6f5ec] px-3 py-2 text-xs font-semibold text-[#1f6d42]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {saveSuccess === "interview" ? "Interview template saved successfully!" : "Role template saved successfully!"}
          </div>
        )}

        {/* ── Instruction banner when coming from Confirm Exchange ── */}
        {showFillInstruction && activeView === "templates" && (
          <div className="mt-3 rounded-xl border border-[rgba(59,42,225,0.25)] bg-rb-primary-light px-3 py-2.5 text-xs text-rb-primary">
            <p className="font-black uppercase tracking-widest">Action required</p>
            <p className="mt-1 leading-5">
              Complete and save your <strong>{exchange?.exchangeType === "role_experience" ? "Role" : "Interview"} template</strong> below to confirm the exchange.
            </p>
          </div>
        )}

        {activeView === "templates" ? (
          <div className="mt-4 space-y-4">
            {/* ── Interview Experience Section ── */}
            <div className="rounded-2xl border border-rb-primary/20 bg-rb-primary-light/30 p-3">
              <div className="flex items-center justify-between">
                <p className={`flex items-center gap-2 ${labelClass} text-rb-primary`}>
                  <FileText className="h-4 w-4" /> Interview Experience
                </p>
                {interviewTemplateReady && !interviewEditMode && (
                  <button className="text-[10px] font-bold text-rb-primary underline" type="button" onClick={() => { setInterviewEditMode(true); setInterviewValidationError(null); }}>Edit</button>
                )}
              </div>

              {interviewTemplateReady && !interviewEditMode ? (
                <div className="mt-2">
                  <ExchangeTemplatePreviewCard kind="interview" template={profile?.interviewTemplate} title="Interview experience" />
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">Role interviewed for <span className="text-rb-danger">*</span></p>
                    <select className="w-full rounded-xl border border-rb-border px-3 py-2 text-sm bg-white appearance-none" value={!["", ...Array.from(["Frontend Engineer","Backend Engineer","Full Stack Engineer","DevOps Engineer","Data Scientist","Data Analyst","ML Engineer","Mobile Developer","QA Engineer","Cloud Engineer","Security Engineer","UI/UX Designer","Product Manager","Project Manager","Business Analyst","Marketing Manager","HR Manager","Content Writer","Sales Executive","Operations Manager","Financial Analyst"] as string[])].includes(iRoleFor) ? "__other__" : iRoleFor} onChange={(e) => { if (e.target.value === "__other__") { setIRoleFor(""); } else { setIRoleFor(e.target.value); } }}>
                      <option value="">Select role</option>
                      {(["Frontend Engineer","Backend Engineer","Full Stack Engineer","DevOps Engineer","Data Scientist","Data Analyst","ML Engineer","Mobile Developer","QA Engineer","Cloud Engineer","Security Engineer","UI/UX Designer","Product Manager","Project Manager","Business Analyst","Marketing Manager","HR Manager","Content Writer","Sales Executive","Operations Manager","Financial Analyst"] as string[]).map((r) => <option key={r} value={r}>{r}</option>)}
                      <option value="__other__">Other (enter manually)</option>
                    </select>
                    {(iRoleFor !== "" && !(["Frontend Engineer","Backend Engineer","Full Stack Engineer","DevOps Engineer","Data Scientist","Data Analyst","ML Engineer","Mobile Developer","QA Engineer","Cloud Engineer","Security Engineer","UI/UX Designer","Product Manager","Project Manager","Business Analyst","Marketing Manager","HR Manager","Content Writer","Sales Executive","Operations Manager","Financial Analyst"] as string[]).includes(iRoleFor)) && (
                      <input className={fieldClass} placeholder="Enter your role" value={iRoleFor} onChange={(e) => setIRoleFor(e.target.value)} />
                    )}
                  </div>
                  {interviewValidationError && (
                    <div className="flex items-center gap-2 rounded-lg border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-3 py-2 text-xs text-rb-danger">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {interviewValidationError}
                    </div>
                  )}
                  <input className={fieldClass} placeholder="Industry / company type" value={iIndustry} onChange={(e) => setIIndustry(e.target.value)} />
                  <SelectField label="Company type" options={COMPANY_TYPES} value={iCompanyType} onChange={setICompanyType} />
                  <ChipRow label="Experience level targeted" options={EXPERIENCE_LEVEL_CHIPS} active={iExpTarget} onPick={setIExpTarget} />
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">Interview date</p>
                    <input type="date" className={fieldClass} value={iDate} onChange={(e) => setIDate(e.target.value)} />
                  </div>
                  <SelectField label="Number of rounds" options={[...ROUND_NUMBERS, "Other"]} value={ROUND_NUMBERS.includes(iNumRounds as typeof ROUND_NUMBERS[number]) || iNumRounds === "Other" ? iNumRounds : ""} onChange={setINumRounds} />
                  {iNumRounds === "Other" && <input className={fieldClass} placeholder="Enter number of rounds" value="" onChange={(e) => setINumRounds(e.target.value)} />}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">Round types (comma-separated)</p>
                    <input className={fieldClass} placeholder={iNumRounds && Number(iNumRounds) > 0 ? Array.from({length: Math.min(Number(iNumRounds) || 1, 5)}, (_, i) => `Round ${i+1}`).join(", ") : "e.g. Screening, Technical, HR"} value={iRoundTypes} onChange={(e) => setIRoundTypes(e.target.value)} />
                  </div>
                  <ChipRow label="Overall difficulty" options={DIFFICULTY_CHIPS} active={iDifficulty} onPick={setIDifficulty} />
                  <input className={fieldClass} placeholder="Total process duration (e.g. 2 weeks)" value={iDuration} onChange={(e) => setIDuration(e.target.value)} />
                  <textarea className={fieldClass} rows={2} placeholder="Main topics evaluated" value={iTopics} onChange={(e) => setITopics(e.target.value)} />
                  <textarea className={fieldClass} rows={2} placeholder="Notable questions or tasks" value={iNotable} onChange={(e) => setINotable(e.target.value)} />
                  <ChipRow label="Outcome" options={OUTCOME_CHIPS} active={iOutcome} onPick={setIOutcome} />
                  <textarea className={fieldClass} rows={2} placeholder="If rejected, likely reason (optional)" value={iRejectReason} onChange={(e) => setIRejectReason(e.target.value)} />
                  <textarea className={fieldClass} rows={2} placeholder="What helped most" value={iHelped} onChange={(e) => setIHelped(e.target.value)} />
                  <textarea className={fieldClass} rows={2} placeholder="What you would do differently" value={iDifferent} onChange={(e) => setIDifferent(e.target.value)} />
                  <textarea className={fieldClass} rows={2} placeholder="Final advice for others" value={iFinalAdvice} onChange={(e) => setIFinalAdvice(e.target.value)} />
                  <div className="flex gap-2">
                    <button className="rb-button-primary flex-1" type="button" onClick={handleSaveInterviewTemplate}>Save Interview Template</button>
                    {interviewTemplateReady && <button className="rb-button-secondary px-3" type="button" onClick={() => { setInterviewEditMode(false); setInterviewValidationError(null); }}>Cancel</button>}
                  </div>
                </div>
              )}
            </div>

            {/* ── Role Experience Section ── */}
            <div className="rounded-2xl border border-rb-border p-3">
              <div className="flex items-center justify-between">
                <p className={`flex items-center gap-2 ${labelClass}`}>
                  <FileText className="h-4 w-4 text-rb-primary" /> Role Experience
                </p>
                {roleTemplateReady && !roleEditMode && (
                  <button className="text-[10px] font-bold text-rb-primary underline" type="button" onClick={() => { setRoleEditMode(true); setRoleValidationError(null); }}>Edit</button>
                )}
              </div>

              {roleTemplateReady && !roleEditMode ? (
                <div className="mt-2">
                  <ExchangeTemplatePreviewCard kind="role" template={profile?.roleTemplate} title="Role experience" />
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">Role title <span className="text-rb-danger">*</span></p>
                    <select className="w-full rounded-xl border border-rb-border px-3 py-2 text-sm bg-white appearance-none" value={!["", ...COMMON_ROLES as unknown as string[]].includes(rTitle) ? "__other__" : rTitle} onChange={(e) => { if (e.target.value === "__other__") { setRTitle(""); } else { setRTitle(e.target.value); } }}>
                      <option value="">Select role</option>
                      {COMMON_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      <option value="__other__">Other (enter manually)</option>
                    </select>
                    {(rTitle !== "" && !(COMMON_ROLES as unknown as string[]).includes(rTitle)) && (
                      <input className={fieldClass} placeholder="Enter your role title" value={rTitle} onChange={(e) => setRTitle(e.target.value)} />
                    )}
                  </div>
                  {roleValidationError && (
                    <div className="flex items-center gap-2 rounded-lg border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-3 py-2 text-xs text-rb-danger">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {roleValidationError}
                    </div>
                  )}
                  <input className={fieldClass} placeholder="Industry / company type" value={rIndustry} onChange={(e) => setRIndustry(e.target.value)} />
                  <SelectField label="Company type" options={COMPANY_TYPES} value={rCompanyType} onChange={setRCompanyType} />
                  <ChipRow label="Your experience level" options={EXPERIENCE_LEVEL_CHIPS} active={rExpLevel} onPick={setRExpLevel} />
                  <textarea className={fieldClass} rows={2} placeholder="Main responsibilities" value={rMainResp} onChange={(e) => setRMainResp(e.target.value)} />
                  <textarea className={fieldClass} rows={2} placeholder="Typical workflow" value={rWorkflow} onChange={(e) => setRWorkflow(e.target.value)} />
                  <textarea className={fieldClass} rows={2} placeholder="Tools / methods used" value={rTools} onChange={(e) => setRTools(e.target.value)} />
                  <SkillsPickerField label="Skills required" value={rSkillsReq} onChange={setRSkillsReq} />
                  <SkillsPickerField label="Most important skills" value={rMostSkills} onChange={setRMostSkills} />
                  <textarea className={fieldClass} rows={2} placeholder="What matters most to succeed" value={rWhatMatters} onChange={(e) => setRWhatMatters(e.target.value)} />
                  <textarea className={fieldClass} rows={2} placeholder="What helped most" value={rHelped} onChange={(e) => setRHelped(e.target.value)} />
                  <textarea className={fieldClass} rows={2} placeholder="Biggest mistakes to avoid" value={rMistakes} onChange={(e) => setRMistakes(e.target.value)} />
                  <SelectField label="Difficulty of entering the role" options={ROLE_DIFFICULTY} value={rDifficultyEnter} onChange={setRDifficultyEnter} />
                  <textarea className={fieldClass} rows={2} placeholder="Advice for someone starting today" value={rAdvice} onChange={(e) => setRAdvice(e.target.value)} />
                  <div className="flex gap-2">
                    <button className="rb-button-primary flex-1" type="button" onClick={handleSaveRoleTemplate}>Save Role Template</button>
                    {roleTemplateReady && <button className="rb-button-secondary px-3" type="button" onClick={() => { setRoleEditMode(false); setRoleValidationError(null); }}>Cancel</button>}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {!templatesReady && (
              <div className="rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-3 py-2 text-xs text-rb-danger">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Templates required</p>
                    <p className="mt-0.5">Save both templates first to request an exchange.</p>
                    <button
                      type="button"
                      className="mt-1.5 font-bold underline"
                      onClick={() => setActiveView("templates")}
                    >
                      → Go to Templates
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!exchange ? (
              <div className="space-y-2">
                <button
                  className="rb-button-primary w-full"
                  type="button"
                  onClick={() => {
                    if (!interviewTemplateReady) { setActiveView("templates"); return; }
                    void onCreateExchange("interview_experience");
                  }}
                  disabled={!interviewTemplateReady}
                >
                  Exchange interview experience
                </button>
                <button
                  className="rb-button-secondary w-full"
                  type="button"
                  onClick={() => {
                    if (!roleTemplateReady) { setActiveView("templates"); return; }
                    void onCreateExchange("role_experience");
                  }}
                  disabled={!roleTemplateReady}
                >
                  Exchange role experience
                </button>
                <p className="text-xs text-rb-muted">Sends a request. When both accept, templates post in chat.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contextualWarnings.length > 0 && (
                  <div className="rounded-xl border border-rb-border bg-rb-surface p-3 text-xs text-rb-muted">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">Checks</p>
                    <div className="mt-2 space-y-2">
                      {contextualWarnings.slice(0, 4).map((warning) => (
                        <div key={warning} className="flex items-start gap-2 text-rb-danger">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!exchange.unlockState.professionalUnlocked && (
                  <div className="rounded-xl border border-dashed border-rb-border bg-rb-surface p-3 text-xs text-rb-muted">
                    {exchange.approvals.professional.self
                      ? "Waiting for your partner to accept…"
                      : "Your partner requested an exchange. Accept to post both templates in chat."}
                  </div>
                )}

                {/* Confirm accept dialog (shown inline when template already ready) */}
                {showConfirmAccept && (
                  <div className="rounded-xl border border-[rgba(59,42,225,0.25)] bg-rb-primary-light p-3 space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-rb-primary">Confirm exchange</p>
                    <p className="text-xs text-rb-text leading-5">Your template will be shared with your partner and their template will appear in chat. Are you sure?</p>
                    <div className="flex gap-2">
                      <button className="rb-button-primary flex-1 !py-2 text-xs" type="button" onClick={() => { setShowConfirmAccept(false); void onAccept(); }}>Yes, share my template</button>
                      <button className="rb-button-secondary px-3 !py-2 text-xs" type="button" onClick={() => setShowConfirmAccept(false)}>Cancel</button>
                    </div>
                  </div>
                )}

                {!exchange.unlockState.professionalUnlocked && !exchange.approvals.professional.self && !showConfirmAccept && (
                  <button
                    className="rb-button-primary w-full"
                    type="button"
                    onClick={() => {
                      const isTargetTemplateReady = exchange.exchangeType === "role_experience" ? roleTemplateReady : interviewTemplateReady;
                      if (!isTargetTemplateReady) {
                        setActiveView("templates");
                        setShowFillInstruction(true);
                        if (exchange.exchangeType === "role_experience") setRoleEditMode(true);
                        else setInterviewEditMode(true);
                      } else {
                        setShowConfirmAccept(true);
                      }
                    }}
                  >
                    {(() => {
                      const isTargetTemplateReady = exchange.exchangeType === "role_experience" ? roleTemplateReady : interviewTemplateReady;
                      return isTargetTemplateReady ? "Accept exchange" : "Enter template to accept";
                    })()}
                  </button>
                )}

                {exchange.unlockState.professionalUnlocked && (
                  <div className="rounded-xl border border-rb-border bg-rb-surface p-3 text-xs space-y-3">
                    <p className="text-rb-muted">
                      ✓ Templates shared in chat.{" "}
                      <button
                        type="button"
                        className="font-bold text-rb-primary underline"
                        onClick={() => setActiveView("templates")}
                      >
                        View / edit templates
                      </button>
                    </p>

                    {/* ── Start another exchange ── */}
                    <div className="border-t border-rb-border pt-3 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">Start another exchange</p>
                      <button
                        className="rb-button-primary w-full"
                        type="button"
                        onClick={() => {
                          if (!interviewTemplateReady) { setActiveView("templates"); return; }
                          void onCreateExchange("interview_experience");
                        }}
                        disabled={!interviewTemplateReady}
                      >
                        Exchange interview experience
                      </button>
                      <button
                        className="rb-button-secondary w-full"
                        type="button"
                        onClick={() => {
                          if (!roleTemplateReady) { setActiveView("templates"); return; }
                          void onCreateExchange("role_experience");
                        }}
                        disabled={!roleTemplateReady}
                      >
                        Exchange role experience
                      </button>
                      <p className="text-[10px] text-rb-muted">No limit — share as many times as you like.</p>
                    </div>
                  </div>
                )}

                {/* ── Sensitive exchange section ── */}
                {exchange.unlockState.professionalUnlocked && (() => {
                  const relevanceScore = exchange.relevance?.score ?? 0;
                  const isCompatible = relevanceScore >= 50;

                  if (!isCompatible) {
                    return (
                      <div className="rounded-xl border border-rb-border bg-rb-surface px-3 py-2.5 text-xs text-rb-muted">
                        <p className="font-black uppercase tracking-widest text-rb-muted">Sensitive Exchange</p>
                        <p className="mt-1 leading-5">
                          Sensitive information sharing is only available for users with <strong>50%+ role compatibility</strong>. Your match score is <strong>{relevanceScore}%</strong> — not compatible enough for this feature.
                        </p>
                      </div>
                    );
                  }

                  if (!exchange.unlockState.sensitiveUnlocked) {
                    return (
                      <div className="space-y-2">
                        {exchange.approvals.sensitive.self && !exchange.unlockState.sensitiveUnlocked && (
                          <div className="rounded-xl border border-dashed border-rb-border bg-rb-surface px-3 py-2 text-xs text-rb-muted">
                            Waiting for your partner to agree to the sensitive exchange…
                          </div>
                        )}
                        {!exchange.approvals.sensitive.self && (
                          <button className="rb-button-secondary w-full" type="button" onClick={onUnlockSensitive}>
                            Request sensitive info exchange
                          </button>
                        )}
                        {!exchange.approvals.sensitive.self && exchange.approvals.sensitive.partner && (
                          <p className="text-xs text-rb-primary font-semibold">Your partner wants to exchange sensitive info too — click above to agree.</p>
                        )}
                      </div>
                    );
                  }

                  // Sensitive unlocked — show mutual submit form
                  return (
                    <div className="space-y-2">
                      {canShareSensitive && !showSensitiveForm && (
                        <div className="space-y-2">
                          <div className="rounded-xl border border-[rgba(59,42,225,0.2)] bg-rb-primary-light px-3 py-2 text-xs text-rb-primary">
                            Both agreed. Submit your sensitive info — it will only be revealed to your partner <strong>after they submit theirs too</strong>. Both sides are revealed simultaneously.
                          </div>
                          <button className="rb-button-primary w-full" type="button" onClick={() => { setSensitiveError(null); setShowSensitiveForm(true); }}>
                            Submit my sensitive info
                          </button>
                        </div>
                      )}
                      {canShareSensitive && showSensitiveForm && (
                        <div className="rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg/30 p-3 space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-rb-danger">Sensitive Info — Mutual Reveal</p>
                          <p className="text-xs text-rb-muted leading-5">Your details are held privately until your partner also submits. Both are revealed at the same time.</p>
                          {sensitiveError && (
                            <div className="flex items-center gap-2 rounded-lg border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg px-3 py-2 text-xs text-rb-danger">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {sensitiveError}
                            </div>
                          )}
                          <input className={fieldClass} placeholder="HR contact" value={sHrContact} onChange={(e) => setSHrContact(e.target.value)} />
                          <input className={fieldClass} placeholder="Recruiter details" value={sRecruiter} onChange={(e) => setSRecruiter(e.target.value)} />
                          <input className={fieldClass} placeholder="Referral pathway" value={sReferral} onChange={(e) => setSReferral(e.target.value)} />
                          <textarea className={fieldClass} rows={2} placeholder="Internal process notes" value={sProcess} onChange={(e) => setSProcess(e.target.value)} />
                          <textarea className={fieldClass} rows={2} placeholder="Additional notes" value={sNotes} onChange={(e) => setSNotes(e.target.value)} />
                          <button
                            className="rb-button-primary w-full"
                            type="button"
                            onClick={async () => {
                              if (!onShareSensitive) return;
                              const hasAny = sHrContact.trim() || sRecruiter.trim() || sReferral.trim() || sProcess.trim() || sNotes.trim();
                              if (!hasAny) { setSensitiveError("Please fill at least one field."); return; }
                              try {
                                setSensitiveError(null);
                                await onShareSensitive({
                                  hrContact: sHrContact.trim() || null,
                                  recruiterDetails: sRecruiter.trim() || null,
                                  referralPathway: sReferral.trim() || null,
                                  internalProcessNotes: sProcess.trim() || null,
                                  additionalNotes: sNotes.trim() || null,
                                });
                                setSHrContact(""); setSRecruiter(""); setSReferral(""); setSProcess(""); setSNotes("");
                                setShowSensitiveForm(false);
                              } catch (err) {
                                setSensitiveError(err instanceof Error ? err.message : "Could not submit. Please try again.");
                              }
                            }}
                          >
                            Submit & wait for partner
                          </button>
                          <button className="rb-button-secondary w-full" type="button" onClick={() => { setShowSensitiveForm(false); setSensitiveError(null); }}>Cancel</button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg p-3">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rb-danger">
                    <Flag className="h-3.5 w-3.5" />
                    Report abuse
                  </p>
                  <textarea
                    className="mt-2 w-full rounded-xl border border-[rgba(181,75,54,0.25)] bg-white p-2 text-sm"
                    placeholder="Reason (required)"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <button
                    className="mt-2 rb-button-secondary w-full !text-rb-danger !bg-white"
                    type="button"
                    onClick={() => {
                      if (!reportReason.trim()) return;
                      void onReport(reportReason.trim());
                      setReportReason("");
                    }}
                  >
                    Submit report
                  </button>
                </div>

                {entries.length > 0 && (
                  <div className="rounded-xl border border-rb-border bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">Exchange log</p>
                    <div className="mt-2 space-y-2">
                      {entries.slice(-3).map((entry) => (
                        <div key={entry.id} className="rounded-lg bg-rb-surface p-2 text-xs">
                          <p className="font-semibold text-rb-text">
                            {entry.entryType} ({entry.visibilityLayer})
                          </p>
                          <p className="mt-1 text-rb-muted">{entry.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
