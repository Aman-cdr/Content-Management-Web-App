"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Loader2, CheckCircle, AlertCircle, Copy, ExternalLink,
  FileText, Tag, BookOpen, Image as ImageIcon, ChevronDown, ChevronUp, X,
} from "lucide-react";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";
import { useContent } from "@/context/ContentContext";

const AI_STEPS = [
  { key: "intent",    label: "Understanding your idea",     icon: Sparkles },
  { key: "titles",    label: "Generating title options",    icon: FileText },
  { key: "metadata",  label: "Creating SEO metadata",      icon: Tag },
  { key: "script",    label: "Writing script outline",     icon: BookOpen },
  { key: "thumbnail", label: "Designing thumbnail prompt", icon: ImageIcon },
];

/**
 * The AI Content Agent — describe an idea, get a full content plan (titles,
 * description/tags, script outline, thumbnail prompt) back. Previously lived
 * inline as a full-width banner on the Dashboard page; now a slide-in panel
 * reachable from the floating sparkle button on every page (DashboardShell),
 * so it isn't tied to any one page.
 */
export default function AIAgentPanel({ onClose }) {
  const router = useRouter();
  const { addContent } = useContent();

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiCurrentStep, setAiCurrentStep] = useState(-1);
  const [aiPlan, setAiPlan] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState("titles");
  const promptInputRef = useRef(null);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    setAiPlan(null);
    setAiError(null);
    setAiSaved(false);
    setAiCurrentStep(0);

    const stepTimer = setInterval(() => {
      setAiCurrentStep((prev) => {
        if (prev >= AI_STEPS.length - 1) { clearInterval(stepTimer); return prev; }
        return prev + 1;
      });
    }, 800);

    try {
      const res = await httpClient.post(ENDPOINTS.AI.GENERATE, { prompt: aiPrompt });
      clearInterval(stepTimer);
      setAiCurrentStep(AI_STEPS.length);
      if (res.success && res.data?.plan) {
        setAiPlan(res.data.plan);
      } else {
        setAiError(res.message || "Generation failed");
      }
    } catch (err) {
      clearInterval(stepTimer);
      setAiError(err.message || "Something went wrong");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!aiPlan || aiSaving) return;
    setAiSaving(true);
    try {
      const platformMap = { youtube: "YouTube", instagram: "Instagram", tiktok: "TikTok", twitter: "Twitter/X" };
      await addContent({
        title: aiPlan.titles[0]?.title || aiPrompt,
        description: aiPlan.metadata?.description || "",
        type: aiPlan.intent?.format === "article" ? "article" : "video",
        platforms: [platformMap[aiPlan.intent?.platform] || "YouTube"],
        tags: aiPlan.metadata?.tags || [],
        script: `## Hook\n${aiPlan.script?.hook || ""}\n\n${(aiPlan.script?.mainPoints || []).map(p => `## ${p.heading}\n${p.content}`).join("\n\n")}\n\n## CTA\n${aiPlan.script?.cta || ""}`,
        status: "draft",
      });
      setAiSaved(true);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setAiSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#F4F5F8] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-[800] text-[#0A0A0F] tracking-tight">AI Content Agent</h3>
            <p className="text-[11px] text-[#9CA3AF] font-medium">Describe an idea → get a content plan</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl text-neutral-400 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Prompt Input */}
        <div className="flex flex-col gap-3">
          <input
            ref={promptInputRef}
            type="text"
            placeholder="e.g. A YouTube video about 5 morning habits for productivity..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
            disabled={aiGenerating}
            className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl text-[13px] text-[#111318] placeholder:text-[#B8BCC8] focus:outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all disabled:opacity-60"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAiGenerate}
            disabled={!aiPrompt.trim() || aiGenerating}
            className="w-full px-5 py-3 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white rounded-xl text-[13px] font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {aiGenerating ? "Generating..." : "Generate"}
          </motion.button>
        </div>

        {/* Step-by-step progress */}
        <AnimatePresence>
          {(aiGenerating || aiCurrentStep >= 0) && !aiPlan && !aiError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-2"
            >
              {AI_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === aiCurrentStep;
                const isDone = i < aiCurrentStep;
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: i <= aiCurrentStep ? 1 : 0.35, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                      isActive ? "bg-indigo-50 border border-indigo-100" : isDone ? "bg-emerald-50/50" : "bg-transparent"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isDone ? "bg-emerald-500 text-white" : isActive ? "bg-indigo-500 text-white" : "bg-neutral-100 text-neutral-400"
                    }`}>
                      {isDone ? <CheckCircle className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <StepIcon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[13px] font-semibold ${
                      isDone ? "text-emerald-700" : isActive ? "text-indigo-700" : "text-neutral-400"
                    }`}>{step.label}</span>
                    {isDone && <span className="text-[10px] font-bold text-emerald-500 ml-auto">Done</span>}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {aiError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{aiError}</p>
            <button onClick={() => { setAiError(null); setAiCurrentStep(-1); }} className="ml-auto text-xs font-bold text-red-500 hover:text-red-700">Dismiss</button>
          </motion.div>
        )}

        {/* Generated Content Plan */}
        <AnimatePresence>
          {aiPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 space-y-4"
            >
              {/* Action buttons */}
              <div className="flex flex-col gap-2 mb-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSaveToLibrary}
                  disabled={aiSaving || aiSaved}
                  className={`py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all ${
                    aiSaved
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                  }`}
                >
                  {aiSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : aiSaved ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {aiSaving ? "Saving..." : aiSaved ? "Saved to Content Library!" : "Save to Content Library"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    router.push(`/add-content?aiTitle=${encodeURIComponent(aiPlan.titles[0]?.title || "")}&aiDesc=${encodeURIComponent(aiPlan.metadata?.description || "")}`);
                    onClose?.();
                  }}
                  className="px-5 py-3 border border-[#E2E4E9] text-[#374151] bg-white rounded-xl text-[13px] font-bold hover:bg-[#F4F5F8] transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Open in Editor
                </motion.button>
              </div>

              {/* ── Titles Section ── */}
              <div className="rounded-2xl border border-[#E2E4E9] overflow-hidden">
                <button onClick={() => setExpandedSection(expandedSection === "titles" ? "" : "titles")} className="w-full flex items-center justify-between px-5 py-3.5 bg-[#F9FAFB] hover:bg-[#F4F5F8] transition-colors">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-[#0A0A0F]"><FileText className="w-4 h-4 text-indigo-500" /> Title Options ({aiPlan.titles?.length || 0})</span>
                  {expandedSection === "titles" ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                </button>
                <AnimatePresence>
                  {expandedSection === "titles" && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-4 space-y-2">
                        {aiPlan.titles?.map((t, i) => (
                          <div key={i} className={`p-3 rounded-xl border transition-all ${
                            i === 0 ? "border-indigo-200 bg-indigo-50/50" : "border-[#E2E4E9] bg-white hover:border-indigo-200"
                          }`}>
                            <p className="text-[13px] font-bold text-[#111318]">{i === 0 && <span className="text-[10px] font-black text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded mr-2">TOP PICK</span>}{t.title}</p>
                            <p className="text-[11px] text-[#9CA3AF] mt-1">{t.reason}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Description Section ── */}
              <div className="rounded-2xl border border-[#E2E4E9] overflow-hidden">
                <button onClick={() => setExpandedSection(expandedSection === "desc" ? "" : "desc")} className="w-full flex items-center justify-between px-5 py-3.5 bg-[#F9FAFB] hover:bg-[#F4F5F8] transition-colors">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-[#0A0A0F]"><Tag className="w-4 h-4 text-emerald-500" /> Description & Tags</span>
                  {expandedSection === "desc" ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                </button>
                <AnimatePresence>
                  {expandedSection === "desc" && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-4 space-y-3">
                        <p className="text-[13px] text-[#4B5264] whitespace-pre-wrap leading-relaxed">{aiPlan.metadata?.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {aiPlan.metadata?.tags?.map((tag, i) => (
                            <span key={i} className="text-[11px] font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">{tag}</span>
                          ))}
                          {aiPlan.metadata?.hashtags?.map((h, i) => (
                            <span key={i} className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg">{h}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Script Outline Section ── */}
              <div className="rounded-2xl border border-[#E2E4E9] overflow-hidden">
                <button onClick={() => setExpandedSection(expandedSection === "script" ? "" : "script")} className="w-full flex items-center justify-between px-5 py-3.5 bg-[#F9FAFB] hover:bg-[#F4F5F8] transition-colors">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-[#0A0A0F]"><BookOpen className="w-4 h-4 text-amber-500" /> Script Outline</span>
                  {expandedSection === "script" ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                </button>
                <AnimatePresence>
                  {expandedSection === "script" && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-4 space-y-4">
                        <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">🎣 Hook</p>
                          <p className="text-[13px] text-[#374151] leading-relaxed">{aiPlan.script?.hook}</p>
                        </div>
                        {aiPlan.script?.mainPoints?.map((point, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white border border-[#E2E4E9]">
                            <p className="text-[12px] font-bold text-indigo-600 mb-1">{point.heading}</p>
                            <p className="text-[13px] text-[#4B5264] leading-relaxed">{point.content}</p>
                          </div>
                        ))}
                        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">📢 Call to Action</p>
                          <p className="text-[13px] text-[#374151] leading-relaxed">{aiPlan.script?.cta}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Thumbnail Prompt Section ── */}
              <div className="rounded-2xl border border-[#E2E4E9] overflow-hidden">
                <button onClick={() => setExpandedSection(expandedSection === "thumb" ? "" : "thumb")} className="w-full flex items-center justify-between px-5 py-3.5 bg-[#F9FAFB] hover:bg-[#F4F5F8] transition-colors">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-[#0A0A0F]"><ImageIcon className="w-4 h-4 text-rose-500" /> Thumbnail Prompt</span>
                  {expandedSection === "thumb" ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                </button>
                <AnimatePresence>
                  {expandedSection === "thumb" && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-4">
                        <p className="text-[13px] text-[#4B5264] leading-relaxed italic bg-rose-50/40 p-3 rounded-xl border border-rose-100">{aiPlan.thumbnailPrompt}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
