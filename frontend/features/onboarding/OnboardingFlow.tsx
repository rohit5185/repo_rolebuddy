"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { getProfile } from "@/features/auth/auth.api";

import { StepAvailabilitySelection } from "./components/StepAvailabilitySelection";
import { StepDailyGoalSelection } from "./components/StepDailyGoalSelection";
import { StepExperienceSelection } from "./components/StepExperienceSelection";
import { StepWelcome } from "./components/StepWelcome";
import { submitOnboarding } from "./onboarding.api";
import type { AvailabilityOption, DailyGoalOption, DomainOption, ExperienceOption } from "./types";

type Option = {
  value: string;
  caption: string;
};

type FlowStep =
  | "welcome"
  | "domain"
  | "primaryArea"
  | "area"
  | "specialization"
  | "role"
  | "experience"
  | "skills"
  | "intent"
  | "goal"
  | "dailyGoal"
  | "frequency"
  | "availability"
  | "preferences"
  | "complete";

const DOMAIN_OPTIONS: Array<{ value: DomainOption; caption: string }> = [
  { value: "tech", caption: "Software, data, AI, cloud, security, and more" },
  { value: "non-tech", caption: "Sales, marketing, finance, HR, operations, and beyond" }
];

const TECH_PRIMARY_AREAS: Option[] = [
  { value: "Software Development", caption: "Apps, APIs, and full product engineering" },
  { value: "Data / Analytics", caption: "Data analysis, BI, and data platforms" },
  { value: "AI / Machine Learning", caption: "Applied AI, ML systems, and LLMs" },
  { value: "Cloud / DevOps / SRE", caption: "Infra, reliability, and delivery pipelines" },
  { value: "Cybersecurity", caption: "Security operations, testing, and compliance" },
  { value: "Product / UX / Design", caption: "Product, UX, and design functions" },
  { value: "QA / Testing", caption: "Manual and automated quality engineering" },
  { value: "IT / Support / Networking", caption: "IT operations and networking" },
  { value: "Embedded / IoT / Hardware", caption: "Embedded systems and hardware" }
];

const NON_TECH_AREAS: Option[] = [
  { value: "Sales", caption: "Revenue, outbound, and account growth" },
  { value: "Marketing", caption: "Brand, demand, and campaign execution" },
  { value: "Finance / Accounting", caption: "Financial planning, accounting, and reporting" },
  { value: "HR / People Operations", caption: "Talent, HR operations, and people programs" },
  { value: "Operations / Supply Chain", caption: "Execution, logistics, and supply chain" },
  { value: "Customer Support / Success", caption: "Support, retention, and customer outcomes" },
  { value: "Business / Strategy / Consulting", caption: "Business analysis and strategic delivery" },
  { value: "Content / Writing / Media", caption: "Writing, media, and communications" },
  { value: "Design / Creative", caption: "Creative and visual design disciplines" },
  { value: "Education / Training", caption: "Education, training, and coaching" },
  { value: "Healthcare / Wellness", caption: "Healthcare and wellness roles" },
  { value: "Legal / Compliance", caption: "Legal advisory and compliance" },
  { value: "Admin / Office Operations", caption: "Administrative and office operations" }
];

const TECH_SPECIALIZATIONS: Record<string, string[]> = {
  "Software Development": ["Frontend", "Backend", "Full Stack", "Mobile Development", "Game Development", "Blockchain / Web3"],
  "Data / Analytics": ["Data Analyst", "Data Engineer", "Data Scientist", "BI / Reporting", "Product Analyst"],
  "AI / Machine Learning": ["ML Engineer", "Data Scientist", "NLP Engineer", "Computer Vision", "GenAI / LLM"],
  "Cloud / DevOps / SRE": ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer", "Platform Engineer", "System Administrator"],
  Cybersecurity: ["Security Analyst", "SOC Analyst", "Penetration Tester", "Cloud Security", "GRC / Compliance"],
  "Product / UX / Design": ["Product Manager", "UI Designer", "UX Designer", "UX Researcher", "Product Designer"],
  "QA / Testing": ["Manual QA", "Automation QA", "Performance Testing", "SDET"],
  "IT / Support / Networking": ["IT Support", "Network Engineer", "System Engineer", "Helpdesk"],
  "Embedded / IoT / Hardware": ["Embedded Engineer", "Firmware Engineer", "Hardware Engineer", "IoT Engineer"]
};

const NON_TECH_SPECIALIZATIONS: Record<string, string[]> = {
  Sales: ["B2B Sales", "B2C Sales", "Inside Sales", "Field Sales", "Account Executive", "Business Development", "Sales Operations", "Pre-sales / Sales Engineer"],
  Marketing: ["Digital Marketing", "Performance Marketing", "SEO", "Content Marketing", "Social Media Marketing", "Brand Marketing", "Growth Marketing", "Email / CRM Marketing", "Product Marketing", "Marketing Operations"],
  "Finance / Accounting": ["Accountant", "Financial Analyst", "FP&A", "Tax", "Audit", "Payroll", "Accounts Payable / Receivable", "Treasury", "Investment / Equity Research", "Risk / Compliance"],
  "HR / People Operations": ["Recruiter", "Talent Acquisition", "HR Generalist", "HR Operations", "Payroll / Benefits", "Employee Relations", "L&D / Training", "Compensation & Benefits", "HR Business Partner"],
  "Operations / Supply Chain": ["Operations Analyst", "Operations Manager", "Supply Chain Analyst", "Procurement", "Logistics", "Inventory Management", "Warehouse Operations", "Process Improvement", "Program Operations"],
  "Customer Support / Success": ["Customer Support", "Customer Success Manager", "Technical Support", "Account Support", "Support Operations", "Retention / Renewals", "Client Services"],
  "Business / Strategy / Consulting": ["Business Analyst", "Strategy Analyst", "Management Consultant", "Operations Analyst", "Project Manager", "Program Manager", "Product Operations", "Chief of Staff"],
  "Content / Writing / Media": ["Content Writer", "Copywriter", "Editor", "Content Strategist", "Script Writer", "Journalist", "PR / Communications", "Video / Podcast Content", "Community Manager"],
  "Design / Creative": ["Graphic Designer", "Visual Designer", "Brand Designer", "UI/UX Designer", "Motion Designer", "Video Editor", "Illustrator", "Creative Strategist"],
  "Education / Training": ["Teacher", "Trainer", "Instructional Designer", "Academic Counselor", "Curriculum Developer", "Coach / Mentor", "EdTech Operations"],
  "Healthcare / Wellness": ["Nurse", "Medical Assistant", "Lab Technician", "Healthcare Administrator", "Pharmacist", "Therapist / Counselor", "Nutrition / Fitness Coach", "Clinic Operations"],
  "Legal / Compliance": ["Lawyer", "Legal Associate", "Paralegal", "Compliance Officer", "Contract Manager", "Risk Analyst", "Policy / Regulatory Specialist"],
  "Admin / Office Operations": ["Office Administrator", "Executive Assistant", "Receptionist", "Facility Management", "Admin Coordinator", "Travel / Calendar Management", "Document / Record Management"]
};

const TECH_INTENT_OPTIONS: Option[] = [
  { value: "Job search", caption: "Find new opportunities" },
  { value: "Referrals / Networking", caption: "Connect with peers and mentors" },
  { value: "Interview preparation", caption: "Practice and improve interview outcomes" },
  { value: "Career switch", caption: "Transition into a new role" },
  { value: "Study partner", caption: "Stay consistent with accountability" }
];

const TECH_GOAL_OPTIONS: Option[] = [
  { value: "Referrals", caption: "Get warm intros" },
  { value: "Mock interviews", caption: "Practice real interview rounds" },
  { value: "Resume review", caption: "Improve profile quality" },
  { value: "Study group", caption: "Join structured prep circles" },
  { value: "Projects / collaboration", caption: "Build together" }
];

const NON_TECH_GOAL_OPTIONS: Option[] = [
  { value: "Job search", caption: "Find and apply to target roles" },
  { value: "Referrals / Networking", caption: "Build a strong network" },
  { value: "Interview prep", caption: "Practice role-specific interviews" },
  { value: "Career switch", caption: "Move into a different function" },
  { value: "Study / Accountability partner", caption: "Stay on track consistently" },
  { value: "Freelance / Project work", caption: "Find collaboration opportunities" }
];

const FREQUENCY_OPTIONS: Option[] = [
  { value: "Daily", caption: "Highest consistency" },
  { value: "Few times a week", caption: "Balanced cadence" },
  { value: "Weekly", caption: "Steady weekly rhythm" },
  { value: "Occasionally", caption: "Flexible and lightweight" }
];

const TECH_PREFERENCE_OPTIONS: Option[] = [
  { value: "Same role", caption: "Similar role focus" },
  { value: "Same experience level", caption: "Aligned prep pace" },
  { value: "Same tech stack", caption: "Stack-specific discussions" },
  { value: "Same goal", caption: "Shared outcomes" },
  { value: "Mentors (more experienced)", caption: "Guidance from seniors" }
];

const NON_TECH_PREFERENCE_OPTIONS: Option[] = [
  { value: "Same role", caption: "Role-aligned partners" },
  { value: "Same domain", caption: "Function-level alignment" },
  { value: "Same experience level", caption: "Comparable prep intensity" },
  { value: "Mentor / senior", caption: "Mentorship support" },
  { value: "People preparing for same exam or interview", caption: "Aligned prep targets" },
  { value: "Same company type or industry", caption: "Shared context" }
];

const TECH_EXPERIENCE_OPTIONS: Array<{ value: ExperienceOption; title: string; hint: string }> = [
  { value: "fresher", title: "Beginner (0-1 yrs / student)", hint: "Build fundamentals and consistency." },
  { value: "junior", title: "Junior (1-3 yrs)", hint: "Strengthen practical delivery." },
  { value: "mid-level", title: "Mid-level (3-6 yrs)", hint: "Go deeper with ownership." },
  { value: "senior", title: "Senior (6+ yrs)", hint: "Lead with depth and impact." }
];

const NON_TECH_EXPERIENCE_OPTIONS: Array<{ value: ExperienceOption; title: string; hint: string }> = [
  { value: "student / fresher", title: "Student / Fresher", hint: "Start with core fundamentals." },
  { value: "beginner", title: "Beginner", hint: "Early stage with guided growth." },
  { value: "junior", title: "Junior", hint: "Hands-on role execution." },
  { value: "mid-level", title: "Mid-level", hint: "Independent delivery and ownership." },
  { value: "senior", title: "Senior", hint: "Strategic impact and mentorship." },
  { value: "manager", title: "Manager", hint: "Lead teams and outcomes." },
  { value: "lead / head", title: "Lead / Head", hint: "Drive vision and direction." }
];

const DAILY_GOAL_OPTIONS: Array<{ value: DailyGoalOption; title: string; hint: string }> = [
  { value: 1, title: "1", hint: "Steady consistency with one quality prep block." },
  { value: 2, title: "2", hint: "Balanced growth with two focused prep sessions." },
  { value: 3, title: "3+", hint: "High-intensity mode with three or more sessions." }
];

const AVAILABILITY_OPTIONS: Array<{ value: AvailabilityOption; title: string; hint: string }> = [
  { value: "morning", title: "Morning", hint: "Best for early momentum and deep focus." },
  { value: "afternoon", title: "Afternoon", hint: "Midday cadence with practical execution blocks." },
  { value: "night", title: "Night", hint: "Late prep sessions with uninterrupted cycles." }
];

function toOptions(values: string[]): Option[] {
  return values.map((value) => ({ value, caption: "" }));
}

function normalizeRoleInput(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function titleDomain(domain: DomainOption) {
  return domain === "tech" ? "Tech" : "Non-Tech";
}

function getFlowSteps(domain: DomainOption | null): FlowStep[] {
  if (!domain) {
    return ["welcome", "domain", "complete"];
  }
  if (domain === "tech") {
    return [
      "welcome", "domain", "primaryArea", "specialization", "role",
      "experience", "skills", "intent", "goal", "dailyGoal",
      "frequency", "availability", "preferences", "complete"
    ];
  }
  return [
    "welcome", "domain", "area", "specialization", "role",
    "experience", "skills", "goal", "dailyGoal", "frequency",
    "availability", "preferences", "complete"
  ];
}

// ─── Shared Back Button ────────────────────────────────────────────────────────
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl border border-[#c7c4d9]/40 bg-white/70 px-5 py-2.5 text-sm font-semibold text-[#464556] transition hover:bg-white hover:border-[#5755a4]/50 active:scale-95"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

// ─── Single-Select option step (auto-advance on tap) ──────────────────────────
type OptionStepProps = {
  stepLabel: string;
  title: string;
  subtitle: string;
  options: Option[];
  selected: string | null;
  onSelect: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

function OptionStep({ stepLabel, title, subtitle, options, selected, onSelect, onBack, onContinue }: OptionStepProps) {
  return (
    <section className="w-full p-5 sm:p-8">
      <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-[#3b2ae1]">{stepLabel}</p>
      <h2 className="mt-3 font-headline text-2xl font-black leading-tight text-[#1b1b24] sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-[#464556] sm:text-base">{subtitle}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSelect(option.value);
                requestAnimationFrame(() => setTimeout(() => onContinue(), 120));
              }}
              className={`rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                isSelected
                  ? "border-[#554bf9] bg-[#f0ecfa] shadow-[0_0_0_1px_rgba(85,75,249,0.25)]"
                  : "border-[#c7c4d9]/40 bg-white hover:border-[#5755a4]/50"
              }`}
            >
              <p className="font-headline text-base font-bold text-[#1b1b24]">{option.value}</p>
              {option.caption ? <p className="mt-1.5 text-xs uppercase tracking-[0.12em] text-[#777588]">{option.caption}</p> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <BackButton onClick={onBack} />
      </div>
    </section>
  );
}

// ─── Multi-Select step (explicit Continue button) ─────────────────────────────
type MultiSelectStepProps = {
  stepLabel: string;
  title: string;
  subtitle: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
};

function MultiSelectStep({
  stepLabel, title, subtitle, options, selected,
  onToggle, onBack, onContinue, continueLabel = "Continue"
}: MultiSelectStepProps) {
  return (
    <section className="w-full p-5 sm:p-8">
      <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-[#3b2ae1]">{stepLabel}</p>
      <h2 className="mt-3 font-headline text-2xl font-black leading-tight text-[#1b1b24] sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-[#464556] sm:text-base">{subtitle}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                isSelected
                  ? "border-[#554bf9] bg-[#f0ecfa] shadow-[0_0_0_1px_rgba(85,75,249,0.25)]"
                  : "border-[#c7c4d9]/40 bg-white hover:border-[#5755a4]/50"
              }`}
            >
              <p className="font-headline text-base font-bold text-[#1b1b24]">{option.value}</p>
              {option.caption ? <p className="mt-1.5 text-xs uppercase tracking-[0.12em] text-[#777588]">{option.caption}</p> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <BackButton onClick={onBack} />
        <button
          type="button"
          onClick={onContinue}
          className="rounded-xl bg-[linear-gradient(135deg,#3b2ae1,#554bf9)] px-6 py-2.5 font-label text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-90 active:scale-[0.98]"
        >
          {continueLabel}
        </button>
      </div>
    </section>
  );
}

// ─── Single-select Preferences (auto-advance on tap, no button) ───────────────
type PreferencesStepProps = {
  stepLabel: string;
  options: Option[];
  selected: string[];
  onSelect: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

function PreferencesStep({ stepLabel, options, selected, onSelect, onBack, onContinue }: PreferencesStepProps) {
  return (
    <section className="w-full p-5 sm:p-8">
      <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-[#3b2ae1]">{stepLabel}</p>
      <h2 className="mt-3 font-headline text-2xl font-black leading-tight text-[#1b1b24] sm:text-3xl">Who would you like to connect with?</h2>
      <p className="mt-2 text-sm text-[#464556] sm:text-base">Tap your preference — we'll move to the next step instantly.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSelect(option.value);
                requestAnimationFrame(() => setTimeout(() => onContinue(), 120));
              }}
              className={`rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                isSelected
                  ? "border-[#554bf9] bg-[#f0ecfa] shadow-[0_0_0_1px_rgba(85,75,249,0.25)]"
                  : "border-[#c7c4d9]/40 bg-white hover:border-[#5755a4]/50"
              }`}
            >
              <p className="font-headline text-base font-bold text-[#1b1b24]">{option.value}</p>
              {option.caption ? <p className="mt-1.5 text-xs uppercase tracking-[0.12em] text-[#777588]">{option.caption}</p> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <BackButton onClick={onBack} />
      </div>
    </section>
  );
}

// ─── Role Input Step ───────────────────────────────────────────────────────────
type RoleInputStepProps = {
  stepLabel: string;
  role: string;
  suggestions: string[];
  onChange: (value: string) => void;
  onSelectSuggestion: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

function RoleInputStep({ stepLabel, role, suggestions, onChange, onSelectSuggestion, onBack, onContinue }: RoleInputStepProps) {
  return (
    <section className="w-full p-5 sm:p-8">
      <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-[#3b2ae1]">{stepLabel}</p>
      <h2 className="mt-3 font-headline text-2xl font-black leading-tight text-[#1b1b24] sm:text-3xl">What exact role are you targeting?</h2>
      <p className="mt-2 text-sm text-[#464556] sm:text-base">Type your target role and use quick suggestions if helpful.</p>

      <div className="mt-6 rounded-2xl border border-[#c7c4d9]/30 bg-white p-4 sm:p-5">
        <Input
          value={role}
          onChange={(event) => onChange(event.target.value)}
          placeholder="e.g. React Frontend Developer"
          className="h-12 border-[#c7c4d9]/60"
          maxLength={80}
        />
        {suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSelectSuggestion(suggestion)}
                className="rounded-xl border border-[#c7c4d9]/50 bg-white px-3 py-2 text-xs font-semibold text-[#3b2ae1] transition hover:border-[#554bf9] active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <BackButton onClick={onBack} />
        <button
          type="button"
          onClick={onContinue}
          className="rounded-xl bg-[linear-gradient(135deg,#3b2ae1,#554bf9)] px-6 py-2.5 font-label text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-90 active:scale-[0.98]"
        >
          Continue →
        </button>
      </div>
    </section>
  );
}

// ─── Complete Step ─────────────────────────────────────────────────────────────
type CompleteStepProps = {
  onComplete: () => void;
  isSubmitting: boolean;
  formError: string | null;
  onBack: () => void;
};

function CompleteStep({ onComplete, isSubmitting, formError, onBack }: CompleteStepProps) {
  if (isSubmitting) {
    return (
      <section className="w-full p-8 sm:p-12 flex flex-col items-center text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-[#e4e1ef]" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#554bf9] animate-spin" />
          </div>
          <div className="max-w-xs">
            <p className="font-headline text-xl font-black text-[#1b1b24]">Setting up your profile…</p>
            <p className="mt-3 text-sm leading-6 text-[#777588]">
              We run on a free server that may need up to <strong>30 seconds</strong> to wake up.
              Hang tight — you will be redirected to your dashboard automatically.
            </p>
          </div>
          <div className="rounded-xl border border-[#554bf9]/20 bg-[#f0ecfa] px-4 py-3 max-w-xs w-full">
            <p className="text-xs font-semibold text-[#3b2ae1] tracking-wide animate-pulse">⏳ Please do not close this page</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full p-6 sm:p-10 flex flex-col items-center text-center">
      {/* Celebration icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#3b2ae1,#554bf9)] shadow-[0_8px_24px_rgba(85,75,249,0.35)] text-3xl">
        🎉
      </div>

      <h2 className="mt-5 font-headline text-2xl font-black leading-tight text-[#1b1b24] sm:text-3xl">
        You're all set!
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#464556] max-w-sm">
        Your profile is ready. We'll match you with an accountability partner preparing for the same role.
      </p>

      {/* Info cards */}
      <div className="mt-6 grid w-full max-w-sm gap-3 text-left">
        <div className="flex items-start gap-3 rounded-xl border border-[#c7c4d9]/40 bg-white p-4">
          <span className="text-lg leading-none mt-0.5">⚡</span>
          <div>
            <p className="text-sm font-semibold text-[#1b1b24]">Matching happens instantly</p>
            <p className="mt-0.5 text-xs text-[#777588]">You'll see a partner on your dashboard right away.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-[#c7c4d9]/40 bg-white p-4">
          <span className="text-lg leading-none mt-0.5">⏳</span>
          <div>
            <p className="text-sm font-semibold text-[#1b1b24]">Server may take ~30 sec to respond</p>
            <p className="mt-0.5 text-xs text-[#777588]">We're on a free tier — stay on this page after tapping Complete.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-[#c7c4d9]/40 bg-white p-4">
          <span className="text-lg leading-none mt-0.5">🔥</span>
          <div>
            <p className="text-sm font-semibold text-[#1b1b24]">Daily check-ins build your streak</p>
            <p className="mt-0.5 text-xs text-[#777588]">Show up every day — your partner is counting on you.</p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="mt-5 w-full max-w-sm rounded-xl border border-[#ba1a1a]/30 bg-[#fff5f5] px-4 py-3 text-left">
          <p className="text-sm font-medium text-[#ba1a1a]">{formError}</p>
          <p className="mt-1 text-xs text-[#ba1a1a]/70">Please try again. If the issue persists, refresh the page.</p>
        </div>
      )}

      <div className="mt-6 w-full max-w-sm">
        <button
          type="button"
          onClick={onComplete}
          className="w-full rounded-xl bg-[linear-gradient(135deg,#3b2ae1,#554bf9)] px-8 py-3.5 font-label text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-90 active:scale-[0.98] shadow-[0_8px_24px_rgba(85,75,249,0.35)]"
        >
          Complete Onboarding →
        </button>
      </div>

      <div className="mt-4">
        <BackButton onClick={onBack} />
      </div>
    </section>
  );
}

// ─── Main Flow ─────────────────────────────────────────────────────────────────
export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [domain, setDomain] = useState<DomainOption | null>(null);
  const [selectedPrimaryArea, setSelectedPrimaryArea] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedExperience, setSelectedExperience] = useState<ExperienceOption | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedDailyGoal, setSelectedDailyGoal] = useState<DailyGoalOption | null>(null);
  const [selectedAvailabilityFrequency, setSelectedAvailabilityFrequency] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityOption | null>(null);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const flowSteps = useMemo(() => getFlowSteps(domain), [domain]);
  const currentStep = flowSteps[step] ?? "welcome";
  // totalQuestions = all steps minus welcome and complete
  const totalQuestions = flowSteps.length - 2;
  // question steps list (excludes welcome + complete)
  const questionSteps = useMemo(
    () => flowSteps.filter((s) => s !== "welcome" && s !== "complete"),
    [flowSteps]
  );

  const specializationOptions = useMemo(() => {
    if (!domain) return [];
    if (domain === "tech") {
      if (!selectedPrimaryArea) return [];
      return toOptions(TECH_SPECIALIZATIONS[selectedPrimaryArea] ?? []);
    }
    if (!selectedArea) return [];
    return toOptions(NON_TECH_SPECIALIZATIONS[selectedArea] ?? []);
  }, [domain, selectedPrimaryArea, selectedArea]);

  const roleSuggestions = useMemo(() => {
    if (!selectedSpecialization) return [];
    const map: Record<string, string[]> = {
      Frontend: ["React Frontend Developer", "Next.js Frontend Engineer", "UI Engineer"],
      Backend: ["Node.js Backend Engineer", "Java Backend Engineer", "API Engineer"],
      "Full Stack": ["Full Stack Developer", "MERN Stack Developer", "Full Stack Engineer"],
      "Data Analyst": ["Data Analyst (SQL + Python)", "Business Data Analyst", "Analytics Specialist"],
      "DevOps Engineer": ["DevOps Engineer", "Cloud DevOps Engineer", "Platform DevOps Engineer"],
      "Performance Marketing": ["Performance Marketing Specialist", "Google Ads Specialist", "Paid Media Associate"],
      Recruiter: ["Talent Acquisition Specialist", "Recruiter", "HR Recruiter"]
    };
    return map[selectedSpecialization] ?? [selectedSpecialization];
  }, [selectedSpecialization]);

  const skillOptions = useMemo(() => {
    if (!selectedSpecialization) return [];
    const techSkills: Record<string, string[]> = {
      Frontend: ["React", "Next.js", "TypeScript", "JavaScript", "CSS", "Tailwind"],
      Backend: ["Node.js", "Express", "Java", "Spring Boot", "SQL", "MongoDB"],
      "Full Stack": ["React", "Node.js", "TypeScript", "REST APIs", "SQL", "MongoDB"],
      "Data Analyst": ["SQL", "Python", "Excel", "Power BI", "Tableau"],
      "DevOps Engineer": ["Docker", "Kubernetes", "CI/CD", "AWS", "Terraform", "Linux"]
    };
    const nonTechSkills: Record<string, string[]> = {
      "B2B Sales": ["CRM", "Lead Generation", "Cold Calling", "Negotiation", "Salesforce"],
      "Performance Marketing": ["Google Ads", "Meta Ads", "GA4", "A/B Testing", "Campaign Optimization"],
      "Financial Analyst": ["Excel", "Financial Modeling", "Power BI", "Forecasting"],
      Recruiter: ["Sourcing", "Screening", "Interviewing", "ATS", "Coordination"],
      "Content Writer": ["Copywriting", "SEO Writing", "Editing", "Research", "Storytelling"]
    };
    return toOptions((domain === "tech" ? techSkills : nonTechSkills)[selectedSpecialization] ?? [selectedSpecialization]);
  }, [domain, selectedSpecialization]);

  const experienceOptions = useMemo(
    () => (domain === "non-tech" ? NON_TECH_EXPERIENCE_OPTIONS : TECH_EXPERIENCE_OPTIONS),
    [domain]
  );

  // Scroll to top on every step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  // Guard step index within bounds
  useEffect(() => {
    if (step >= flowSteps.length) {
      setStep(Math.max(flowSteps.length - 1, 0));
    }
  }, [flowSteps, step]);

  // Auth check on mount
  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const profileResponse = await getProfile();
        if (!active) return;

        if (profileResponse.data.user.onboardingCompleted) {
          router.replace("/dashboard");
          return;
        }

        if (profileResponse.data.user.domain === "tech" || profileResponse.data.user.domain === "non-tech") {
          setDomain(profileResponse.data.user.domain);
        }
        if (profileResponse.data.user.primaryArea) setSelectedPrimaryArea(profileResponse.data.user.primaryArea);
        if (profileResponse.data.user.area) setSelectedArea(profileResponse.data.user.area);
        if (profileResponse.data.user.specialization) setSelectedSpecialization(profileResponse.data.user.specialization);
        if (profileResponse.data.user.role) setSelectedRole(profileResponse.data.user.role);
        if (profileResponse.data.user.experience) setSelectedExperience(profileResponse.data.user.experience as ExperienceOption);
        if (Array.isArray(profileResponse.data.user.skills)) setSelectedSkills(profileResponse.data.user.skills);
        if (profileResponse.data.user.intent) setSelectedIntent(profileResponse.data.user.intent);
        if (profileResponse.data.user.goal) setSelectedGoal(profileResponse.data.user.goal);
        if (profileResponse.data.user.dailyGoal === 1 || profileResponse.data.user.dailyGoal === 2 || profileResponse.data.user.dailyGoal === 3) {
          setSelectedDailyGoal(profileResponse.data.user.dailyGoal);
        }
        if (profileResponse.data.user.availabilityTime === "morning" || profileResponse.data.user.availabilityTime === "afternoon" || profileResponse.data.user.availabilityTime === "night") {
          setSelectedAvailability(profileResponse.data.user.availabilityTime);
        } else if (profileResponse.data.user.availability === "morning" || profileResponse.data.user.availability === "afternoon" || profileResponse.data.user.availability === "night") {
          setSelectedAvailability(profileResponse.data.user.availability as AvailabilityOption);
        }
        if (profileResponse.data.user.availabilityFrequency) setSelectedAvailabilityFrequency(profileResponse.data.user.availabilityFrequency);
        if (Array.isArray(profileResponse.data.user.preferences)) setSelectedPreferences(profileResponse.data.user.preferences);

        setIsCheckingAuth(false);
      } catch {
        if (!active) return;
        router.replace("/login");
      }
    }

    checkAccess();
    return () => { active = false; };
  }, [router]);

  function validateStep(stepName: FlowStep) {
    if (stepName === "domain" && !domain) return "Select your domain before continuing.";
    if (stepName === "primaryArea" && !selectedPrimaryArea) return "Select your primary tech area before continuing.";
    if (stepName === "area" && !selectedArea) return "Select your area before continuing.";
    if (stepName === "specialization" && !selectedSpecialization) return "Select your specialization before continuing.";
    if (stepName === "role" && !normalizeRoleInput(selectedRole)) return "Enter your exact role before continuing.";
    if (stepName === "experience" && !selectedExperience) return "Select your experience level before continuing.";
    if (stepName === "skills" && selectedSkills.length === 0) return "Select at least one skill before continuing.";
    if (stepName === "intent" && domain === "tech" && !selectedIntent) return "Select your intent before continuing.";
    if (stepName === "goal" && !selectedGoal) return "Select your immediate goal before continuing.";
    if (stepName === "dailyGoal" && !selectedDailyGoal) return "Select your daily goal before continuing.";
    if (stepName === "frequency" && !selectedAvailabilityFrequency) return "Select availability frequency before continuing.";
    if (stepName === "availability" && !selectedAvailability) return "Select availability time before continuing.";
    return null;
  }

  function goNext(skipValidation = false) {
    if (!skipValidation) {
      const error = validateStep(currentStep);
      if (error) { setFormError(error); return; }
    }
    setFormError(null);
    setStep((current) => Math.min(current + 1, flowSteps.length - 1));
  }

  function goBack() {
    setFormError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    if (!domain || !selectedExperience || !selectedDailyGoal || !selectedAvailability || !selectedAvailabilityFrequency || !selectedGoal) {
      setFormError("Complete all required steps before submitting.");
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError(null);
      await submitOnboarding({
        domain,
        primaryArea: domain === "tech" ? selectedPrimaryArea : null,
        area: domain === "non-tech" ? selectedArea : null,
        specialization: selectedSpecialization ?? "",
        role: normalizeRoleInput(selectedRole),
        experience: selectedExperience,
        skills: selectedSkills,
        intent: domain === "tech" ? selectedIntent : selectedGoal,
        goal: selectedGoal,
        dailyGoal: selectedDailyGoal,
        availabilityFrequency: selectedAvailabilityFrequency,
        availabilityTime: selectedAvailability,
        preferences: selectedPreferences,
        availability: selectedAvailability
      });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete onboarding. Please retry.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Loading gate ──────────────────────────────────────────────────────────────
  if (isCheckingAuth) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center rb-app-bg px-4">
        <div className="flex flex-col items-center gap-5 text-center max-w-xs">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-4 border-white/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin" />
          </div>
          <div>
            <p className="font-label text-sm font-bold tracking-[0.18em] text-white/90">LOADING</p>
            <p className="mt-2 text-xs text-white/60 leading-5">
              Our server may take up to 30 seconds to wake up. Please wait — do not close this page.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Header & progress bar state ───────────────────────────────────────────────
  const isWelcomeStep = currentStep === "welcome";
  const isCompleteStep = currentStep === "complete";
  const currentQuestionIndex = questionSteps.indexOf(currentStep as Exclude<FlowStep, "welcome" | "complete">);
  const currentQuestionNumber = currentQuestionIndex + 1;

  // ── Step label for question slides ────────────────────────────────────────────
  function stepLabel() {
    const qNum = currentQuestionNumber;
    const base = `Question ${qNum} of ${totalQuestions}`;
    const labels: Partial<Record<FlowStep, string>> = {
      domain: `${base} — Domain`,
      primaryArea: `${base} — Primary Area`,
      area: `${base} — Area`,
      specialization: `${base} — Specialization`,
      role: `${base} — Exact Role`,
      experience: `${base} — Experience`,
      skills: `${base} — Skills`,
      intent: `${base} — Intent`,
      goal: `${base} — Goal`,
      dailyGoal: `${base} — Daily Goal`,
      frequency: `${base} — Frequency`,
      availability: `${base} — Availability`,
      preferences: `${base} — Preferences`
    };
    return labels[currentStep] ?? base;
  }

  // ── Render current slide ──────────────────────────────────────────────────────
  function renderSlide() {
    if (currentStep === "welcome") return <StepWelcome onNext={goNext} />;

    if (currentStep === "complete") {
      return (
        <CompleteStep
          onComplete={handleSubmit}
          isSubmitting={isSubmitting}
          formError={formError}
          onBack={goBack}
        />
      );
    }

    const label = stepLabel();

    if (currentStep === "domain") {
      return (
        <OptionStep
          stepLabel={label}
          title="Which domain are you in?"
          subtitle="Pick Tech or Non-Tech to get a tailored onboarding flow."
          options={DOMAIN_OPTIONS.map((item) => ({ value: titleDomain(item.value), caption: item.caption }))}
          selected={domain ? titleDomain(domain) : null}
          onSelect={(value) => {
            const nextDomain: DomainOption = value === "Tech" ? "tech" : "non-tech";
            setDomain(nextDomain);
            setSelectedPrimaryArea(null);
            setSelectedArea(null);
            setSelectedSpecialization(null);
            setSelectedRole("");
            setSelectedSkills([]);
            setSelectedIntent(null);
            setSelectedGoal(null);
            setSelectedExperience(null);
            setSelectedPreferences([]);
            setFormError(null);
          }}
          onBack={goBack}
          onContinue={() => goNext(true)}
        />
      );
    }

    if (currentStep === "primaryArea") {
      return (
        <OptionStep
          stepLabel={label}
          title="Which area of tech are you focused on?"
          subtitle="This drives specialization and skills in the next steps."
          options={TECH_PRIMARY_AREAS}
          selected={selectedPrimaryArea}
          onSelect={(value) => {
            setSelectedPrimaryArea(value);
            setSelectedSpecialization(null);
            setSelectedRole("");
            setSelectedSkills([]);
            setFormError(null);
          }}
          onBack={goBack}
          onContinue={() => goNext(true)}
        />
      );
    }

    if (currentStep === "area") {
      return (
        <OptionStep
          stepLabel={label}
          title="Which area best describes your work?"
          subtitle="Choose the non-tech area that fits your target path."
          options={NON_TECH_AREAS}
          selected={selectedArea}
          onSelect={(value) => {
            setSelectedArea(value);
            setSelectedSpecialization(null);
            setSelectedRole("");
            setSelectedSkills([]);
            setFormError(null);
          }}
          onBack={goBack}
          onContinue={() => goNext(true)}
        />
      );
    }

    if (currentStep === "specialization") {
      return (
        <OptionStep
          stepLabel={label}
          title="Choose your specialization"
          subtitle="Role suggestions and skills adapt dynamically from this choice."
          options={specializationOptions}
          selected={selectedSpecialization}
          onSelect={(value) => {
            setSelectedSpecialization(value);
            setSelectedRole("");
            setSelectedSkills([]);
            setFormError(null);
          }}
          onBack={goBack}
          onContinue={() => goNext(true)}
        />
      );
    }

    if (currentStep === "role") {
      return (
        <RoleInputStep
          stepLabel={label}
          role={selectedRole}
          suggestions={roleSuggestions}
          onChange={(value) => { setSelectedRole(value); setFormError(null); }}
          onSelectSuggestion={(value) => {
            setSelectedRole(value);
            setFormError(null);
            requestAnimationFrame(() => setTimeout(() => goNext(), 120));
          }}
          onBack={goBack}
          onContinue={goNext}
        />
      );
    }

    if (currentStep === "experience") {
      return (
        <StepExperienceSelection
          stepLabel={label}
          options={experienceOptions}
          selectedExperience={selectedExperience}
          onSelect={(experience) => { setSelectedExperience(experience); setFormError(null); }}
          onBack={goBack}
          onNext={() => goNext(true)}
        />
      );
    }

    if (currentStep === "skills") {
      return (
        <MultiSelectStep
          stepLabel={label}
          title="Select your core skills"
          subtitle="Choose one or more skills to improve matching quality."
          options={skillOptions}
          selected={selectedSkills}
          onToggle={(value) => {
            setSelectedSkills((current) =>
              current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
            );
            setFormError(null);
          }}
          onBack={goBack}
          onContinue={goNext}
        />
      );
    }

    if (currentStep === "intent") {
      return (
        <OptionStep
          stepLabel={label}
          title="What are you looking for right now?"
          subtitle="Your intent helps personalize partner and activity matching."
          options={TECH_INTENT_OPTIONS}
          selected={selectedIntent}
          onSelect={(value) => { setSelectedIntent(value); setFormError(null); }}
          onBack={goBack}
          onContinue={() => goNext(true)}
        />
      );
    }

    if (currentStep === "goal") {
      return (
        <OptionStep
          stepLabel={label}
          title="What do you need help with most?"
          subtitle="Pick the most immediate outcome you want support on."
          options={domain === "tech" ? TECH_GOAL_OPTIONS : NON_TECH_GOAL_OPTIONS}
          selected={selectedGoal}
          onSelect={(value) => { setSelectedGoal(value); setFormError(null); }}
          onBack={goBack}
          onContinue={() => goNext(true)}
        />
      );
    }

    if (currentStep === "dailyGoal") {
      return (
        <StepDailyGoalSelection
          stepLabel={label}
          options={DAILY_GOAL_OPTIONS}
          selectedDailyGoal={selectedDailyGoal}
          onSelect={(dailyGoal) => { setSelectedDailyGoal(dailyGoal); setFormError(null); }}
          onBack={goBack}
          onNext={() => goNext(true)}
        />
      );
    }

    if (currentStep === "frequency") {
      return (
        <OptionStep
          stepLabel={label}
          title="How often do you want to connect?"
          subtitle="Set your expected cadence for accountability and prep."
          options={FREQUENCY_OPTIONS}
          selected={selectedAvailabilityFrequency}
          onSelect={(value) => { setSelectedAvailabilityFrequency(value); setFormError(null); }}
          onBack={goBack}
          onContinue={() => goNext(true)}
        />
      );
    }

    if (currentStep === "availability") {
      return (
        <StepAvailabilitySelection
          stepLabel={label}
          options={AVAILABILITY_OPTIONS}
          selectedAvailability={selectedAvailability}
          onSelect={(availability) => { setSelectedAvailability(availability); setFormError(null); }}
          onBack={goBack}
          onNext={() => goNext(true)}
        />
      );
    }

    if (currentStep === "preferences") {
      return (
        <PreferencesStep
          stepLabel={label}
          options={domain === "tech" ? TECH_PREFERENCE_OPTIONS : NON_TECH_PREFERENCE_OPTIONS}
          selected={selectedPreferences}
          onSelect={(value) => {
            setSelectedPreferences([value]);
            setFormError(null);
          }}
          onBack={goBack}
          onContinue={() => goNext(true)}
        />
      );
    }

    return null;
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-[100dvh] rb-app-bg px-4 py-6 text-[#1b1b24] sm:px-6">
      <div className="mx-auto w-full max-w-2xl">

        {/* Header */}
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-white/30 bg-white/70 px-4 py-3 shadow-[0_20px_40px_rgba(59,42,225,0.10)] backdrop-blur">
          <h1 className="font-headline text-lg font-extrabold text-[#3b2ae1] sm:text-xl">RoleBuddy</h1>
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-[#777588]">
            {isWelcomeStep
              ? "Welcome"
              : isCompleteStep
              ? "Complete"
              : `Question ${currentQuestionNumber} of ${totalQuestions}`}
          </p>
        </header>

        {/* Progress bar */}
        <section className="mb-5 flex gap-1.5">
          {isWelcomeStep ? (
            <div className="h-1.5 flex-1 rounded-full bg-[#4b3fef]/40" />
          ) : isCompleteStep ? (
            Array.from({ length: totalQuestions }, (_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full bg-[#b7f644]" />
            ))
          ) : (
            Array.from({ length: totalQuestions }, (_, i) => {
              const qNum = i + 1;
              const isCompleted = qNum < currentQuestionNumber;
              const isActive = qNum === currentQuestionNumber;
              return (
                <div
                  key={qNum}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    isCompleted ? "bg-[#b7f644]" : isActive ? "bg-[#4b3fef]" : "bg-white/40"
                  }`}
                />
              );
            })
          )}
        </section>

        {/* Card — content-sized (only current slide renders, no slider) */}
        <div className="rounded-3xl border border-white/30 bg-white/85 shadow-[0_24px_80px_rgba(59,42,225,0.10)] backdrop-blur-xl">
          {renderSlide()}
        </div>

        {/* Inline error below card (non-complete steps) */}
        {formError && currentStep !== "complete" ? (
          <p className="mt-3 text-sm font-medium text-[#ba1a1a]">{formError}</p>
        ) : null}

      </div>
    </main>
  );
}
