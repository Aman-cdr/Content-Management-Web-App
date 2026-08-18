"use client";

import { useState } from "react";
import { Captions, Loader2, AlertCircle, RefreshCw } from "lucide-react";

const STYLES = [
  { value: "clean", label: "Clean" },
  { value: "karaoke", label: "Karaoke" },
];

function CaptionCue({ cue, onEdit }) {
  const [text, setText] = useState(cue.text);

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
      <span className="text-[10px] font-black text-neutral-400 tabular-nums pt-2 w-20 shrink-0">
        {cue.start.toFixed(1)}s
      </span>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { if (text !== cue.text) onEdit({ ...cue, text }); }}
        rows={2}
        className="flex-1 bg-white border border-[#E2E4E9] rounded-lg px-3 py-2 text-sm font-medium text-[#111318] outline-none focus:border-indigo-400 resize-none"
      />
      <select
        value={cue.style}
        onChange={(e) => onEdit({ ...cue, style: e.target.value })}
        className="text-[10px] font-black uppercase tracking-widest bg-white border border-[#E2E4E9] rounded-lg px-2 py-2 outline-none focus:border-indigo-400"
      >
        {STYLES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Word-level caption cues, editable inline. Two starter styles for Phase 1 —
 * "Clean" (static line) and "Karaoke" (per-word highlight, burned in via ASS
 * \k timing tags at render time). The full kinetic-style library is Phase 3.
 */
export default function CaptionPanel({ captionTrack, isTranscribing, error, onTranscribe, onChange }) {
  const handleCueEdit = (index, nextCue) => {
    onChange(captionTrack.map((cue, i) => (i === index ? nextCue : cue)));
  };

  return (
    <div className="bg-white border border-[#E2E4E9] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Captions className="w-4 h-4 text-indigo-600" />
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Captions</span>
        </div>
        <button
          onClick={onTranscribe}
          disabled={isTranscribing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F5F8] text-[#4B5264] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all disabled:opacity-50"
        >
          {isTranscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {captionTrack.length > 0 ? "Regenerate" : "Generate captions"}
        </button>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      {captionTrack.length === 0 ? (
        <p className="text-xs text-neutral-400 italic py-6 text-center">
          {isTranscribing ? "Transcribing audio…" : "No captions yet — generate word-level captions from this video's audio."}
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {captionTrack.map((cue, index) => (
            <CaptionCue key={`${cue.start}-${index}`} cue={cue} onEdit={(next) => handleCueEdit(index, next)} />
          ))}
        </div>
      )}
    </div>
  );
}
