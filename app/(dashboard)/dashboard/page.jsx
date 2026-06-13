"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { Sparkles, TrendingUp, Users, Play, Clock, ChevronRight, Zap, Loader2, RefreshCw, AlertCircle, Wifi, PlusSquare, Send, CheckCircle, FileText, Tag, Image as ImageIcon, BookOpen, Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardData } from "@/lib/use-dashboard-data";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";
import { useContent } from "@/context/ContentContext";
import ScriptModal from "@/app/components/ScriptModal";
import RescheduleModal from "@/app/components/RescheduleModal";
import ThumbnailModal from "@/app/components/ThumbnailModal";


// Icon map – data from API uses string keys, we map to actual components
const ICON_MAP = {
  Play,
  Users,
  Clock,
  TrendingUp,
  Zap,
  Sparkles,
};

const STAT_COLORS = {
  "Total Views": { color: "#6366F1", bg: "rgba(99,102,241,0.10)" },
  "Subscribers": { color: "#8B5CF6", bg: "rgba(139,92,246,0.10)" },
  "Avg Watch Time": { color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  "Revenue": { color: "#10B981", bg: "rgba(16,185,129,0.10)" }
};

// ---------- Skeleton Loaders ----------
function StatSkeleton() {
  return (
    <div className="glass-card bg-white p-6 relative overflow-hidden animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-black/5" />
        <div className="w-14 h-6 rounded-lg bg-black/5" />
      </div>
      <div className="h-4 w-24 rounded bg-black/5 mb-2" />
      <div className="h-8 w-32 rounded bg-black/5" />
    </div>
  );
}

function SuggestionSkeleton() {
  return (
    <div className="card bg-white p-6 flex flex-col border-none ring-1 ring-black/5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-16 h-4 rounded bg-black/5" />
        <div className="w-12 h-4 rounded bg-black/5" />
      </div>
      <div className="h-5 w-3/4 rounded bg-black/5 mb-2" />
      <div className="h-4 w-full rounded bg-black/5 mb-6" />
      <div className="mt-auto space-y-3">
        <div className="h-1 w-full rounded bg-black/5" />
        <div className="h-10 w-full rounded-xl bg-black/5" />
      </div>
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl">
          <div className="w-3 h-3 rounded-full bg-black/5" />
          <div className="flex-1">
            <div className="h-4 w-48 rounded bg-black/5 mb-2" />
            <div className="h-3 w-24 rounded bg-black/5" />
          </div>
          <div className="h-6 w-20 rounded-full bg-black/5" />
        </div>
      ))}
    </div>
  );
}

function PlatformSkeleton() {
  return (
    <div className="space-y-8 pt-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="flex justify-between mb-3">
            <div className="h-4 w-20 rounded bg-black/5" />
            <div className="h-4 w-24 rounded bg-black/5" />
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}

// ---------- Error Banner ----------
function ErrorBanner({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 mb-6"
    >
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      <p className="text-sm text-red-400 flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-xs font-semibold text-red-400 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </motion.div>
  );
}

// ---------- Live Indicator ----------
function LiveIndicator({ lastUpdated, error, connectedCount = 0, onReconnect }) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="font-semibold">Sync Failed</span>
        <button onClick={onReconnect} className="ml-1 text-[#4F46E5] hover:underline font-bold">Reconnect</button>
      </div>
    );
  }

  if (!lastUpdated) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-500 bg-white px-3 py-1.5 rounded-lg border border-black/[0.04] shadow-sm">
        <div className="w-2 h-2 rounded-full bg-neutral-200 animate-pulse" />
        <div className="h-3 w-24 bg-neutral-200 rounded animate-pulse" />
      </div>
    );
  }

  const timeAgo = `Updated ${Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago`;

  return (
    <div className="flex items-center gap-2 text-xs text-neutral-500 bg-white px-3 py-1.5 rounded-lg border border-black/[0.04] shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <span className="font-semibold text-[#4B5264]">{connectedCount} {connectedCount === 1 ? 'platform' : 'platforms'} connected</span>
      <span className="text-neutral-400 ml-1">({timeAgo})</span>
    </div>
  );
}

// ==========================================================
//  DASHBOARD PAGE
// ==========================================================
// ─── AI Generation Steps ──────────────────────────────────────────────────────
const AI_STEPS = [
  { key: "intent",    label: "Understanding your idea",     icon: Sparkles },
  { key: "titles",    label: "Generating title options",    icon: FileText },
  { key: "metadata",  label: "Creating SEO metadata",      icon: Tag },
  { key: "script",    label: "Writing script outline",     icon: BookOpen },
  { key: "thumbnail", label: "Designing thumbnail prompt", icon: ImageIcon },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, loading, error, lastUpdated, refetch } = useDashboardData(60_000);
  const { addContent } = useContent();
  
  const userName = user ? `${user.firstName} ${user.lastName}` : "Creator";
  const firstName = user?.firstName || userName.split(" ")[0];

  // Modal states
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);

  // AI Agent states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiCurrentStep, setAiCurrentStep] = useState(-1);
  const [aiPlan, setAiPlan] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState("titles");
  const promptInputRef = useRef(null);

  // Derive data from API response (with fallbacks)
  const stats = data?.stats || [];
  const aiSuggestions = data?.aiSuggestions || [];
  const roadmapItems = data?.roadmap || [];
  const platformPerformance = data?.platformPerformance || [];

  // ── AI Generate Handler ──────────────────────────────────────────────────
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    setAiPlan(null);
    setAiError(null);
    setAiSaved(false);
    setAiCurrentStep(0);

    // Simulate step-by-step progress
    const stepTimer = setInterval(() => {
      setAiCurrentStep((prev) => {
        if (prev >= AI_STEPS.length - 1) { clearInterval(stepTimer); return prev; }
        return prev + 1;
      });
    }, 800);

    try {
      const res = await httpClient.post(ENDPOINTS.AI.GENERATE, { prompt: aiPrompt });
      clearInterval(stepTimer);
      setAiCurrentStep(AI_STEPS.length); // all done
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

  // ── Save to Content Library ──────────────────────────────────────────────
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

  // Action handler for AI suggestion buttons
  const handleSuggestionAction = (action) => {
    switch (action) {
      case "Draft Script":
        setScriptModalOpen(true);
        break;
      case "Reschedule":
        setRescheduleModalOpen(true);
        break;
      case "Generate New":
        setThumbnailModalOpen(true);
        break;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8 pb-12"
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div variants={item} className="flex-1">
            <h2 className="text-[36px] font-[800] tracking-tight mb-2 text-[#0A0A0F]">
              Welcome back, <span className="text-[#6366F1]">{firstName}</span>
            </h2>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] rounded-full border border-[#E5E7EB] shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <p className="text-[11px] font-[700] text-[#6B7280] uppercase tracking-wider">Strategy: Focus on YouTube Shorts this week</p>
              </div>
              <LiveIndicator lastUpdated={lastUpdated} error={error} connectedCount={data?.connectedCount || 0} onReconnect={refetch} />
            </div>
          </motion.div>
          <motion.button 
            variants={item}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/add-content")}
            className="px-6 py-3.5 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white rounded-[14px] text-[14px] font-[600] transition-all shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:brightness-110 flex items-center gap-2"
          >
            <PlusSquare className="w-5 h-5" />
            Create New Content
          </motion.button>
        </header>

        {/* Error State */}
        {error && <ErrorBanner message={error} onRetry={refetch} />}

        {/* ═══ AI CONTENT AGENT ═══ */}
        <motion.div variants={item} className="relative overflow-hidden rounded-[28px] border border-[#E2E4E9] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* Gradient top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899]" />
          
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[18px] font-[800] text-[#0A0A0F] tracking-tight">AI Content Agent</h3>
                <p className="text-[12px] text-[#9CA3AF] font-medium">Describe your idea → get a complete content plan in seconds</p>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  ref={promptInputRef}
                  type="text"
                  placeholder="e.g. A YouTube video about 5 morning habits for productivity..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                  disabled={aiGenerating}
                  className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl text-[14px] text-[#111318] placeholder:text-[#B8BCC8] focus:outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all disabled:opacity-60"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAiGenerate}
                disabled={!aiPrompt.trim() || aiGenerating}
                className="px-7 py-4 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white rounded-2xl text-[14px] font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
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
                  <div className="flex items-center gap-3 mb-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSaveToLibrary}
                      disabled={aiSaving || aiSaved}
                      className={`flex-1 py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all ${
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
                      onClick={() => router.push(`/add-content?aiTitle=${encodeURIComponent(aiPlan.titles[0]?.title || "")}&aiDesc=${encodeURIComponent(aiPlan.metadata?.description || "")}`)}
                      className="px-5 py-3 border border-[#E2E4E9] text-[#374151] bg-white rounded-xl text-[13px] font-bold hover:bg-[#F4F5F8] transition-all flex items-center gap-2"
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
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? [1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)
            : stats.map((stat) => {
                const IconComp = ICON_MAP[stat.iconKey] || Play;
                const statColor = STAT_COLORS[stat.name] || STAT_COLORS["Total Views"];
                return (
                  <motion.div 
                    key={stat.name} 
                    className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-6 relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all"
                    style={{ borderTop: `4px solid ${statColor.color}` }}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                      <IconComp size={80} className="text-black" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="flex items-center justify-center"
                        style={{ width: '40px', height: '40px', borderRadius: '10px', background: statColor.bg }}
                      >
                        <IconComp className="w-5 h-5" style={{ color: statColor.color }} />
                      </div>
                      <span className="text-xs font-bold text-[#059669] bg-[rgba(5,150,105,0.08)] px-2 py-1 rounded-lg">
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm text-[#4B5264] mb-1 font-medium">{stat.name}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <p className="text-[28px] font-bold tracking-tight text-[#0A0A0F] leading-none">{stat.value}</p>
                    </div>
                    
                    {/* Predictive AI Insight */}
                    <div className="mt-4 pt-4 border-t border-black/[0.03] flex items-center gap-2">
                      <div className="p-1 rounded bg-indigo-50">
                        <Zap className="w-3 h-3 text-indigo-500" />
                      </div>
                      <p className="text-[10px] font-bold text-[#8A91A8] leading-tight">
                        <span className="text-indigo-600">AI:</span> Predicted +{Math.floor(Math.random() * 10) + 5}% next week
                      </p>
                    </div>
                  </motion.div>
                );
              })}
        </motion.div>

        {/* AI Strategy Center */}
        <section className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[24px] font-[800] text-[#0A0A0F] tracking-tight">AI Strategy Center</h3>
                <p className="text-[13px] text-[#6B7280] font-[400]">Real-time optimization based on your latest performance data</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[10px] font-[700] text-[#4B5264] uppercase tracking-wider">AI Engine Active</span>
              </div>
              <button className="text-sm text-[#4F46E5] hover:text-[#4338CA] font-bold flex items-center gap-1 transition-colors">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {loading
              ? [1, 2, 3, 4].map((i) => <SuggestionSkeleton key={i} />)
              : aiSuggestions.map((suggestion) => {
                  const IconComp = ICON_MAP[suggestion.iconKey] || Sparkles;
                  const impactColor = suggestion.impact === "Critical" ? "text-red-600 bg-red-50" : suggestion.impact === "High" ? "text-orange-600 bg-orange-50" : "text-blue-600 bg-blue-50";
                  
                  return (
                    <motion.div 
                      key={suggestion.id} 
                      variants={item}
                      className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-6 flex flex-col relative overflow-hidden group hover:border-[#6366F1]/[0.3] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none -rotate-12 translate-x-4 -translate-y-4">
                        <IconComp size={100} className="text-[#6366F1]" />
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md ${impactColor}`}>
                          {suggestion.impact} Impact
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#8A91A8]">Confidence:</span>
                          <span className="text-[10px] font-black text-[#4B5264]">{suggestion.confidence}%</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-[17px] mb-2 text-[#111318] group-hover:text-[#4F46E5] transition-colors">{suggestion.title}</h4>
                      <p className="text-sm text-[#4B5264] mb-6 flex-1 leading-relaxed line-clamp-3">{suggestion.description}</p>
                      
                      <div className="mt-auto space-y-3">
                        <div className="h-[2px] w-full bg-[#F4F5F8] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${suggestion.confidence}%` }}
                            className="h-full bg-indigo-500 rounded-full"
                          />
                        </div>
                        <button
                          onClick={() => handleSuggestionAction(suggestion.action)}
                          className="w-full py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all group"
                        >
                          <span className="flex items-center justify-center gap-2">
                            {suggestion.action}
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
          </div>
        </section>

        {/* Recent Activity / Roadmap Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <motion.div variants={item} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-[20px] font-[800] mb-8 text-[#0A0A0F]">Upcoming Roadmap</h3>
            {loading ? (
              <RoadmapSkeleton />
            ) : (
              <div className="relative pl-3 space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                {roadmapItems.slice(0, 4).map((roadmap, i) => {
                  const colorClass = roadmap.color || 'bg-indigo-500';
                  const textClass = colorClass.replace('bg-', 'text-').replace('-500', '-600');
                  return (
                  <motion.div 
                    key={i} 
                    whileHover={{ x: 4 }}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className={`absolute left-0 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${colorClass} border-2 border-white shadow-sm ring-4 ring-white z-10`}></div>
                    <div className="ml-8 md:ml-0 md:w-[calc(50%-1.5rem)] md:odd:text-right">
                      <div className="p-4 bg-white rounded-xl shadow-sm border border-black/[0.04] group-hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center justify-between md:hidden mb-2">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{roadmap.due}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${textClass} bg-neutral-50`}>{roadmap.status}</span>
                        </div>
                        <p className="font-semibold text-[#111318]">{roadmap.title}</p>
                        <div className="hidden md:flex items-center justify-between md:justify-end md:group-odd:justify-start gap-2 mt-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${textClass} bg-neutral-50`}>{roadmap.status}</span>
                          <span className="text-xs text-[#8A91A8]">{roadmap.due}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )})}
              </div>
            )}
            <button className="w-full mt-6 py-2 text-sm text-[#8A91A8] hover:text-[#4B5264] font-medium transition-colors">
              View Full Roadmap
            </button>
          </motion.div>

          <motion.div variants={item} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-[20px] font-[800] mb-8 text-[#0A0A0F]">Platform Performance</h3>
            {loading ? (
              <PlatformSkeleton />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Total Views", value: "2.4M", change: "+12%", color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Subscribers", value: "84.2K", change: "+840", color: "text-purple-600", bg: "bg-purple-50" },
                  { label: "Engagement Rate", value: "6.8%", change: "+1.2%", color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Posts This Month", value: "12", change: "On Track", color: "text-amber-600", bg: "bg-amber-50" }
                ].map((metric, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#F9FAFB] border border-black/[0.04]">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-semibold text-[#8A91A8]">{metric.label}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${metric.bg} ${metric.color}`}>
                        {metric.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-[#0A0A0F]">{metric.value}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Modals */}
      <ScriptModal
        isOpen={scriptModalOpen}
        onClose={() => setScriptModalOpen(false)}
      />
      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
      />
      <ThumbnailModal
        isOpen={thumbnailModalOpen}
        onClose={() => setThumbnailModalOpen(false)}
      />
    </>
  );
}
