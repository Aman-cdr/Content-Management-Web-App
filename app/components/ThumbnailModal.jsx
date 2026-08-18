"use client";

import { Sparkles, Loader2, AlertCircle, Download, RefreshCw } from "lucide-react";
import Modal from "./Modal";
import { useGenerateThumbnail } from "@/lib/use-dashboard-data";

export default function ThumbnailModal({ isOpen, onClose }) {
  const { thumbnail, loading, error, generate, reset } = useGenerateThumbnail();

  const handleGenerate = () => {
    generate();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownload = async () => {
    if (!thumbnail) return;
    try {
      const response = await fetch(thumbnail.thumbnail.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "thumbnail.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download image", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Thumbnail Generator" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Initial / Loading / Error State */}
        {!thumbnail && (
          <>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-neutral-600">
                Generate a high-contrast thumbnail optimized for better CTR based on your video content.
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
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/30 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Thumbnail...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Thumbnail
                </>
              )}
            </button>
          </>
        )}

        {/* Generated Thumbnail */}
        {thumbnail && (
          <>
            {/* Thumbnail Preview */}
            <div className="rounded-2xl overflow-hidden border border-black/[0.06] shadow-2xl shadow-black/10">
              <img
                src={thumbnail.thumbnail.url}
                alt="Generated thumbnail"
                className="w-full aspect-video object-cover"
              />
            </div>

            {/* Thumbnail Info */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-black/[0.04] text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Style</p>
                <p className="text-sm font-bold text-[#0F0F0F]">{thumbnail.thumbnail.style}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-black/[0.04] text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">CTR Prediction</p>
                <p className="text-sm font-bold text-emerald-600">{thumbnail.thumbnail.ctr_prediction}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-black/[0.04] text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Resolution</p>
                <p className="text-sm font-bold text-[#0F0F0F]">1280×720</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { reset(); generate(); }}
                className="flex-1 py-3 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-black/[0.04] rounded-2xl text-sm font-semibold text-[#374151] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Another
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-sm font-semibold transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Use This Thumbnail
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
