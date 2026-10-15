"use client";

import { useMemo, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";

import {
  createInterviewTemplate,
  deleteInterviewTemplate,
  duplicateInterviewTemplate,
  updateInterviewTemplate
} from "./interview.api";
import type { InterviewTemplate } from "./types";

type EditableQuestion = {
  question: string;
  type: string;
  followUpsText: string;
  expectedTopicsText: string;
  notes: string;
};

type EditableTemplate = {
  id?: string;
  title: string;
  domain: "tech" | "non-tech" | "any";
  role: string;
  type: "technical" | "hr" | "behavioral" | "mixed" | "resume_round";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: number;
  visibility: "public" | "private";
  tagsText: string;
  questions: EditableQuestion[];
};

const emptyTemplate: EditableTemplate = {
  title: "",
  domain: "tech",
  role: "",
  type: "technical",
  difficulty: "beginner",
  estimatedDuration: 30,
  visibility: "private",
  tagsText: "",
  questions: [{ question: "", type: "technical", followUpsText: "", expectedTopicsText: "", notes: "" }]
};

function fromTemplate(t: InterviewTemplate): EditableTemplate {
  return {
    id: t.id,
    title: t.title,
    domain: t.domain,
    role: t.role ?? "",
    type: t.type,
    difficulty: t.difficulty,
    estimatedDuration: t.estimatedDuration,
    visibility: t.visibility === "public" ? "public" : "private",
    tagsText: (t.tags ?? []).join(", "),
    questions: (t.questions ?? []).map((q) => ({
      question: q.question,
      type: q.type,
      followUpsText: (q.followUps ?? []).join("\n"),
      expectedTopicsText: (q.expectedTopics ?? []).join(", "),
      notes: q.notes ?? ""
    }))
  };
}

export function InterviewTemplateManager({
  myTemplates,
  publicTemplates,
  onUpdated
}: {
  myTemplates: InterviewTemplate[];
  publicTemplates: InterviewTemplate[];
  onUpdated: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState<EditableTemplate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!editing) return false;
    return Boolean(editing.title.trim() && editing.questions.some((q) => q.question.trim()));
  }, [editing]);

  async function handleSave() {
    if (!editing || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title: editing.title.trim(),
        domain: editing.domain,
        role: editing.role.trim() || null,
        type: editing.type,
        difficulty: editing.difficulty,
        estimatedDuration: Number(editing.estimatedDuration) || 30,
        visibility: editing.visibility,
        tags: editing.tagsText.split(",").map((x) => x.trim()).filter(Boolean),
        questions: editing.questions
          .filter((q) => q.question.trim())
          .map((q) => ({
            question: q.question.trim(),
            type: q.type,
            followUps: q.followUpsText.split("\n").map((x) => x.trim()).filter(Boolean),
            expectedTopics: q.expectedTopicsText.split(",").map((x) => x.trim()).filter(Boolean),
            notes: q.notes.trim() || null
          }))
      };
      if (editing.id) {
        await updateInterviewTemplate(editing.id, payload);
      } else {
        await createInterviewTemplate(payload);
      }
      await onUpdated();
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save template.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(templateId: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteInterviewTemplate(templateId);
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete template.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicate(templateId: string) {
    setBusy(true);
    setError(null);
    try {
      await duplicateInterviewTemplate(templateId);
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to duplicate template.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-rb-muted">Your templates</p>
        <button className="rb-button-secondary px-3 py-1.5 text-xs" onClick={() => setEditing({ ...emptyTemplate })} type="button">
          <Plus className="mr-1.5 h-3.5 w-3.5 inline" />
          New
        </button>
      </div>

      <div className="space-y-2">
        {myTemplates.map((t) => (
          <div key={t.id} className="rounded-xl border border-rb-border bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-rb-text">{t.title}</p>
                <p className="text-[11px] text-rb-muted">
                  {t.type} • {t.difficulty} • {t.visibility}
                </p>
              </div>
              <div className="flex gap-1">
                <button className="rounded-md p-1 hover:bg-rb-surface" onClick={() => setEditing(fromTemplate(t))} type="button"><Pencil className="h-3.5 w-3.5" /></button>
                <button className="rounded-md p-1 hover:bg-rb-surface" onClick={() => void handleDuplicate(t.id)} type="button"><Copy className="h-3.5 w-3.5" /></button>
                <button className="rounded-md p-1 text-red-700 hover:bg-red-50" onClick={() => void handleDelete(t.id)} type="button"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {myTemplates.length === 0 && <p className="text-xs text-rb-muted">No templates yet.</p>}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-rb-muted">Public templates</p>
        {publicTemplates.slice(0, 6).map((t) => (
          <div key={t.id} className="rounded-xl border border-rb-border bg-rb-surface p-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-rb-text">{t.title}</p>
              <button className="text-xs font-bold text-rb-primary" onClick={() => void handleDuplicate(t.id)} type="button">Duplicate</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="space-y-3 rounded-2xl border border-rb-border bg-white p-3">
          <p className="text-sm font-black text-rb-text">{editing.id ? "Edit Template" : "Create Template"}</p>
          <input className="w-full rounded-lg border border-rb-border px-3 py-2 text-sm" placeholder="Title" value={editing.title} onChange={(e) => setEditing((s) => s ? { ...s, title: e.target.value } : s)} />
          <div className="grid grid-cols-2 gap-2">
            <select className="rounded-lg border border-rb-border px-2 py-2 text-xs" value={editing.domain} onChange={(e) => setEditing((s) => s ? { ...s, domain: e.target.value as EditableTemplate["domain"] } : s)}>
              <option value="tech">Tech</option><option value="non-tech">Non-tech</option><option value="any">Any</option>
            </select>
            <select className="rounded-lg border border-rb-border px-2 py-2 text-xs" value={editing.visibility} onChange={(e) => setEditing((s) => s ? { ...s, visibility: e.target.value as "public" | "private" } : s)}>
              <option value="private">Private</option><option value="public">Public</option>
            </select>
            <select className="rounded-lg border border-rb-border px-2 py-2 text-xs" value={editing.type} onChange={(e) => setEditing((s) => s ? { ...s, type: e.target.value as EditableTemplate["type"] } : s)}>
              <option value="technical">Technical</option><option value="hr">HR</option><option value="behavioral">Behavioral</option><option value="mixed">Mixed</option><option value="resume_round">Resume</option>
            </select>
            <select className="rounded-lg border border-rb-border px-2 py-2 text-xs" value={editing.difficulty} onChange={(e) => setEditing((s) => s ? { ...s, difficulty: e.target.value as EditableTemplate["difficulty"] } : s)}>
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </select>
          </div>
          <input className="w-full rounded-lg border border-rb-border px-3 py-2 text-sm" placeholder="Role (optional)" value={editing.role} onChange={(e) => setEditing((s) => s ? { ...s, role: e.target.value } : s)} />
          <div className="space-y-2">
            {editing.questions.map((q, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border border-rb-border p-2">
                <div className="flex items-center gap-2">
                  <input className="flex-1 rounded-md border border-rb-border px-2 py-1.5 text-xs" placeholder={`Question ${idx + 1}`} value={q.question} onChange={(e) => setEditing((s) => s ? { ...s, questions: s.questions.map((x, i) => i === idx ? { ...x, question: e.target.value } : x) } : s)} />
                  <button className="text-xs text-rb-primary" type="button" onClick={() => setEditing((s) => s ? { ...s, questions: s.questions.filter((_, i) => i !== idx) } : s)}>Remove</button>
                </div>
                <div className="flex gap-2">
                  <button className="text-[10px] font-bold text-rb-primary disabled:opacity-40" disabled={idx === 0} type="button" onClick={() => setEditing((s) => {
                    if (!s || idx === 0) return s;
                    const next = [...s.questions];
                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                    return { ...s, questions: next };
                  })}>Up</button>
                  <button className="text-[10px] font-bold text-rb-primary disabled:opacity-40" disabled={idx === editing.questions.length - 1} type="button" onClick={() => setEditing((s) => {
                    if (!s || idx === s.questions.length - 1) return s;
                    const next = [...s.questions];
                    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                    return { ...s, questions: next };
                  })}>Down</button>
                </div>
              </div>
            ))}
            <button className="rb-button-secondary px-3 py-1.5 text-xs" type="button" onClick={() => setEditing((s) => s ? { ...s, questions: [...s.questions, { question: "", type: "open", followUpsText: "", expectedTopicsText: "", notes: "" }] } : s)}>Add Question</button>
          </div>
          <div className="flex justify-end gap-2">
            <button className="rb-button-secondary px-3 py-1.5 text-xs" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="rb-button-primary px-3 py-1.5 text-xs disabled:opacity-50" disabled={!canSubmit || busy} onClick={() => void handleSave()} type="button">{busy ? "Saving..." : "Save"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

