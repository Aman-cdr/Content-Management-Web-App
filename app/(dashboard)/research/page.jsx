"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Sparkles, Loader2, Copy, Check, ExternalLink, AlertCircle,
  FileText, Image as ImageIcon, Hash, HelpCircle, Eye, Calendar,
  Gauge, Clock, Target, Users, Zap, Quote, Lightbulb, ThumbsUp, ThumbsDown,
  TrendingUp, Compass, CheckCircle2, ArrowRight, Bookmark, Download, ChevronDown,
  History, X,
} from "lucide-react";
import { FaYoutube } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";
import { useContent } from "@/context/ContentContext";
import { researchToMarkdown, downloadMarkdownText, exportResearchPDF } from "@/lib/researchExport";

const LOADING_STEPS = [
  "Researching topic…",
  "Finding competitors…",
  "Generating titles…",
  "Building script outline…",
  "Generating thumbnail ideas…",
  "Analyzing keywords…",
];

function formatViews(n) {
  if (n === null || n === undefined) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

const COMPETITION_COLOR = { Low: "text-emerald-600 bg-emerald-50 border-emerald-100", Medium: "text-amber-600 bg-amber-50 border-amber-100", High: "text-red-600 bg-red-50 border-red-100" };
const DIFFICULTY_COLOR = { Easy: "text-emerald-600 bg-emerald-50 border-emerald-100", Medium: "text-amber-600 bg-amber-50 border-amber-100", Hard: "text-red-600 bg-red-50 border-red-100" };

const RECENT_SEARCHES_KEY = "creator-cms-research-recent-searches";
const MAX_RECENT_SEARCHES = 8;

function loadRecentSearches() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(list) {
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

const LAST_RESULT_KEY = "creator-cms-research-last-result";

function loadLastResult() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LAST_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLastResult(topic, result) {
  try {
    window.sessionStorage.setItem(LAST_RESULT_KEY, JSON.stringify({ topic, result }));
  } catch {
    // ignore storage errors (e.g. private browsing quota, result too large)
  }
}

function clearLastResult() {
  try {
    window.sessionStorage.removeItem(LAST_RESULT_KEY);
  } catch {
    // ignore
  }
}

const ACCENT = {
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-600",  gradient: "from-indigo-500 to-indigo-400" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600",   gradient: "from-amber-500 to-amber-400" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", gradient: "from-emerald-500 to-emerald-400" },
  violet:  { bg: "bg-violet-50",  text: "text-violet-600",  gradient: "from-violet-500 to-violet-400" },
  pink:    { bg: "bg-pink-50",    text: "text-pink-600",    gradient: "from-pink-500 to-fuchsia-400" },
  cyan:    { bg: "bg-cyan-50",    text: "text-cyan-600",    gradient: "from-cyan-500 to-cyan-400" },
  blue:    { bg: "bg-blue-50",    text: "text-blue-600",    gradient: "from-blue-500 to-blue-400" },
  red:     { bg: "bg-red-50",     text: "text-red-600",     gradient: "from-red-500 to-red-400" },
};

// Stagger variants for the cards within a tab — reuses the same
// container/item pattern already used on the Dashboard and Series Planner
// pages, so cards cascade in rather than popping in all at once.
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const staggerItem = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

function SectionCard({ icon: Icon, title, subtitle, accent = "indigo", children }) {
  const c = ACCENT[accent] || ACCENT.indigo;
  return (
    <motion.div variants={staggerItem} className="relative bg-white border border-[#E2E4E9] rounded-2xl overflow-hidden shadow-sm">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.gradient}`} />
      <div className="px-6 py-4 border-b border-[#F4F5F8] flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
        <div>
          <h3 className="text-[15px] font-[800] text-[#0F0F0F]">{title}</h3>
          {subtitle && <p className="text-[11px] text-neutral-400">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

// Hero radial gauge for the Opportunity Score — the single most
// decision-relevant number on the page, promoted out of the stat grid so it
// reads as a moment rather than one box among many.
function OpportunityGauge({ score, confidence }) {
  const pct = Math.min(100, Math.max(0, score ?? 0));
  const color = pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444";
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white border border-[#E2E4E9] rounded-2xl shadow-sm">
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#F4F5F8" strokeWidth="10" />
          <motion.circle
            cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-black text-[#0F0F0F] leading-none">{pct}%</span>
        </div>
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1 flex items-center justify-center sm:justify-start gap-1">
          <Target className="w-3 h-3" /> Opportunity Score
        </p>
        <p className="text-[15px] font-bold text-[#111318] mb-1">
          {pct >= 70 ? "Strong opportunity" : pct >= 40 ? "Moderate opportunity" : "Tough opportunity"}
        </p>
        {typeof confidence === "number" && (
          <p className="text-[11px] text-neutral-400">AI confidence: {confidence}% — these are estimates, not guaranteed outcomes.</p>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text, id, copiedId, onCopy }) {
  const isCopied = copiedId === id;
  return (
    <button
      onClick={() => onCopy(text, id)}
      className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
    >
      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function ResearchPage() {
  const router = useRouter();
  const { addContent } = useContent();
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [generatingThumbIdx, setGeneratingThumbIdx] = useState(null);
  const [thumbDoneIdx, setThumbDoneIdx] = useState(new Set());
  const [loadingStep, setLoadingStep] = useState(0);
  const [savingBrief, setSavingBrief] = useState(false);
  const [briefSaved, setBriefSaved] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const exportRef = useRef(null);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
    const last = loadLastResult();
    if (last?.result) {
      setTopic(last.topic || "");
      setResult(last.result);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setIsExportOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isGenerating) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1 < LOADING_STEPS.length ? prev + 1 : prev));
    }, 1400);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleGenerate = async (overrideTopic) => {
    const queryTopic = (overrideTopic ?? topic).trim();
    if (!queryTopic || isGenerating) return;
    if (overrideTopic !== undefined) setTopic(overrideTopic);
    setIsGenerating(true);
    setError("");
    setResult(null);
    setActiveTab("overview");
    try {
      const res = await httpClient.post(ENDPOINTS.AI.RESEARCH, { topic: queryTopic });
      setResult(res.data);
      saveLastResult(queryTopic, res.data);
      setRecentSearches((prev) => {
        const next = [queryTopic, ...prev.filter((t) => t.toLowerCase() !== queryTopic.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
        saveRecentSearches(next);
        return next;
      });
    } catch (err) {
      setError(err.message || "Failed to generate research. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewSearch = () => {
    setTopic("");
    setResult(null);
    setError("");
    clearLastResult();
  };

  const handleRemoveRecentSearch = (t) => {
    setRecentSearches((prev) => {
      const next = prev.filter((x) => x !== t);
      saveRecentSearches(next);
      return next;
    });
  };

  const handleUseTitle = (title) => {
    router.push(`/add-content?title=${encodeURIComponent(title)}`);
  };

  const handleGenerateThumbnail = async (idea, idx) => {
    setGeneratingThumbIdx(idx);
    try {
      await httpClient.post(ENDPOINTS.AI.THUMBNAIL, { prompt: idea });
      setThumbDoneIdx((prev) => new Set(prev).add(idx));
    } catch (err) {
      setError(err.message || "Couldn't generate that thumbnail.");
    } finally {
      setGeneratingThumbIdx(null);
    }
  };

  const buildScriptText = () => {
    if (!result?.scriptOutline) return "";
    return [
      result.scriptOutline.hook,
      ...(result.scriptOutline.mainPoints || []).map((mp) => `${mp.heading}\n${mp.content}`),
      result.scriptOutline.cta,
    ].filter(Boolean).join("\n\n");
  };

  const handleSaveToBrief = async () => {
    if (!result || savingBrief) return;
    setSavingBrief(true);
    try {
      await addContent({
        title: result.titles?.[0] || topic,
        description: buildScriptText(),
        tags: result.trendingKeywords || [],
        platform: ["youtube"],
        contentType: "video",
        status: "IDEA",
      });
      setBriefSaved(true);
      setTimeout(() => setBriefSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Couldn't save to Content Library.");
    } finally {
      setSavingBrief(false);
    }
  };

  const handleJumpToThumbnails = () => {
    setActiveTab("visuals");
  };

  const handleExportMarkdown = () => {
    const md = researchToMarkdown(topic, result);
    downloadMarkdownText(md, `research-${topic || "untitled"}`);
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    const md = researchToMarkdown(topic, result);
    exportResearchPDF(topic, md, `research-${topic || "untitled"}`);
    setIsExportOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-[#0F0F0F] mb-2">AI Research Workspace</h2>
          <p className="text-neutral-500 text-sm font-medium">
            Type a topic — get titles, a script outline, thumbnail ideas, keywords, common questions, and real competitor videos in one place.
          </p>
        </div>
        {result && !isGenerating && (
          <button
            onClick={handleNewSearch}
            className="flex items-center gap-1.5 text-[11px] font-black text-neutral-500 border border-[#E2E4E9] rounded-lg px-3 py-2 hover:bg-neutral-50 hover:text-indigo-600 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" /> New Search
          </button>
        )}
      </div>

      {/* Topic input */}
      <div className="bg-white border border-[#E2E4E9] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
              placeholder="e.g. How to learn React"
              className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium outline-none focus:border-indigo-400 transition-all placeholder:text-neutral-300"
            />
          </div>
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !topic.trim()}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 bg-indigo-600 shadow-md shrink-0"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? "Researching…" : "Generate"}
          </button>
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-[12px] text-red-600 font-semibold mt-3">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
        {recentSearches.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 mt-4 pt-4 border-t border-[#F4F5F8]">
            <span className="flex items-center gap-1.5 text-[11px] font-black text-neutral-400 uppercase tracking-widest shrink-0">
              <History className="w-3.5 h-3.5" /> Recent
            </span>
            {recentSearches.map((t) => (
              <span
                key={t}
                className="group flex items-center gap-1.5 text-[11px] font-bold text-neutral-600 bg-[#F9FAFB] border border-[#E2E4E9] rounded-full pl-3 pr-1.5 py-1 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
              >
                <button onClick={() => handleGenerate(t)} disabled={isGenerating} className="disabled:opacity-50">
                  {t}
                </button>
                <button
                  onClick={() => handleRemoveRecentSearch(t)}
                  className="p-0.5 rounded-full text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!result && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-[#E2E4E9] rounded-2xl">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-indigo-50">
            <Search className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-[15px] font-bold text-neutral-500 mb-1">No research yet</p>
          <p className="text-[12px] text-neutral-400 text-center max-w-sm">
            Type a topic above and hit Generate — replaces switching between YouTube, Google, and ChatGPT for early-stage video planning.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-center">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingStep}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[12px] font-bold text-neutral-500"
              >
                {LOADING_STEPS[loadingStep]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#E2E4E9] rounded-2xl p-6 animate-pulse space-y-3">
                <div className="h-4 bg-neutral-100 rounded w-1/3" />
                <div className="h-3 bg-neutral-100 rounded w-full" />
                <div className="h-3 bg-neutral-100 rounded w-5/6" />
                <div className="h-3 bg-neutral-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow Timeline */}
      {result && !isGenerating && (
        <div className="bg-white border border-[#E2E4E9] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 shrink-0">
                <CheckCircle2 className="w-4 h-4" /> Research
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              <button
                onClick={handleSaveToBrief}
                disabled={savingBrief}
                className="flex items-center gap-1.5 text-[11px] font-black text-neutral-600 hover:text-indigo-600 transition-colors disabled:opacity-50 shrink-0"
              >
                {savingBrief ? <Loader2 className="w-4 h-4 animate-spin" /> : briefSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Bookmark className="w-4 h-4" />}
                {briefSaved ? "Saved to Library" : "Save to Library"}
              </button>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              <button onClick={handleJumpToThumbnails} className="flex items-center gap-1.5 text-[11px] font-black text-neutral-600 hover:text-indigo-600 transition-colors shrink-0">
                <ImageIcon className="w-4 h-4" /> Generate Thumbnail
              </button>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              <button onClick={() => router.push("/scheduler")} className="flex items-center gap-1.5 text-[11px] font-black text-neutral-600 hover:text-indigo-600 transition-colors shrink-0">
                <Calendar className="w-4 h-4" /> Publish
              </button>
            </div>
            <div className="relative shrink-0" ref={exportRef}>
              <button
                onClick={() => setIsExportOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-black text-neutral-500 border border-[#E2E4E9] rounded-lg px-3 py-1.5 hover:bg-neutral-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export <ChevronDown className="w-3 h-3" />
              </button>
              {isExportOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-[#E2E4E9] rounded-xl shadow-lg overflow-hidden z-10">
                  <button onClick={handleExportMarkdown} className="w-full text-left px-3 py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
                    Markdown (.md)
                  </button>
                  <button onClick={handleExportPDF} className="w-full text-left px-3 py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition-colors border-t border-neutral-100">
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isGenerating && (
        <div className="space-y-6">
          {/* Tab bar */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#E2E4E9] shadow-[0_1px_4px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.04)] w-fit flex-wrap">
            {[
              { id: "overview", label: "Overview", icon: Gauge, color: "text-indigo-600" },
              { id: "content", label: "Content", icon: FileText, color: "text-violet-600" },
              { id: "visuals", label: "Thumbnails & SEO", icon: ImageIcon, color: "text-pink-600" },
              { id: "competitors", label: "Competitors", icon: FaYoutube, color: "text-red-600" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  activeTab === tab.id ? "text-[#0F0F0F]" : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div layoutId="research-tab" className="absolute inset-0 bg-[#F4F5F8] rounded-lg border border-[#E2E4E9]" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon className={`w-4 h-4 ${tab.color}`} />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* ── Overview tab ── */}
              {activeTab === "overview" && (
                <>
                  {result.summary && (
                    <motion.div variants={staggerItem} className="lg:col-span-2">
                      <OpportunityGauge score={result.summary.opportunityScore} confidence={result.summary.confidence} />
                    </motion.div>
                  )}

                  {result.summary && (
                    <div className="lg:col-span-2">
                      <SectionCard icon={Gauge} title="Research Summary" subtitle="AI-generated overview" accent="indigo">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Competition</p>
                            <span className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${COMPETITION_COLOR[result.summary.competition] || COMPETITION_COLOR.Medium}`}>
                              {result.summary.competition}
                            </span>
                          </div>
                          <div className="p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Best Length</p>
                            <p className="text-[13px] font-bold text-[#111318]">{result.summary.bestVideoLength}</p>
                          </div>
                          <div className="p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 flex items-center gap-1"><Zap className="w-3 h-3" /> Difficulty</p>
                            <span className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${DIFFICULTY_COLOR[result.summary.difficulty] || DIFFICULTY_COLOR.Medium}`}>
                              {result.summary.difficulty}
                            </span>
                          </div>
                          <div className="p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl col-span-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 flex items-center gap-1"><Quote className="w-3 h-3" /> Common Hook</p>
                            <p className="text-[12px] font-semibold text-[#111318] italic line-clamp-2">{result.summary.commonHook}</p>
                          </div>
                          <div className="p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" /> Audience</p>
                            <p className="text-[12px] font-semibold text-[#111318] line-clamp-2">{result.summary.audience}</p>
                          </div>
                        </div>
                      </SectionCard>
                    </div>
                  )}

                  {result.recommendation && (
                    <div className="lg:col-span-2">
                      <SectionCard icon={Lightbulb} title="AI Recommendation" subtitle="Actionable advice for this video" accent="amber">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div className="p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Ideal Length</p>
                            <p className="text-[13px] font-bold text-[#111318]">{result.recommendation.idealLength}</p>
                          </div>
                          <div className="p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Color Palette</p>
                            <p className="text-[13px] font-bold text-[#111318]">{result.recommendation.colorPalette}</p>
                          </div>
                          <div className="p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" /> Target</p>
                            <p className="text-[13px] font-bold text-[#111318]">{result.recommendation.targetAudience}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {result.recommendation.include?.length > 0 && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Include</p>
                              <ul className="space-y-1">
                                {result.recommendation.include.map((item, i) => (
                                  <li key={i} className="text-[12px] text-[#111318]">• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.recommendation.avoid?.length > 0 && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                              <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2 flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Avoid</p>
                              <ul className="space-y-1">
                                {result.recommendation.avoid.map((item, i) => (
                                  <li key={i} className="text-[12px] text-[#111318]">• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </SectionCard>
                    </div>
                  )}

                  {result.contentGap && (
                    <div className="lg:col-span-2">
                      <SectionCard icon={Compass} title="Content Gap" subtitle="What's covered vs. underserved" accent="emerald">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Already Covered</p>
                            <div className="flex flex-wrap gap-2">
                              {(result.contentGap.covered || []).map((c, i) => (
                                <span key={i} className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 rounded-lg px-2.5 py-1">{c}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Underserved Opportunities</p>
                            <div className="space-y-2">
                              {(result.contentGap.gaps || []).map((g, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <p className="flex-1 text-[12px] font-semibold text-[#111318]">{g.topic}</p>
                                  <span className="text-[10px] font-black text-emerald-600 shrink-0">{g.opportunityScore}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        {result.contentGap.suggestedVideo && (
                          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <div className="flex-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Suggested Video ({result.contentGap.suggestedVideo.opportunityScore}% opportunity)</p>
                              <p className="text-[13px] font-bold text-[#111318]">{result.contentGap.suggestedVideo.title}</p>
                            </div>
                            <button
                              onClick={() => handleUseTitle(result.contentGap.suggestedVideo.title)}
                              className="text-[10px] font-black text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-all uppercase tracking-widest shrink-0"
                            >
                              Use
                            </button>
                          </div>
                        )}
                      </SectionCard>
                    </div>
                  )}
                </>
              )}

              {/* ── Content tab ── */}
              {activeTab === "content" && (
                <>
                  <SectionCard icon={FileText} title="Suggested Titles" subtitle="AI-generated" accent="violet">
                    <div className="space-y-2">
                      {(result.titles || []).map((t, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
                          <p className="flex-1 text-[13px] font-semibold text-[#111318]">{t}</p>
                          <CopyButton text={t} id={`title-${i}`} copiedId={copiedId} onCopy={handleCopy} />
                          <button
                            onClick={() => handleUseTitle(t)}
                            className="text-[10px] font-black text-violet-600 border border-violet-200 px-3 py-1.5 rounded-full hover:bg-violet-50 transition-all uppercase tracking-widest shrink-0"
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard icon={FileText} title="Script Outline" subtitle="AI-generated" accent="amber">
                    {result.scriptOutline && (
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Hook</p>
                          <p className="text-[13px] text-[#111318]">{result.scriptOutline.hook}</p>
                        </div>
                        {(result.scriptOutline.mainPoints || []).map((mp, i) => (
                          <div key={i} className="p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
                            <p className="text-[12px] font-black text-[#111318] mb-1">{mp.heading}</p>
                            <p className="text-[12px] text-neutral-500">{mp.content}</p>
                          </div>
                        ))}
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">CTA</p>
                          <p className="text-[13px] text-[#111318]">{result.scriptOutline.cta}</p>
                        </div>
                      </div>
                    )}
                  </SectionCard>
                </>
              )}

              {/* ── Thumbnails & SEO tab ── */}
              {activeTab === "visuals" && (
                <>
                  <SectionCard icon={ImageIcon} title="Thumbnail Ideas" subtitle="AI-generated concepts" accent="pink">
                    <div className="space-y-2">
                      {(result.thumbnailIdeas || []).map((idea, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
                          <p className="flex-1 text-[12px] text-[#111318]">{idea}</p>
                          <button
                            onClick={() => handleGenerateThumbnail(idea, i)}
                            disabled={generatingThumbIdx === i}
                            className="flex items-center gap-1 text-[10px] font-black text-pink-600 border border-pink-200 px-3 py-1.5 rounded-full hover:bg-pink-50 transition-all uppercase tracking-widest shrink-0 disabled:opacity-50"
                          >
                            {generatingThumbIdx === i ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : thumbDoneIdx.has(i) ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            {thumbDoneIdx.has(i) ? "In Media Library" : "Generate"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard icon={Hash} title="Trending Keywords" subtitle="AI-suggested — not live trend data" accent="cyan">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(result.trendingKeywords || []).map((k, i) => (
                        <span key={i} className="text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-lg px-2.5 py-1">{k}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleCopy((result.trendingKeywords || []).join(", "), "keywords-all")}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 hover:text-cyan-600 transition-colors"
                    >
                      {copiedId === "keywords-all" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} Copy all
                    </button>
                  </SectionCard>

                  <SectionCard icon={HelpCircle} title="Common Questions" subtitle="AI-suggested" accent="blue">
                    <div className="space-y-2 mb-3">
                      {(result.commonQuestions || []).map((q, i) => (
                        <p key={i} className="text-[12px] text-[#111318] p-2.5 bg-[#F9FAFB] border border-[#E2E4E9] rounded-lg">{q}</p>
                      ))}
                    </div>
                    <button
                      onClick={() => handleCopy((result.commonQuestions || []).join("\n"), "questions-all")}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 hover:text-blue-600 transition-colors"
                    >
                      {copiedId === "questions-all" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} Copy all
                    </button>
                  </SectionCard>
                </>
              )}

              {/* ── Competitors tab ── */}
              {activeTab === "competitors" && (
                <div className="lg:col-span-2">
                  <SectionCard icon={FaYoutube} title="Competitor Videos" subtitle="Real results from YouTube Data API" accent="red">
                    {result.competitorVideosAvailable === false ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-[13px] font-bold text-neutral-500 mb-1">No YouTube API key configured</p>
                        <p className="text-[11px] text-neutral-400 max-w-sm">
                          Set <code className="px-1 py-0.5 bg-neutral-100 rounded">YOUTUBE_API_KEY</code> on the backend (Google Cloud Console → same project as your OAuth client → Credentials → API Key, restrict to YouTube Data API v3) to see real competitor videos here.
                        </p>
                      </div>
                    ) : (result.competitorVideos || []).length === 0 ? (
                      <p className="text-[12px] text-neutral-400 text-center py-8">No competitor videos found for this topic.</p>
                    ) : (
                      <>
                        {(() => {
                          const withViews = result.competitorVideos.filter((v) => v.viewCount != null);
                          const withDurations = result.competitorVideos.filter((v) => v.duration);
                          if (withViews.length === 0) return null;
                          const avgViews = Math.round(withViews.reduce((sum, v) => sum + v.viewCount, 0) / withViews.length);
                          const avgDurationSec = withDurations.length
                            ? Math.round(withDurations.reduce((sum, v) => {
                                const parts = v.duration.split(":").map(Number);
                                return sum + (parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1]);
                              }, 0) / withDurations.length)
                            : null;
                          const avgDurationLabel = avgDurationSec != null ? `${Math.floor(avgDurationSec / 60)}:${String(avgDurationSec % 60).padStart(2, "0")}` : null;
                          return (
                            <div className="flex items-center gap-4 mb-4 text-[11px] font-bold text-neutral-500">
                              <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-red-500" /> Avg views: <span className="text-[#111318]">{formatViews(avgViews)}</span></span>
                              {avgDurationLabel && (
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-red-500" /> Avg duration: <span className="text-[#111318]">{avgDurationLabel}</span></span>
                              )}
                            </div>
                          );
                        })()}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {result.competitorVideos.map((v) => (
                            <a
                              key={v.videoId}
                              href={v.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl overflow-hidden hover:shadow-md transition-all"
                            >
                              <div className="relative aspect-video bg-neutral-200 overflow-hidden">
                                {v.thumbnail && <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                  <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {v.duration && (
                                  <span className="absolute bottom-1.5 right-1.5 text-[10px] font-bold text-white bg-black/70 rounded px-1.5 py-0.5">{v.duration}</span>
                                )}
                              </div>
                              <div className="p-3">
                                <p className="text-[12px] font-bold text-[#111318] line-clamp-2 mb-1">{v.title}</p>
                                <p className="text-[11px] text-neutral-400 line-clamp-1">{v.channelTitle}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  {v.viewCount != null && (
                                    <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                                      <Eye className="w-3 h-3" /> {formatViews(v.viewCount)}
                                    </p>
                                  )}
                                  {v.publishedAt && (
                                    <p className="text-[10px] text-neutral-300 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> {format(new Date(v.publishedAt), "PP")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                  </SectionCard>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
