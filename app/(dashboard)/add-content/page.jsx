"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, ChevronDown, Check, Upload, FileText, Video, Image as Img, Mic, Loader2, ArrowRight, ArrowLeft, Settings2, Lightbulb, ClipboardList, Type, Rocket, AlignLeft, Link as LinkIcon, Pen, Layers, Globe, Search, Target } from "lucide-react";
import { FaInstagram, FaYoutube, FaTiktok, FaTwitter } from "react-icons/fa";
import { useContent } from "@/context/ContentContext";
import AISuggestButton from "./AISuggestButton";

const TYPES = [
  { id: "video", label: "Video", sub: "YouTube, Reels, Shorts", icon: Video, gradient: "from-blue-500/10 to-blue-600/5", color: "text-blue-600" },
  { id: "article", label: "Article", sub: "Blog post, Thread", icon: FileText, gradient: "from-amber-500/10 to-amber-600/5", color: "text-amber-600" },
  { id: "image", label: "Image", sub: "Carousel, Infographic", icon: Img, gradient: "from-emerald-500/10 to-emerald-600/5", color: "text-emerald-600" },
  { id: "podcast", label: "Podcast", sub: "Episode, Interview", icon: Mic, gradient: "from-rose-500/10 to-rose-600/5", color: "text-rose-600" },
];

const PLATFORMS = [
  { id: "Instagram", icon: FaInstagram, gradient: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", brand: "#E1306C" },
  { id: "YT Shorts", icon: FaYoutube, brand: "#FF0000" },
  { id: "YouTube", icon: FaYoutube, brand: "#FF0000" },
  { id: "TikTok", icon: FaTiktok, brand: "#000000" },
  { id: "Twitter/X", icon: FaTwitter, brand: "#1DA1F2" },
];

const STEPS = [
  { label: "Details", sub: "Title, type & platforms", icon: ClipboardList },
  { label: "Media & Script", sub: "Thumbnails & content", icon: Upload },
  { label: "Review & Publish", sub: "Final check", icon: Check },
];

const TIPS = [
  "Multi-platform posting increases reach by up to 3x.",
  "Thumbnails with faces get 38% more clicks.",
  "Scripts under 10 minutes perform best on YouTube.",
];

function CompletionRing({ pct }) {
  const r = 36, c = 2 * Math.PI * r, offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="90" height="90" className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle cx="45" cy="45" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
        <circle cx="45" cy="45" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="6" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="text-[22px] font-bold text-[#0A0A0F] absolute" style={{ marginTop: 28 }}>{pct}%</span>
      <span className="text-xs text-neutral-400 font-medium">Form Completed</span>
    </div>
  );
}

function ThumbnailZone({ label, ratio, dims, value, onChange, className = "", isActive }) {
  const [dragging, setDragging] = useState(false);
  const compress = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 500;
        let w = img.width, h = img.height;
        if (w > h) { h = (h / w) * max; w = max; } else { w = (w / h) * max; h = max; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) compress(e.dataTransfer.files[0]); };

  const Icon = label.includes("Instagram") ? FaInstagram : label.includes("Shorts") ? FaYoutube : FaYoutube;
  const brandColor = label.includes("Instagram") ? "#E1306C" : "#FF0000";

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = (e) => { if (e.target.files[0]) compress(e.target.files[0]); }; input.click(); }}
      className={`relative flex-1 rounded-[14px] p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group
        ${dragging || isActive ? "border-[2px] border-solid border-[#6366F1] bg-[#6366F1]/[0.03] shadow-[0_0_0_3px_rgba(99,102,241,0.08)]" : "border-[1.5px] border-solid border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#6366F1] hover:bg-white hover:shadow-sm"}
      `}
    >
      {value ? (
        <div className="absolute inset-0 rounded-[12px] overflow-hidden p-1 bg-white border border-[#E5E7EB]">
          <img src={value} alt={label} className="w-full h-full object-cover rounded-[8px]" />
          <button 
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-all z-10"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          {/* Brand Icon Card */}
          <div className="w-[50px] h-[70px] bg-white border border-[#E5E7EB] rounded-[10px] flex items-center justify-center shadow-sm mb-1 group-hover:scale-105 group-hover:shadow-md transition-all">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white`} style={{ backgroundColor: brandColor }}>
              <Icon className="w-5 h-5" />
            </div>
          </div>

          {/* Aspect Ratio Badge */}
          <div className="bg-white border border-[#E5E7EB] px-3 py-1 rounded-[6px] text-[11px] font-[700] text-[#6B7280]">
            {ratio}
          </div>

          {/* Labels */}
          <div className="text-center">
            <div className="text-[14px] font-[700] text-[#111318]">{label}</div>
            <div className="text-[11px] text-[#9CA3AF] font-[500] mt-0.5">{dims}</div>
          </div>

          {/* Action Link */}
          <div className="flex items-center gap-1.5 text-[13px] font-[700] text-[#6366F1] mt-1 group-hover:translate-y-[-2px] transition-all">
            <Upload className="w-3.5 h-3.5" />
            Click or drag
          </div>
        </>
      )}
    </div>
  );
}

export default function AddContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { addContent, updateContent, getContentById } = useContent();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [platforms, setPlatforms] = useState([]);
  const [description, setDescription] = useState("");
  const [script, setScript] = useState("");
  const [references, setReferences] = useState("");
  const [thumbnails, setThumbnails] = useState({});
  const [tipIdx, setTipIdx] = useState(0);
  const [scriptCollapsed, setScriptCollapsed] = useState(true);

  useEffect(() => {
    if (editId) {
      // 1. Try global context first
      let item = getContentById(editId);
      
      // 2. Fallback: Check if it's a mock episode from Series Planner
      if (!item && parseInt(editId) >= 100) {
        const idNum = parseInt(editId);
        item = {
          title: idNum === 100 ? "Introduction & Setup" : `Episode ${idNum - 99}`,
          type: "video",
          platforms: ["YouTube", "YT Shorts"],
          description: "This is a pre-planned episode from the Series Planner. Use this workspace to refine your script and media assets.",
          script: "# Welcome to this episode!\\n\\nIn this video, we will cover the core concepts of our series...",
          thumbnails: { youtube: "/thumbnails/thumb1.png" }
        };
      }

      if (item) {
        setTitle(item.title || "");
        setType(item.type || "");
        setPlatforms(item.platforms || []);
        setDescription(item.description || "");
        setScript(item.script || "");
        setReferences(item.references || "");
        setThumbnails(item.thumbnails || {});
      }
    } else {
      // Handle new episode from Series Planner
      const seriesId = searchParams.get("seriesId");
      const seriesName = searchParams.get("seriesName");
      const urlTitle = searchParams.get("title");

      if (seriesId && seriesName) {
        setTitle(urlTitle || "");
        setType("video"); // Default to video for series episodes
        setDescription(`Part of the "${seriesName}" series.`);
      }
    }
  }, [editId, getContentById, searchParams]);

  useEffect(() => { setTipIdx(step % TIPS.length); }, [step]);

  const togglePlatform = (id) => setPlatforms((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const pct = useMemo(() => {
    let filled = 0, total = 5;
    if (title.trim()) filled++;
    if (type) filled++;
    if (platforms.length) filled++;
    if (description.trim()) filled++;
    if (script.trim()) filled++;
    return Math.round((filled / total) * 100);
  }, [title, type, platforms, description, script]);

  const step0Valid = title.trim().length > 0 && type;

  const checklist = [
    { label: "Title added", ok: !!title.trim() },
    { label: "Content type selected", ok: !!type },
    { label: "At least one platform", ok: platforms.length > 0 },
    { label: "Description provided", ok: !!description.trim() },
    { label: "Script written", ok: !!script.trim() },
  ];

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const save = (status) => {
    const data = { title, type, platforms, description, script, references, thumbnails, status };
    if (editId) { updateContent(editId, data); } else { addContent(data); }
    router.push(status === "draft" ? "/all-content" : "/all-content");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,680px)_300px] gap-[32px] pb-12 justify-center max-w-[1020px] mx-auto px-4 lg:px-0">
      {/* Main Column */}
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Settings2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-[22px] font-[800] text-[#0F0F0F] tracking-tight">{editId ? "Edit Content" : "Create New Content"}</h2>
            <p className="text-[14px] text-neutral-500 font-[400] mt-0.5">Build and publish content across your channels in three easy steps.</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 w-full">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => { if (i < step || (i > step && step0Valid && i === 1)) setStep(i); }}
                disabled={i > step && (!step0Valid || i > 1)}
                className={`flex items-center gap-2.5 px-4 py-2 transition-all text-left rounded-[10px] ${
                  step === i 
                    ? "bg-[#6366F1] text-white font-[600]" 
                    : i < step || (i === 1 && step0Valid)
                      ? "bg-transparent cursor-pointer hover:bg-neutral-100" 
                      : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                }`}
              >
                {i < step ? (
                  <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center bg-[#10B981] group-hover:scale-110 transition-transform">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className={`w-[28px] h-[28px] rounded-full flex items-center justify-center text-xs font-[600] ${step === i ? "bg-white/20 text-white" : "bg-transparent text-inherit"}`}>
                    {i + 1}
                  </div>
                )}
                <div>
                  <div className={`text-sm leading-tight ${step === i ? "text-white font-[600]" : i < step ? "text-[#111318] font-[600]" : "text-inherit"}`}>{s.label}</div>
                  <div className={`text-[10px] ${step === i ? "text-white/70" : i < step ? "text-neutral-500" : "text-inherit"}`}>{s.sub}</div>
                </div>
              </button>
              {i < STEPS.length - 1 && <div className={`flex-1 h-[2px] mx-3 ${i < step ? "bg-[#10B981]" : "bg-[#E5E7EB]"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <div className="relative overflow-hidden bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[28px_32px] w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" />
                <div>
                  <h3 className="text-lg font-black text-[#0F0F0F] flex items-center gap-2 mb-1"><ClipboardList className="w-5 h-5 text-[#6366F1]" /> General Details</h3>
                  <p className="text-sm text-neutral-500">Tell us about your content — what it is and where it goes.</p>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[13px] font-[600] text-[#374151] flex items-center gap-[6px] mb-[8px]">
                    <Pen className="w-4 h-4 text-neutral-400" /> Title <span className="text-[#EF4444]">*</span>
                    <div className="relative ml-2">
                      <AISuggestButton 
                        type="title" 
                        context={title} 
                        onSelect={setTitle} 
                        buttonClass="flex items-center gap-[6px] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white border-none rounded-[20px] px-[16px] py-[7px] text-[12px] font-[600]"
                        dropdownClass="absolute left-0 top-[calc(100%+8px)] w-[300px] bg-[#FFFFFF] border border-[#E2E4E9] rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden"
                      />
                    </div>
                  </label>
                  <div className="relative w-full">
                    <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">#</span>
                    <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 100))} placeholder="e.g., How to Master Tailwind CSS in 2026" className="w-full pl-[36px] pr-[14px] py-[12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#6366F1] focus:bg-[#FFFFFF] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all" />
                  </div>
                  <div className="text-right text-[10px] text-neutral-400 font-medium">{title.length}/100</div>
                </div>

                {/* Content Type */}
                <div className="space-y-3">
                  <label className="text-[13px] font-[600] text-[#374151] flex items-center gap-[6px] mb-[8px]">
                    <Settings2 className="w-4 h-4 text-neutral-400" /> Content Type <span className="text-[#EF4444]">*</span>
                    <button 
                      onClick={() => setType(TYPES[Math.floor(Math.random()*TYPES.length)].id)} 
                      className="ml-2 flex items-center gap-[6px] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white border-none rounded-[20px] px-[16px] py-[7px] text-[12px] font-[600]"
                    >
                      <Sparkles className="w-3 h-3"/> Auto-Select
                    </button>
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {TYPES.map((t) => (
                      <button key={t.id} onClick={() => setType(t.id)} className={`relative min-w-auto p-[16px_12px] rounded-[12px] transition-all text-center group cursor-pointer ${type === t.id ? "border-[2px] border-[#6366F1] bg-[#6366F1]/[0.04] shadow-[0_0_0_3px_rgba(99,102,241,0.1)]" : "border-[1.5px] border-[#E5E7EB] bg-white hover:border-[#6366F1]"}`}>
                        {type === t.id && (
                          <div className="absolute top-[8px] right-[8px] w-5 h-5 rounded-full bg-[#6366F1] flex items-center justify-center text-white shadow-sm">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        <div className={`w-[48px] h-[48px] mx-auto rounded-[12px] bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-3 transition-transform`}>
                          <t.icon className={`w-[24px] h-[24px] ${t.color}`} />
                        </div>
                        <div className="text-[15px] font-semibold text-[#111318]">{t.label}</div>
                        <div className="text-[12px] text-[#8A91A8] mt-0.5">{t.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-[8px]">
                    <label className="text-[13px] font-[600] text-[#374151] flex items-center gap-[6px]"><Rocket className="w-4 h-4 text-neutral-400" /> Upload to</label>
                    <span className="text-[11px] text-[#9CA3AF] font-[400]">Select platforms</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {PLATFORMS.map((p) => {
                      const active = platforms.includes(p.id);
                      const activeStyle = { border: `1.5px solid ${p.brand}`, backgroundColor: `${p.brand}10`, color: p.brand, fontWeight: 600 };
                      const inactiveStyle = { border: '1.5px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#374151', fontWeight: 500 };
                      return (
                        <button key={p.id} onClick={() => togglePlatform(p.id)} className="flex items-center justify-center gap-[7px] px-[14px] py-[8px] rounded-[20px] transition-all text-[13px] hover:scale-[1.02] active:scale-95" style={active ? activeStyle : inactiveStyle}>
                          <p.icon className="w-[18px] h-[18px]" style={{ color: p.brand }} />
                          {p.id}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-[8px]">
                    <label className="text-[13px] font-[600] text-[#374151] flex items-center gap-[6px]"><FileText className="w-4 h-4 text-neutral-400" /> Description</label>
                    <span className="text-[11px] text-[#9CA3AF] font-[400]">Recommended</span>
                  </div>
                  <div className="relative group">
                    <Search className="absolute left-[14px] top-[14px] w-4 h-4 text-neutral-400 group-focus-within:text-[#6366F1] transition-colors" />
                    <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} rows={4} placeholder="A short summary of your content to help with planning and SEO..." className="w-full pl-[36px] pr-[14px] pb-[50px] pt-[12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#6366F1] focus:bg-[#FFFFFF] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all resize-none" />
                    <AISuggestButton 
                      type="description" 
                      context={title} 
                      onSelect={setDescription} 
                      buttonClass="absolute right-[8px] bottom-[8px] flex items-center gap-[6px] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white border-none rounded-[20px] px-[16px] py-[7px] text-[12px] font-[600]"
                      dropdownClass="absolute left-0 top-[calc(100%+8px)] w-full bg-[#FFFFFF] border border-[#E2E4E9] rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden"
                    />
                  </div>
                  <div className="text-right text-[10px] text-neutral-400 font-medium">{description.length}/300</div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="relative overflow-hidden bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[28px_32px] w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" />
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-9 h-9 rounded-[10px] bg-indigo-50 flex items-center justify-center text-[#6366F1]">
                      <Img className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-[#111318]">Thumbnails & Content</h3>
                  </div>
                  <p className="text-sm text-neutral-400 font-medium">Design your thumbnails and write your content script.</p>
                </div>

                {/* Thumbnails */}
                <div className="space-y-4">
                  <label className="text-[13px] font-[600] text-[#374151] flex items-center gap-[6px] tracking-tight"><Img className="w-4 h-4 text-neutral-400" /> Thumbnail Design</label>
                  <div className="flex items-stretch justify-center gap-4">
                    <ThumbnailZone label="Instagram Reels" ratio="9:16" dims="1080×1920px" value={thumbnails.instagram} onChange={(v) => setThumbnails((t) => ({ ...t, instagram: v }))} />
                    <ThumbnailZone label="YouTube Shorts" ratio="9:16" dims="1080×1920px" isActive value={thumbnails.shorts} onChange={(v) => setThumbnails((t) => ({ ...t, shorts: v }))} />
                    <ThumbnailZone label="YouTube" ratio="16:9" dims="1920×1080px" value={thumbnails.youtube} onChange={(v) => setThumbnails((t) => ({ ...t, youtube: v }))} />
                  </div>
                </div>

                {/* Script */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-[8px]">
                    <label className="text-[13px] font-[600] text-[#374151] flex items-center gap-[6px]"><FileText className="w-4 h-4 text-neutral-400" /> Content Script</label>
                    <span className="text-[11px] text-[#9CA3AF] font-[400]">Write or paste your script</span>
                  </div>
                  <div className="relative group">
                    <textarea 
                      value={script} 
                      onChange={(e) => setScript(e.target.value)} 
                      rows={10} 
                      placeholder="Start writing your script here. You can structure it with intros, hooks, main points, and CTAs..." 
                      className="w-full min-h-[240px] px-[14px] py-[12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#6366F1] focus:bg-[#FFFFFF] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all resize-none leading-relaxed" 
                    />
                    <AISuggestButton 
                      type="script" 
                      context={title} 
                      onSelect={setScript} 
                      buttonClass="absolute right-[8px] bottom-[8px] flex items-center gap-[6px] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white border-none rounded-[20px] px-[16px] py-[7px] text-[12px] font-[600]"
                      dropdownClass="absolute left-0 bottom-full mb-2 w-full bg-white border border-[#E2E4E9] rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden"
                    />
                    <div className="absolute left-[14px] bottom-[14px] flex items-center gap-[8px]">
                      <span className="bg-[#F4F5F8] rounded-full px-3 py-1 text-[11px] text-[#6B7280] font-bold">{wordCount} words</span>
                      <span className="bg-[#F4F5F8] rounded-full px-3 py-1 text-[11px] text-[#6B7280] font-bold">~{readTime} min read</span>
                    </div>
                  </div>
                </div>
                {/* References */}
                <div className="space-y-3">
                  <label className="text-[13px] font-[600] text-[#374151] flex items-center gap-[6px] mb-[8px]"><LinkIcon className="w-4 h-4 text-neutral-400" /> References <span className="text-[11px] text-[#9CA3AF] font-[400] ml-2">Optional</span></label>
                  <textarea value={references} onChange={(e) => setReferences(e.target.value)} rows={3} placeholder="Links, notes, resources..." className="w-full px-[14px] py-[12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#6366F1] focus:bg-[#FFFFFF] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all resize-none" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="relative overflow-hidden bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[28px_32px] w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" />
                <div>
                  <h3 className="text-lg font-black text-[#111318] flex items-center gap-2 mb-1"><Check className="w-5 h-5 text-[#6366F1]" /> Review & Publish</h3>
                  <p className="text-sm text-neutral-400 font-medium">Review your content before publishing.</p>
                </div>

                {/* Preview Card */}
                <div className="border border-black/[0.06] rounded-xl p-6 bg-[#FAFAFA] space-y-4">
                  <h4 className="text-lg font-bold text-[#0F0F0F]">{title || "Untitled"}</h4>
                  <div className="flex gap-2 flex-wrap">
                    {type && <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100 capitalize">{type}</span>}
                    {platforms.map((p) => <span key={p} className="px-2.5 py-1 bg-[#F3F4F6] text-[#374151] text-xs font-medium rounded-lg border border-black/[0.04]">{p}</span>)}
                  </div>
                  {description && <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>}
                  {Object.values(thumbnails).filter(Boolean).length > 0 ? (
                    <div className="flex gap-3">
                      {Object.entries(thumbnails).filter(([, v]) => v).map(([k, v]) => (
                        <img key={k} src={v} alt={k} className="h-20 rounded-lg border border-black/[0.04] object-cover shadow-sm" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 rounded-[12px] bg-[#F9FAFB] border-[1.5px] border-dashed border-[#E5E7EB] text-[#9CA3AF] text-[13px] font-[500] justify-center">
                      <Img className="w-4 h-4" /> No thumbnails attached
                    </div>
                  )}
                  {script && (
                    <div className="border border-black/[0.04] rounded-lg overflow-hidden bg-white">
                      <button 
                        onClick={() => setScriptCollapsed(!scriptCollapsed)}
                        className="w-full flex items-center justify-between p-4 bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors"
                      >
                        <span className="text-sm font-bold text-[#0F0F0F] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          Script Preview
                        </span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${!scriptCollapsed ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {!scriptCollapsed && (
                          <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: "auto" }} 
                            exit={{ height: 0 }} 
                            className="overflow-hidden relative"
                          >
                            <pre className="text-xs text-neutral-500 p-4 whitespace-pre-wrap max-h-[300px] overflow-y-auto font-mono leading-relaxed border-t border-black/[0.04]">
                              {script}
                            </pre>
                            {script.length > 200 && (
                              <div className="absolute bottom-0 left-0 w-full h-[40px] bg-gradient-to-t from-[#FFFFFF] to-transparent pointer-events-none" />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Checklist */}
                <div className="space-y-0">
                  <label className="text-sm font-bold text-[#0F0F0F] mb-3 block">✅ Pre-publish Checklist</label>
                  {checklist.map((c, i) => (
                    <div key={i} className="flex items-center gap-[10px] py-[10px] border-b border-[#F4F5F8] last:border-0">
                      <div className={`w-[20px] h-[20px] rounded-full flex items-center justify-center ${c.ok ? "bg-[#10B981] text-white" : "bg-[#E2E4E9] text-[#9CA3AF]"}`}>
                        {c.ok ? <Check className="w-3 h-3" /> : <span className="text-[10px] font-bold">✕</span>}
                      </div>
                      <span className={`text-[14px] ${c.ok ? "text-[#111318]" : "text-[#9CA3AF]"}`}>{c.label}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button onClick={() => save("draft")} className="flex-1 flex items-center justify-center gap-[8px] py-[12px] bg-transparent border-[1.5px] border-[#E5E7EB] rounded-[10px] text-[15px] font-[600] text-[#374151] hover:bg-[#F9FAFB] transition-all">Save Draft</button>
                  <button onClick={() => save("published")} className="flex-1 flex items-center justify-center gap-[8px] py-[12px] bg-[#6366F1] text-white rounded-[10px] text-[15px] font-[600] shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:brightness-110 transition-all">Publish Now</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step < 2 && (
          <div className="flex justify-between">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center justify-center gap-[8px] px-[20px] py-[12px] bg-transparent rounded-[10px] text-[15px] font-[600] text-[#4B5264] hover:bg-neutral-100 transition-all">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}
            <button onClick={() => setStep(step + 1)} disabled={step === 0 && !step0Valid} className={`flex items-center justify-center gap-[8px] px-[28px] py-[12px] rounded-[10px] text-[15px] font-[600] transition-all ${step === 0 && !step0Valid ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed opacity-50" : "bg-[#6366F1] text-white shadow-[0_2px_8px_rgba(99,102,241,0.25)] hover:brightness-110"}`}>
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {pct > 0 && (
          <motion.div 
            initial={{ opacity: 0, width: 0, marginLeft: 0 }} 
            animate={{ opacity: 1, width: 300, marginLeft: 32 }} 
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            className="space-y-6 hidden lg:block overflow-hidden shrink-0"
          >
            <div className="w-[300px] space-y-6 sticky top-[104px]">
              {/* Completion */}
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-5 text-center relative shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center gap-1.5 mb-4 justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#6366F1]" />
                  <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span className="text-[14px] font-[700] text-[#111318]">Completion</span>
                </div>
                <CompletionRing pct={pct} />
              </div>

              {/* Content Summary */}
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="p-5 border-b border-[#E5E7EB] flex items-center gap-2 bg-[#FFFFFF]">
                  <Layers className="w-4 h-4 text-[#6366F1]" />
                  <span className="text-[14px] font-[700] text-[#111318]">Content Summary</span>
                </div>
                <div className="flex flex-col">
                {[
                  { label: "Title", value: title || "—", icon: Pen },
                  { label: "Type", value: type || "—", icon: Layers },
                  { label: "Platforms", value: platforms.length > 0 ? platforms.length + " selected" : "—", icon: Globe },
                  { label: "Thumbnails", value: `${Object.values(thumbnails).filter(Boolean).length}/3 added`, icon: Img },
                  { label: "Script", value: script ? `${wordCount} words` : "—", icon: FileText },
                ].map((r, i) => (
                  <div key={r.label} className={`flex items-center justify-between p-[12px_20px] text-sm ${i % 2 === 0 ? "bg-[#FAFAFA]" : "bg-[#FFFFFF]"}`}>
                    <div className="flex items-center gap-2.5">
                      <r.icon className={`w-3.5 h-3.5 ${r.value === "—" ? "text-neutral-300" : "text-[#6366F1]"}`} />
                      <span className="text-[#8A91A8] font-[500] text-[13px]">{r.label}</span>
                    </div>
                    <span className="text-[#111318] font-[600] text-xs truncate max-w-[120px]">{r.value}</span>
                  </div>
                ))}
                </div>
              </div>

              {/* Pro Tip */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-[16px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-white/60 backdrop-blur-sm border border-amber-200/50 flex items-center justify-center text-amber-600 shadow-sm">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-[700] text-amber-900">Pro Tip</span>
                </div>
                <p className="text-[13px] text-amber-800/80 leading-relaxed font-[500]">{TIPS[tipIdx]}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
