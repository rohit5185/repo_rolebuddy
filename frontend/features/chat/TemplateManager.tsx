"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, Clock, Copy, Edit2, Globe, Lock, MessageSquare, Trash2, X } from "lucide-react";

import { deleteInterviewTemplate, duplicateInterviewTemplate, getMyInterviewTemplates, getPublicInterviewTemplates } from "./interview.api";
import { TemplateBuilder } from "./TemplateBuilder";
import type { InterviewTemplate } from "./types";

type TemplateManagerProps = {
  isOpen: boolean;
  onClose: () => void;
};

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: "bg-[#e8f7f5] text-[#108278]",
  intermediate: "bg-[#eef0ff] text-[#3b2ae1]",
  advanced: "bg-[#fff0f0] text-[#ba1a1a]"
};

const TYPE_LABELS: Record<string, string> = {
  technical: "Technical",
  hr: "HR",
  behavioral: "Behavioral",
  mixed: "Mixed",
  resume_round: "Resume Round"
};

export function TemplateManager({ isOpen, onClose }: TemplateManagerProps) {
  const [activeTab, setActiveTab] = useState<"mine" | "public">("mine");
  
  const [myTemplates, setMyTemplates] = useState<InterviewTemplate[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<InterviewTemplate[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Builder State
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InterviewTemplate | null>(null);

  const fetchMyTemplates = async () => {
    setLoading(true);
    try {
      const res = await getMyInterviewTemplates();
      setMyTemplates(res.data.templates);
    } catch (err) {
      setError("Failed to load your templates");
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicTemplates = async () => {
    setLoading(true);
    try {
      const res = await getPublicInterviewTemplates();
      setPublicTemplates(res.data.templates);
    } catch (err) {
      setError("Failed to load public templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === "mine") fetchMyTemplates();
      else fetchPublicTemplates();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteInterviewTemplate(id);
      setMyTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert("Failed to delete template");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await duplicateInterviewTemplate(id);
      setActiveTab("mine");
      fetchMyTemplates();
      setEditingTemplate(res.data.template);
      setBuilderOpen(true);
    } catch (err) {
      alert("Failed to duplicate template");
    }
  };

  const renderTemplateCard = (t: InterviewTemplate, isMine: boolean) => (
    <div key={t.id} className="rounded-xl border border-rb-border bg-white p-3 hover:border-[rgba(59,42,225,0.2)] hover:bg-[#fafafe] transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#1b1b24] leading-snug">{t.title}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-rb-muted font-bold uppercase tracking-wide">
            {t.visibility === "public" ? (
              <span className="flex items-center gap-1 text-[#108278]"><Globe className="h-3 w-3" /> Public</span>
            ) : (
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>
            )}
            {t.isSystemTemplate && <span className="text-[#b54b36]">System</span>}
          </div>
        </div>
        
        <div className="flex shrink-0 gap-1">
          {isMine && !t.isSystemTemplate && (
            <>
              <button onClick={() => { setEditingTemplate(t); setBuilderOpen(true); }} className="rounded p-1.5 text-rb-muted hover:bg-rb-sub hover:text-[#3b2ae1]">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleDelete(t.id)} className="rounded p-1.5 text-rb-muted hover:bg-rb-danger-bg hover:text-rb-danger">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button onClick={() => handleDuplicate(t.id)} className="rounded p-1.5 text-rb-muted hover:bg-rb-sub hover:text-[#3b2ae1]" title="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[#3b2ae1]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3b2ae1]">
          {TYPE_LABELS[t.type] ?? t.type}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${DIFFICULTY_BADGE[t.difficulty] ?? "bg-rb-sub text-rb-muted"}`}>
          {t.difficulty}
        </span>
        {t.role && (
          <span className="rounded-full bg-rb-sub px-2 py-0.5 text-[10px] font-semibold text-rb-muted">
            {t.role}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-[#777588]">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {t.estimatedDuration} min
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {t.totalQuestions} Qs
        </span>
        {t.usageCount !== undefined && (
          <span className="flex items-center gap-1" title="Times used">
            <BrainCircuit className="h-3.5 w-3.5" />
            {t.usageCount}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[110] bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[120] max-h-[92dvh] w-full overflow-hidden rounded-t-3xl border border-rb-border bg-white shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[450px] sm:rounded-l-3xl sm:rounded-tr-none">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-rb-border bg-[#fafafe] px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3b2ae1]/10 text-[#3b2ae1]">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-black text-rb-text">Template Manager</h2>
                <p className="text-xs font-semibold text-rb-muted">Manage and discover interview templates</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-rb-muted hover:bg-rb-sub">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex shrink-0 gap-4 border-b border-rb-border px-6 pt-3">
            <button
              onClick={() => setActiveTab("mine")}
              className={`pb-3 text-sm font-bold transition-colors ${
                activeTab === "mine" ? "border-b-2 border-[#3b2ae1] text-[#3b2ae1]" : "text-rb-muted hover:text-rb-text"
              }`}
            >
              My Templates
            </button>
            <button
              onClick={() => setActiveTab("public")}
              className={`pb-3 text-sm font-bold transition-colors ${
                activeTab === "public" ? "border-b-2 border-[#3b2ae1] text-[#3b2ae1]" : "text-rb-muted hover:text-rb-text"
              }`}
            >
              Public Templates
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto bg-rb-surface p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5755a4]">
                {activeTab === "mine" ? "Your Custom Templates" : "Community & System Templates"}
              </h3>
              {activeTab === "mine" && (
                <button
                  onClick={() => { setEditingTemplate(null); setBuilderOpen(true); }}
                  className="text-xs font-bold text-[#3b2ae1] hover:underline"
                >
                  + Create New
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-rb-primary border-t-transparent" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-[rgba(181,75,54,0.2)] bg-rb-danger-bg p-3 text-sm text-rb-danger">
                {error}
              </div>
            ) : (
              <div className="space-y-3">
                {activeTab === "mine" ? (
                  myTemplates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-rb-border bg-white p-6 text-center text-sm text-rb-muted">
                      You haven't created any templates yet.
                    </div>
                  ) : (
                    myTemplates.map(t => renderTemplateCard(t, true))
                  )
                ) : (
                  publicTemplates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-rb-border bg-white p-6 text-center text-sm text-rb-muted">
                      No public templates found.
                    </div>
                  ) : (
                    publicTemplates.map(t => renderTemplateCard(t, false))
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <TemplateBuilder
        isOpen={builderOpen}
        editingTemplate={editingTemplate}
        onClose={() => setBuilderOpen(false)}
        onSaved={(t) => {
          setBuilderOpen(false);
          setActiveTab("mine");
          fetchMyTemplates();
        }}
      />
    </>
  );
}
