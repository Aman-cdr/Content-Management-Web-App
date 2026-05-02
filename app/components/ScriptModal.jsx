"use client";

import { useState } from "react";
import { Sparkles, FileText, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import Modal from "./Modal";
import { useGenerateScript } from "@/lib/use-dashboard-data";

export default function ScriptModal({ isOpen, onClose }) {
  const { script, loading, error, generate, reset } = useGenerateScript();
  const [topic, setTopic] = useState("No-code AI Tutorial");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [validationError, setValidationError] = useState("");

  const handleGenerate = () => {
    const trimmedTopic = topic.trim();
    if (trimmedTopic.length < 3) {
      setValidationError("Topic must be at least 3 characters long.");
      return;
    }
    setValidationError("");
    generate(trimmedTopic);
  };

  const handleClose = () => {
    reset();
    setTopic("No-code AI Tutorial");
    setCopiedIndex(null);
    setValidationError("");
    onClose();
  };

  const handleCopySection = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Script Generator" maxWidth="max-w-3xl">
      {/* Topic Input */}
      {!script && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#0F0F0F] mb-2">
              Topic or Idea
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (validationError) setValidationError("");
              }}
              placeholder="e.g., React Server Components explained..."
              className={`w-full px-4 py-3 bg-[#F9FAFB] border ${validationError ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-black/[0.06] focus:border-purple-500/50 focus:ring-purple-500/20'} rounded-2xl text-[#0F0F0F] placeholder:text-neutral-400 outline-none focus:ring-1 transition-all`}
            />
            {validationError && (
              <p className="text-red-600 text-xs mt-2">{validationError}</p>
            )}
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-purple-50 border border-purple-100">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <p className="text-sm text-neutral-600">
              Our AI will generate a full video script outline with timestamps, hooks, and CTAs.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Script...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Script
              </>
            )}
          </button>
        </div>
      )}

      {/* Generated Script */}
      {script && (
        <div className="space-y-6">
          {/* Script Header */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100">
            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-lg text-[#0F0F0F] mb-1">{script.script.title}</h4>
                <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium">
                  <span>Est. {script.script.estimatedLength}</span>
                  <span>•</span>
                  <span>{script.model}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {script.script.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-100 text-purple-600 border border-purple-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Script Sections */}
          <div className="space-y-3">
            {script.script.sections.map((section, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#F9FAFB] border border-black/[0.04] hover:border-purple-500/20 transition-colors group shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-sm text-purple-600">{section.heading}</h5>
                  <button
                    onClick={() => handleCopySection(section.content, i)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[#F3F4F6] transition-all"
                    title="Copy section"
                  >
                    {copiedIndex === i ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed font-medium">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                reset();
              }}
              className="flex-1 py-3 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-black/[0.04] rounded-2xl text-sm font-semibold text-[#374151] transition-all"
            >
              Regenerate
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-sm font-semibold transition-all shadow-lg shadow-purple-600/20"
            >
              Save to Drafts
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
