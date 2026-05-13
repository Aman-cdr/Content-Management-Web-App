"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Check, Upload, FileText, Video, Image as Img, Mic,
  ArrowRight, ArrowLeft, AlignLeft, Link as LinkIcon,
  ChevronDown,
} from "lucide-react";
import { FaInstagram, FaYoutube, FaTiktok, FaTwitter } from "react-icons/fa";
import { useContent } from "@/context/ContentContext";
import AISuggestButton from "./AISuggestButton";

const TYPES = [
  { id: "video",   label: "Video",   sub: "YouTube, Reels, Shorts",   icon: Video,    gradient: "from-blue-500/10 to-blue-600/5",       color: "text-blue-500"    },
  { id: "article", label: "Article", sub: "Blog post, Thread",         icon: FileText, gradient: "from-amber-500/10 to-amber-600/5",     color: "text-amber-500"   },
  { id: "image",   label: "Image",   sub: "Carousel, Infographic",     icon: Img,      gradient: "from-emerald-500/10 to-emerald-600/5", color: "text-emerald-500" },
  { id: "podcast", label: "Podcast", sub: "Episode, Interview",        icon: Mic,      gradient: "from-rose-500/10 to-rose-600/5",       color: "text-rose-500"    },
];

const PLATFORMS = [
  { id: "Instagram", icon: FaInstagram, brand: "#E1306C" },
  { id: "YT Shorts", icon: FaYoutube,   brand: "#FF0000" },
  { id: "YouTube",   icon: FaYoutube,   brand: "#FF0000" },
  { id: "TikTok",    icon: FaTiktok,    brand: "#010101" },
  { id: "Twitter/X", icon: FaTwitter,   brand: "#1DA1F2" },
];

const STEPS = [
  { label: "Details",        sub: "Title, type & platforms" },
  { label: "Media & Script", sub: "Thumbnails & content"    },
  { label: "Review",         sub: "Final check"             },
];

// ─── Thumbnail Zone ───────────────────────────────────────────────────────────
function ThumbnailZone({ label, ratio, dims, value, onChange }) {
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
  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = (e) => { if (e.target.files[0]) compress(e.target.files[0]); };
    input.click();
  };
  const PlatformIcon = label.includes("Instagram") ? FaInstagram : FaYoutube;
  const brandColor   = label.includes("Instagram") ? "#E1306C" : "#FF0000";
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) compress(e.dataTransfer.files[0]); }}
      onClick={handleClick}
      className={`relative flex-1 min-h-[170px] rounded-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer group transition-all
        ${dragging
          ? "border-2 border-[#6366F1] bg-indigo-50"
          : value ? "" : "border-2 border-dashed border-[#D1D5DB] hover:border-[#6366F1] hover:bg-white/60"
        }`}
    >
      {value ? (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-red-500 z-10 transition-colors"
          >✕</button>
        </div>
      ) : (
        <>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform" style={{ backgroundColor: brandColor }}>
            <PlatformIcon className="w-5 h-5" />
          </div>
          <div className="text-center">
            <div className="text-[13px] font-semibold text-[#374151]">{label}</div>
            <div className="text-[11px] text-[#9CA3AF] mt-0.5">{ratio} · {dims}</div>
          </div>
          <div className="text-[11px] font-semibold text-[#6366F1] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="w-3 h-3" /> Click or drag
          </div>
        </>
      )}
    </div>
  );
}

// ─── Field section wrapper ────────────────────────────────────────────────────
function Field({ label, required, optional, hint, action, children }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#1A1D23]">{label}</span>
          {required && <span className="text-[11px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded-md">Required</span>}
          {optional && <span className="text-[12px] text-[#9CA3AF]">· Optional</span>}
        </div>
        {action}
      </div>
      {hint && <p className="text-[12px] text-neutral-400 -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 bg-white border border-[#E2E4E9] rounded-xl text-sm text-[#111318] placeholder:text-[#B8BCC8] focus:outline-none focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all";

// ─── AI pill button ───────────────────────────────────────────────────────────
const aiBtnCls = "flex items-center gap-1.5 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white rounded-full px-4 py-1.5 text-[11px] font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-indigo-500/20";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AddContentPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get("edit");
  const { addContent, updateContent, getContentById } = useContent();

  const [step,        setStep]        = useState(0);
  const [title,       setTitle]       = useState("");
  const [type,        setType]        = useState("");
  const [platforms,   setPlatforms]   = useState([]);
  const [description, setDescription] = useState("");
  const [script,      setScript]      = useState("");
  const [references,  setReferences]  = useState("");
  const [thumbnails,  setThumbnails]  = useState({});
  const [scriptOpen,  setScriptOpen]  = useState(false);

  useEffect(() => {
    if (editId) {
      let item = getContentById(editId);
      if (!item && parseInt(editId) >= 100) {
        const n = parseInt(editId);
        item = {
          title: n === 100 ? "Introduction & Setup" : `Episode ${n - 99}`,
          type: "video", platforms: ["YouTube", "YT Shorts"],
          description: "Pre-planned episode from the Series Planner.",
          script: "# Welcome!\n\nIn this video we cover...",
          thumbnails: { youtube: "/thumbnails/thumb1.png" },
        };
      }
      if (item) {
        setTitle(item.title || ""); setType(item.type || "");
        setPlatforms(item.platforms || []); setDescription(item.description || "");
        setScript(item.script || ""); setReferences(item.references || "");
        setThumbnails(item.thumbnails || {});
      }
    } else {
      const seriesId   = searchParams.get("seriesId");
      const seriesName = searchParams.get("seriesName");
      const urlTitle   = searchParams.get("title");
      if (seriesId && seriesName) {
        setTitle(urlTitle || "");
        setType("video");
        setDescription(`Part of the "${seriesName}" series.`);
      }
    }
  }, [editId, getContentById, searchParams]);

  const togglePlatform = (id) =>
    setPlatforms((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const step0Valid  = title.trim().length > 0 && !!type;
  const canContinue = step === 0 ? step0Valid : true;

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));

  const checklist = [
    { label: "Title added",           ok: !!title.trim()       },
    { label: "Content type selected", ok: !!type               },
    { label: "Platform selected",     ok: platforms.length > 0 },
    { label: "Description provided",  ok: !!description.trim() },
    { label: "Script written",        ok: !!script.trim()      },
  ];

  const save = (status) => {
    const data = { title, type, platforms, description, script, references, thumbnails, status };
    if (editId) { updateContent(editId, data); } else { addContent(data); }
    router.push("/all-content");
  };

  return (
    <>
      <div className="w-full px-8 xl:px-14 pb-32 space-y-10">

        {/* ── Step indicator ──────────────────────────────────────────── */}
        <div>
          {/* Thin progress track */}
          <div className="relative h-[3px] bg-[#E9EAEC] rounded-full overflow-hidden mb-5">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
          {/* Step labels */}
          <div className="flex items-start">
            {STEPS.map((s, i) => {
              const done   = i < step;
              const active = i === step;
              return (
                <div key={i} className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all
                        ${done ? "bg-emerald-500 text-white" : active ? "text-white" : "bg-[#E5E7EB] text-[#9CA3AF]"}`}
                      style={active ? { backgroundColor: "var(--t-primary)" } : {}}
                    >
                      {done ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <span className={`text-[13px] font-semibold transition-colors
                      ${active ? "text-[#111318]" : done ? "text-neutral-500" : "text-[#9CA3AF]"}`}>
                      {s.label}
                    </span>
                  </div>
                  {active && (
                    <p className="text-[11px] text-neutral-400 mt-1 ml-8">{s.sub}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step content ────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-10"
          >

            {/* ── Step 0: Details ─────────────────────────────────────── */}
            {step === 0 && (
              <>
                {/* Title */}
                <Field
                  label="Title" required
                  action={
                    <div className="relative">
                      <AISuggestButton type="title" context={title} onSelect={setTitle}
                        buttonClass={aiBtnCls}
                        dropdownClass="absolute right-0 top-[calc(100%+8px)] w-[300px] bg-white border border-[#E2E4E9] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.10)] z-50 overflow-hidden"
                      />
                    </div>
                  }
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm select-none">#</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                      placeholder="e.g., How to Master Tailwind CSS in 2026"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                  <div className="text-right text-[11px] text-neutral-400">{title.length}/100</div>
                </Field>

                {/* Content Type */}
                <Field
                  label="Content Type" required
                  action={
                    <button onClick={() => setType(TYPES[Math.floor(Math.random() * TYPES.length)].id)} className={aiBtnCls}>
                      <Sparkles className="w-3 h-3" /> Auto-Select
                    </button>
                  }
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className="relative py-6 px-3 rounded-2xl text-center transition-all group border bg-white hover:shadow-sm"
                        style={type === t.id
                          ? { borderWidth: "2px", borderColor: "var(--t-primary)", boxShadow: "0 0 0 4px var(--t-primary-light)" }
                          : { borderColor: "#E2E4E9" }}
                      >
                        {type === t.id && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--t-primary)" }}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                          <t.icon className={`w-6 h-6 ${t.color}`} />
                        </div>
                        <div className="text-[14px] font-semibold text-[#111318]">{t.label}</div>
                        <div className="text-[11px] text-[#9CA3AF] mt-0.5">{t.sub}</div>
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Platforms */}
                <Field
                  label="Publish to"
                  hint="Select the platforms where this content will be published."
                  action={
                    platforms.length === PLATFORMS.length
                      ? <button onClick={() => setPlatforms([])} className="text-[12px] font-semibold text-red-400 hover:text-red-600 transition-colors">Clear all</button>
                      : <button onClick={() => setPlatforms(PLATFORMS.map((p) => p.id))} className="text-[12px] font-semibold text-[#6366F1] hover:text-indigo-700 transition-colors">Select all</button>
                  }
                >
                  <div className="flex flex-wrap gap-2.5">
                    {PLATFORMS.map((p) => {
                      const active = platforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePlatform(p.id)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:scale-[1.02] active:scale-95"
                          style={active
                            ? { border: `1.5px solid ${p.brand}`, backgroundColor: `${p.brand}12`, color: p.brand }
                            : { border: "1.5px solid #E2E4E9", backgroundColor: "#FFFFFF", color: "#374151" }
                          }
                        >
                          <p.icon className="w-3.5 h-3.5" style={{ color: p.brand }} />
                          {p.id}
                        </button>
                      );
                    })}
                  </div>
                  {platforms.length === 0 && (
                    <p className="text-[11px] text-amber-500 mt-1">No platform selected — content will be saved as a draft.</p>
                  )}
                </Field>

                {/* Description */}
                <Field
                  label="Description" optional
                  hint="A brief summary for planning, SEO, and platform descriptions."
                  action={
                    <div className="relative">
                      <AISuggestButton type="description" context={title} onSelect={setDescription}
                        buttonClass={aiBtnCls}
                        dropdownClass="absolute right-0 top-[calc(100%+8px)] w-[320px] bg-white border border-[#E2E4E9] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.10)] z-50 overflow-hidden"
                      />
                    </div>
                  }
                >
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                    rows={4}
                    placeholder="A short summary of your content..."
                    className={`${inputCls} resize-none leading-relaxed`}
                  />
                  <div className="text-right text-[11px] text-neutral-400">{description.length}/300</div>
                </Field>
              </>
            )}

            {/* ── Step 1: Media & Script ───────────────────────────────── */}
            {step === 1 && (
              <>
                {/* Thumbnails */}
                <Field label="Thumbnails" hint="Upload platform-specific thumbnails. Drag & drop or click each zone.">
                  <div className="flex gap-4">
                    <ThumbnailZone label="Instagram Reels" ratio="9:16" dims="1080×1920" value={thumbnails.instagram} onChange={(v) => setThumbnails((t) => ({ ...t, instagram: v }))} />
                    <ThumbnailZone label="YouTube Shorts"  ratio="9:16" dims="1080×1920" value={thumbnails.shorts}    onChange={(v) => setThumbnails((t) => ({ ...t, shorts: v }))}    />
                    <ThumbnailZone label="YouTube"         ratio="16:9" dims="1920×1080" value={thumbnails.youtube}   onChange={(v) => setThumbnails((t) => ({ ...t, youtube: v }))}   />
                  </div>
                </Field>

                {/* Script */}
                <Field
                  label="Content Script"
                  hint="Write your full script — intro, hook, main points, CTA."
                  action={
                    <div className="relative">
                      <AISuggestButton type="script" context={title} onSelect={setScript}
                        buttonClass={aiBtnCls}
                        dropdownClass="absolute right-0 bottom-[calc(100%+8px)] w-[340px] bg-white border border-[#E2E4E9] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.10)] z-50 overflow-hidden"
                      />
                    </div>
                  }
                >
                  <div className="rounded-2xl border border-[#E2E4E9] overflow-hidden bg-white focus-within:border-[#6366F1] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all">
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      rows={14}
                      placeholder="Write your script here..."
                      className="w-full px-5 py-4 bg-transparent text-sm text-[#111318] placeholder:text-[#B8BCC8] focus:outline-none resize-none leading-relaxed"
                    />
                    <div className="px-5 py-3 border-t border-[#F0F1F3] flex items-center gap-2 bg-[#FAFAFA]">
                      <span className="bg-white border border-[#E2E4E9] rounded-full px-2.5 py-0.5 text-[11px] text-[#6B7280] font-semibold">{wordCount} words</span>
                      <span className="bg-white border border-[#E2E4E9] rounded-full px-2.5 py-0.5 text-[11px] text-[#6B7280] font-semibold">~{readTime} min read</span>
                    </div>
                  </div>
                </Field>

                {/* References */}
                <Field label="References" optional hint="Links, notes, or research sources for this content.">
                  <textarea
                    value={references}
                    onChange={(e) => setReferences(e.target.value)}
                    rows={3}
                    placeholder="https://..."
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </>
            )}

            {/* ── Step 2: Review ───────────────────────────────────────── */}
            {step === 2 && (
              <>
                {/* Content summary */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[20px] font-bold text-[#0F0F0F] leading-tight">{title || "Untitled"}</h3>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {type && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-bold rounded-lg border border-indigo-100 capitalize">{type}</span>}
                        {platforms.map((p) => (
                          <span key={p} className="px-2.5 py-1 bg-[#F3F4F6] text-[#374151] text-[11px] font-medium rounded-lg border border-[#E5E7EB]">{p}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full flex-shrink-0 ml-4">
                      {checklist.filter((c) => c.ok).length}/{checklist.length} complete
                    </span>
                  </div>
                  {description && <p className="text-[14px] text-neutral-500 leading-relaxed">{description}</p>}
                  {Object.values(thumbnails).filter(Boolean).length > 0 && (
                    <div className="flex gap-3 mt-2">
                      {Object.entries(thumbnails).filter(([, v]) => v).map(([k, v]) => (
                        <img key={k} src={v} alt={k} className="h-20 rounded-xl border border-[#E5E7EB] object-cover shadow-sm" />
                      ))}
                    </div>
                  )}
                  {script && (
                    <div className="rounded-2xl border border-[#E2E4E9] overflow-hidden bg-white">
                      <button
                        onClick={() => setScriptOpen(!scriptOpen)}
                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors"
                      >
                        <span className="text-[13px] font-semibold text-[#374151] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" /> Script Preview
                        </span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${scriptOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {scriptOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                            <pre className="text-[11px] text-neutral-500 px-5 py-4 whitespace-pre-wrap max-h-[260px] overflow-y-auto font-mono leading-relaxed border-t border-[#F0F1F3]">
                              {script}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Checklist */}
                <div>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Checklist</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {checklist.map((c, i) => (
                      <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                        ${c.ok ? "border-emerald-200 bg-emerald-50/60" : "border-[#E2E4E9] bg-white"}`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.ok ? "bg-emerald-500" : "bg-[#E5E7EB]"}`}>
                          {c.ok ? <Check className="w-3 h-3 text-white" /> : <span className="text-[9px] text-[#9CA3AF] font-bold">–</span>}
                        </div>
                        <span className={`text-[13px] ${c.ok ? "text-[#111318] font-medium" : "text-[#9CA3AF]"}`}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Publish */}
                <div className="flex gap-3">
                  <button onClick={() => save("draft")} className="flex-1 py-3.5 rounded-2xl text-[14px] font-semibold text-[#374151] border border-[#E2E4E9] bg-white hover:bg-[#F9FAFB] transition-colors">
                    Save as Draft
                  </button>
                  <button onClick={() => save("published")} className="flex-1 py-3.5 rounded-2xl text-[14px] font-semibold text-white hover:brightness-110 transition-all" style={{ backgroundColor: "var(--t-primary)", boxShadow: "0 4px 16px var(--t-primary-glow)" }}>
                    Publish Now
                  </button>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Fixed bottom nav ────────────────────────────────────────────────── */}
      {step < 2 && (
        <div className="fixed bottom-0 left-[240px] right-0 z-40 bg-white/90 backdrop-blur-md border-t border-[#E9EAEC] px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              {step > 0 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[#4B5264] hover:bg-[#F3F4F6] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <span className="text-[13px] text-neutral-400 font-medium">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</span>
              )}
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${i === step ? "w-6 h-2" : i < step ? "w-2 h-2 bg-emerald-400" : "w-2 h-2 bg-[#E5E7EB]"}`}
                    style={i === step ? { backgroundColor: "var(--t-primary)" } : {}}
                  />
                ))}
              </div>
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canContinue}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-semibold transition-all
                  ${!canContinue
                    ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                    : "text-white hover:brightness-110"
                  }`}
                  style={canContinue ? { backgroundColor: "var(--t-primary)", boxShadow: "0 2px 12px var(--t-primary-glow)" } : {}}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
