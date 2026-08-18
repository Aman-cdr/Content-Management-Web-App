"use client";

import { 
  Image as ImageIcon, 
  Video, 
  Music, 
  Upload, 
  Search, 
  Sparkles, 
  Tag, 
  Scissors,
  Download,
  Trash2
} from "lucide-react";

export default function MediaLibraryPage() {
  const assets = [
    { name: "b-roll-coffee.mp4", type: "video", size: "12.4 MB", tags: ["vlog", "lifestyle"] },
    { name: "thumbnail-bg.png", type: "image", size: "1.2 MB", tags: ["design", "gradient"] },
    { name: "intro-music.wav", type: "audio", size: "4.5 MB", tags: ["audio", "upbeat"] },
    { name: "logo-transparent.png", type: "image", size: "0.4 MB", tags: ["brand"] },
    { name: "setup-tour-raw.mov", type: "video", size: "1.2 GB", tags: ["raw"] },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold font-outfit mb-2">Media Library</h2>
          <p className="text-neutral-400">All your creative assets, tagged and optimized by AI.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
          <Upload className="w-4 h-4" />
          <span>Upload Files</span>
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search assets or tags..." 
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
          <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-800 text-blue-400">All</button>
          <button className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-500 hover:text-white">Images</button>
          <button className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-500 hover:text-white">Videos</button>
          <button className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-500 hover:text-white">Audio</button>
        </div>
      </div>

      {/* AI Asset Tools */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-500/20 group hover:border-purple-500/40 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="font-bold mb-1">AI Background Removal</h4>
          <p className="text-xs text-neutral-400 mb-4">One-click transparency for your thumbnail photos.</p>
          <button className="text-xs font-bold text-purple-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            Launch Tool <span>→</span>
          </button>
        </div>
        
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-emerald-600/10 border border-blue-500/20 group hover:border-blue-500/40 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
            <Tag className="w-6 h-6" />
          </div>
          <h4 className="font-bold mb-1">Auto-Tagging Engine</h4>
          <p className="text-xs text-neutral-400 mb-4">AI automatically categorizes your raw footage.</p>
          <button className="text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            Configure Tags <span>→</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-600/10 to-pink-600/10 border border-orange-500/20 group hover:border-orange-500/40 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
            <Scissors className="w-6 h-6" />
          </div>
          <h4 className="font-bold mb-1">Smart Highlight Extractor</h4>
          <p className="text-xs text-neutral-400 mb-4">Find viral moments in long videos automatically.</p>
          <button className="text-xs font-bold text-orange-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            Try Now <span>→</span>
          </button>
        </div>
      </section>

      {/* Assets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {assets.map((asset, i) => (
          <div key={i} className="card p-0 overflow-hidden group">
            <div className="aspect-square bg-neutral-900 flex items-center justify-center border-b border-neutral-800 relative">
              {asset.type === "video" ? <Video className="w-8 h-8 text-neutral-700" /> : 
               asset.type === "audio" ? <Music className="w-8 h-8 text-neutral-700" /> : 
               <ImageIcon className="w-8 h-8 text-neutral-700" />}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button className="p-2 bg-neutral-800 rounded-lg hover:bg-white hover:text-black transition-all">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 bg-neutral-800 rounded-lg hover:bg-red-500 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs font-medium truncate mb-1">{asset.name}</p>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-neutral-500 uppercase">{asset.size}</span>
                <div className="flex gap-1">
                  {asset.tags.slice(0, 1).map(t => (
                    <span key={t} className="text-[8px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">#{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
