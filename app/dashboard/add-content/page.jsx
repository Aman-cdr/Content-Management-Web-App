"use client";

import { useState } from "react";
import { Sparkles, Check, ChevronRight, Type, Film, Send } from "lucide-react";

export default function AddContentPage() {
  const [step, setStep] = useState(1);
  const steps = ["Basics", "Media", "Optimize"];

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12">
        <h2 className="text-3xl font-bold font-outfit mb-4">Create New Content</h2>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-4">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-500"}`}>
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === i + 1 ? "text-white" : "text-neutral-500"}`}>{s}</span>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-neutral-800 mx-2"></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-8 min-h-[400px] flex flex-col">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Content Title</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Enter a working title..." 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors group">
                  <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Target Platforms</label>
              <div className="flex gap-3">
                {["YouTube", "TikTok", "Instagram", "X"].map(p => (
                  <button key={p} className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-medium hover:bg-neutral-700 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex gap-3">
              <div className="p-2 h-fit rounded-lg bg-purple-500/10 text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">AI Suggestion</p>
                <p className="text-sm text-neutral-400">"How I use AI to write code" is trending in your niche. Should we adjust the title?</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="border-2 border-dashed border-neutral-800 rounded-2xl p-12 text-center hover:border-neutral-700 transition-all cursor-pointer group">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800 mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Film className="w-8 h-8 text-neutral-500" />
              </div>
              <p className="font-medium mb-1">Upload Assets</p>
              <p className="text-xs text-neutral-500">Drop videos, images, or scripts here</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 flex items-center gap-3">
                <Type className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium">Auto-generate Script</span>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-pink-400" />
                <span className="text-sm font-medium">Generate Thumbnail</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="card border-emerald-500/20 bg-emerald-500/5">
              <p className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <Check className="w-4 h-4" /> SEO SCORE: 92/100
              </p>
              <p className="text-sm text-neutral-400">Your description and tags are highly optimized for search.</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Post Preview</h4>
              <div className="aspect-video w-full rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <p className="text-xs text-neutral-600 italic">Previewing on YouTube...</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto pt-8 flex justify-between">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 rounded-lg border border-neutral-800 text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Back
            </button>
          ) : <div></div>}
          
          <button 
            onClick={() => step < 3 ? setStep(step + 1) : null}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <span>{step === 3 ? "Finish & Save" : "Continue"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
