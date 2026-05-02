"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060608] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter gradient-text">CreatorCMS</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-9xl font-black tracking-tighter gradient-text mb-4 drop-shadow-2xl">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-neutral-200">
          Looks like this page doesn't exist
        </h2>
        <p className="text-neutral-400 max-w-md mx-auto mb-10">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/dashboard"
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-blue-600/20 w-full sm:w-auto text-center"
          >
            Back to Dashboard
          </Link>
          <Link 
            href="/"
            className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-semibold transition-all w-full sm:w-auto text-center"
          >
            Go to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
