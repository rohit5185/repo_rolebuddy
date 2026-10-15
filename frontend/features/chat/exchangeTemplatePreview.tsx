"use client";

import type { ExchangeProfile } from "./types";

type TemplateKind = "role" | "interview";

function line(label: string, value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string" && value.trim()) return `${label}: ${value.trim()}`;
  if (Array.isArray(value) && value.length) return `${label}: ${value.map((v) => String(v).trim()).filter(Boolean).join(", ")}`;
  return null;
}

export function pickTemplatePreviewLines(
  template: Record<string, unknown> | null | undefined,
  kind: TemplateKind
): string[] {
  if (!template) return [];
  const out: string[] = [];
  const push = (label: string, key: string) => {
    const l = line(label, template[key]);
    if (l) out.push(l);
  };

  if (kind === "role") {
    push("Role title", "roleTitle");
    push("Industry / company type", "industryCompanyType");
    push("Company type", "companyType");
    push("Experience level", "experienceLevel");
    push("Main responsibilities", "mainResponsibilities");
    push("Typical workflow", "typicalWorkflow");
    push("Tools / methods used", "toolsMethodsUsed");
    push("Skills required", "skillsRequired");
    push("Most important skills", "mostImportantSkills");
    push("What matters most to succeed", "whatMattersToSucceed");
    push("What helped most", "whatHelpedMost");
    push("Biggest mistakes to avoid", "biggestMistakesToAvoid");
    push("Difficulty of entering the role", "difficultyEnteringRole");
    push("Advice for someone starting today", "adviceForSomeoneStartingToday");
    // legacy
    push("Context", "companyContext");
    push("Workflow", "workflow");
    push("Preparation strategy", "preparationStrategy");
    push("Responsibilities", "responsibilities");
    push("Required skills", "requiredSkills");
  } else {
    push("Role interviewed for", "roleInterviewedFor");
    push("Role title", "roleTitle");
    push("Industry / company type", "industryCompanyType");
    push("Company type", "companyType");
    push("Experience level targeted", "experienceLevelTargeted");
    push("Experience level", "experienceLevel");
    push("Interview date", "interviewDateOptional");
    push("Number of rounds", "numberOfRounds");
    push("Round types", "roundTypes");
    push("Rounds", "rounds");
    push("Overall difficulty", "overallDifficulty");
    push("Difficulty", "difficulty");
    push("Total process duration", "totalProcessDuration");
    push("Main topics evaluated", "mainTopicsEvaluated");
    push("Notable questions or tasks", "notableQuestionsOrTasks");
    push("Outcome", "outcome");
    push("If rejected, likely reason", "ifRejectedLikelyReasonOptional");
    push("Rejection reasons", "rejectionReasons");
    push("What helped most", "whatHelpedMost");
    push("What you would do differently", "whatYouWouldDoDifferently");
    push("Final advice for others", "finalAdviceForOthers");
    push("Preparation advice", "preparationAdvice");
    push("Question topics", "questionsTopics");
  }

  const seen = new Set<string>();
  return out.filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}

export function ExchangeTemplatePreviewCard({
  kind,
  template,
  title
}: {
  kind: TemplateKind;
  template: ExchangeProfile["roleTemplate"] | ExchangeProfile["interviewTemplate"] | null | undefined;
  title: string;
}) {
  const lines = pickTemplatePreviewLines((template ?? null) as Record<string, unknown> | null, kind);

  if (!template || lines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-rb-border bg-rb-surface p-3 text-xs text-rb-muted">
        No template saved yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rb-border bg-white p-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-rb-muted">{title}</p>
      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-rb-text">
        {lines.map((item) => (
          <li key={item} className="text-rb-secondary">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
