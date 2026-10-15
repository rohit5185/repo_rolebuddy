"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BrainCircuit,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";

import { createInterviewTemplate, updateInterviewTemplate } from "./interview.api";
import type { CreateTemplatePayload, InterviewDifficulty, InterviewDomain, InterviewTemplate, InterviewTemplateType } from "./types";

type TemplateBuilderProps = {
  isOpen: boolean;
  editingTemplate?: InterviewTemplate | null;
  onClose: () => void;
  onSaved: (template: InterviewTemplate) => void;
};

const DOMAIN_OPTIONS: Array<{ value: InterviewDomain; label: string }> = [
  { value: "tech", label: "Tech" },
  { value: "non-tech", label: "Non-Tech" },
  { value: "any", label: "Any" }
];

const TYPE_OPTIONS: Array<{ value: InterviewTemplateType; label: string }> = [
  { value: "technical", label: "Technical" },
  { value: "hr", label: "HR" },
  { value: "behavioral", label: "Behavioral" },
  { value: "mixed", label: "Mixed" },
  { value: "resume_round", label: "Resume Round" }
];

const DIFFICULTY_OPTIONS: Array<{ value: InterviewDifficulty; label: string }> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];

const QUESTION_TYPE_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "situational", label: "Situational" }
];

export function TemplateBuilder({ isOpen, editingTemplate, onClose, onSaved }: TemplateBuilderProps) {
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<InterviewDomain>("tech");
  const [type, setType] = useState<InterviewTemplateType>("technical");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("intermediate");
  const [role, setRole] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [questions, setQuestions] = useState<CreateTemplatePayload["questions"]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingTemplate) {
        setTitle(editingTemplate.title);
        setDomain(editingTemplate.domain);
        setType(editingTemplate.type);
        setDifficulty(editingTemplate.difficulty);
        setRole(editingTemplate.role || "");
        setEstimatedDuration(editingTemplate.estimatedDuration);
        setVisibility(editingTemplate.visibility || "private");
        setQuestions(
          editingTemplate.questions.map((q) => ({
            question: q.question,
            type: q.type,
            followUps: [...(q.followUps || [])],
            expectedTopics: [...(q.expectedTopics || [])],
            notes: q.notes || ""
          }))
        );
      } else {
        setTitle("");
        setDomain("tech");
        setType("technical");
        setDifficulty("intermediate");
        setRole("");
        setEstimatedDuration(30);
        setVisibility("private");
        setQuestions([
          { question: "", type: "open", followUps: [], expectedTopics: [], notes: "" }
        ]);
      }
      setError(null);
    }
  }, [isOpen, editingTemplate]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: "", type: "open", followUps: [], expectedTopics: [], notes: "" }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const newQuestions = [...questions];
      const temp = newQuestions[index];
      newQuestions[index] = newQuestions[index - 1];
      newQuestions[index - 1] = temp;
      setQuestions(newQuestions);
    } else if (direction === "down" && index < questions.length - 1) {
      const newQuestions = [...questions];
      const temp = newQuestions[index];
      newQuestions[index] = newQuestions[index + 1];
      newQuestions[index + 1] = temp;
      setQuestions(newQuestions);
    }
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleChipAdd = (index: number, field: "followUps" | "expectedTopics", e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = e.currentTarget;
      const value = input.value.trim();
      if (value) {
        const newQuestions = [...questions];
        const currentList = newQuestions[index][field] || [];
        if (!currentList.includes(value)) {
          newQuestions[index][field] = [...currentList, value];
          setQuestions(newQuestions);
        }
        input.value = "";
      }
    }
  };

  const handleChipRemove = (index: number, field: "followUps" | "expectedTopics", chipIndex: number) => {
    const newQuestions = [...questions];
    const currentList = newQuestions[index][field] || [];
    newQuestions[index][field] = currentList.filter((_, i) => i !== chipIndex);
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (questions.length === 0) {
      setError("At least one question is required");
      return;
    }
    if (questions.some(q => !q.question.trim())) {
      setError("All questions must have text");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: CreateTemplatePayload = {
      title,
      domain,
      type,
      difficulty,
      role: role.trim() || undefined,
      estimatedDuration,
      visibility,
      questions
    };

    try {
      if (editingTemplate) {
        const res = await updateInterviewTemplate(editingTemplate.id, payload);
        onSaved(res.data.template);
      } else {
        const res = await createInterviewTemplate(payload);
        onSaved(res.data.template);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const labelClass = "text-xs font-bold uppercase tracking-widest text-rb-muted mb-1.5 block";
  const inputClass = "w-full rounded-xl border border-rb-border px-3 py-2 text-sm text-[#1b1b24] focus:border-rb-primary focus:outline-none";

  return (
    <div className="fixed inset-0 z-[140] flex flex-col bg-white sm:p-4">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:border sm:border-rb-border">
        
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-rb-border bg-[#fafafe] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b2ae1]/10 text-[#3b2ae1]">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <h2 className="font-headline text-lg font-black text-rb-text">
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-rb-muted hover:bg-rb-sub hover:text-rb-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
          
          {error && (
            <div className="rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg p-3 text-sm text-rb-danger">
              {error}
            </div>
          )}

          {/* Section 1: Basic Info */}
          <section className="space-y-4">
            <h3 className="font-headline text-sm font-black text-[#5755a4]">1. Basic Information</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Template Title <span className="text-rb-danger">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Frontend React Interview"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Domain</label>
                <div className="flex gap-2">
                  {DOMAIN_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDomain(opt.value)}
                      className={`flex-1 rounded-xl border py-1.5 text-xs font-bold transition-colors ${
                        domain === opt.value
                          ? "border-[#3b2ae1] bg-[#3b2ae1]/10 text-[#3b2ae1]"
                          : "border-rb-border bg-white text-rb-muted hover:bg-rb-sub"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as InterviewTemplateType)}
                  className={inputClass}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as InterviewDifficulty)}
                  className={inputClass}
                >
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Target Role (Optional)</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Estimated Duration (min)</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 30)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Visibility</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVisibility("private")}
                    className={`flex-1 rounded-xl border py-1.5 text-xs font-bold transition-colors ${
                      visibility === "private"
                        ? "border-[#3b2ae1] bg-[#3b2ae1]/10 text-[#3b2ae1]"
                        : "border-rb-border bg-white text-rb-muted hover:bg-rb-sub"
                    }`}
                  >
                    Private
                  </button>
                  <button
                    onClick={() => setVisibility("public")}
                    className={`flex-1 rounded-xl border py-1.5 text-xs font-bold transition-colors ${
                      visibility === "public"
                        ? "border-[#108278] bg-[#e8f7f5] text-[#108278]"
                        : "border-rb-border bg-white text-rb-muted hover:bg-rb-sub"
                    }`}
                  >
                    Public
                  </button>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-rb-border" />

          {/* Section 2: Questions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-sm font-black text-[#5755a4]">2. Questions</h3>
              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-1 rounded-full bg-[#3b2ae1]/10 px-3 py-1 text-xs font-bold text-[#3b2ae1] hover:bg-[#3b2ae1]/20"
              >
                <Plus className="h-3 w-3" /> Add Question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="relative rounded-xl border border-rb-border bg-white p-4 shadow-sm">
                  
                  {/* Question Header actions */}
                  <div className="absolute right-3 top-3 flex items-center gap-1">
                    <button
                      onClick={() => handleMoveQuestion(idx, "up")}
                      disabled={idx === 0}
                      className="rounded p-1 text-rb-muted hover:bg-rb-sub disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(idx, "down")}
                      disabled={idx === questions.length - 1}
                      className="rounded p-1 text-rb-muted hover:bg-rb-sub disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <div className="mx-1 h-4 w-px bg-rb-border" />
                    <button
                      onClick={() => handleRemoveQuestion(idx)}
                      className="rounded p-1 text-rb-muted hover:bg-rb-danger-bg hover:text-rb-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-3 pr-24">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#3b2ae1]">
                      Question {idx + 1}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <textarea
                        value={q.question}
                        onChange={(e) => handleQuestionChange(idx, "question", e.target.value)}
                        placeholder="Type the question here..."
                        rows={2}
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-rb-muted">Type</label>
                        <select
                          value={q.type}
                          onChange={(e) => handleQuestionChange(idx, "type", e.target.value)}
                          className={inputClass}
                        >
                          {QUESTION_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-rb-muted">Notes (Optional)</label>
                        <input
                          type="text"
                          value={q.notes || ""}
                          onChange={(e) => handleQuestionChange(idx, "notes", e.target.value)}
                          placeholder="Private notes for interviewer"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-rb-muted">Follow-ups</label>
                        <input
                          type="text"
                          placeholder="Type and press Enter..."
                          onKeyDown={(e) => handleChipAdd(idx, "followUps", e)}
                          className={inputClass}
                        />
                        {q.followUps && q.followUps.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {q.followUps.map((chip, cIdx) => (
                              <span key={cIdx} className="flex items-center gap-1 rounded-full bg-rb-sub px-2 py-0.5 text-[10px] font-semibold text-rb-muted">
                                {chip}
                                <button onClick={() => handleChipRemove(idx, "followUps", cIdx)} className="hover:text-rb-text">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-rb-muted">Expected Topics</label>
                        <input
                          type="text"
                          placeholder="Type and press Enter..."
                          onKeyDown={(e) => handleChipAdd(idx, "expectedTopics", e)}
                          className={inputClass}
                        />
                        {q.expectedTopics && q.expectedTopics.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {q.expectedTopics.map((chip, cIdx) => (
                              <span key={cIdx} className="flex items-center gap-1 rounded-full bg-rb-sub px-2 py-0.5 text-[10px] font-semibold text-rb-muted">
                                {chip}
                                <button onClick={() => handleChipRemove(idx, "expectedTopics", cIdx)} className="hover:text-rb-text">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
            
          </section>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 border-t border-rb-border bg-white p-4 sm:px-6">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm font-bold text-rb-muted hover:bg-rb-sub disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#3b2ae1] px-6 py-2 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
