"use client";
import { useState } from "react";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";

export default function AISuggestButton({ type, context, onSelect, buttonClass, dropdownClass }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, prompt: context, isDefaultPrompt: !context }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setOpen(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className={buttonClass || "flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 shadow-md shadow-purple-600/20"}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        GENERATE
      </button>
      {open && suggestions.length > 0 && (
        <div className={dropdownClass || "absolute right-0 top-full mt-2 w-80 bg-[#FCFCFD] border border-black/[0.08] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] z-50 overflow-hidden"}>
          <div className="p-3 border-b border-black/[0.04] flex justify-between items-center">
            <span className="text-xs font-bold text-[#00BFFF] uppercase tracking-wider">AI Suggestions</span>
            <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600 text-xs">✕</button>
          </div>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { onSelect(s); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-[#374151] hover:bg-cyan-50 transition-colors border-b border-black/[0.02] last:border-0"
            >
              {s.length > 120 ? s.slice(0, 120) + "…" : s}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
