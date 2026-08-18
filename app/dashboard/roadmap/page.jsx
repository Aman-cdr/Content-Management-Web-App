"use client";

import { useState } from "react";
import { 
  Calendar, 
  LayoutList, 
  GanttChart, 
  Plus, 
  Lightbulb,
  Search,
  Filter
} from "lucide-react";

export default function RoadmapPage() {
  const [view, setView] = useState("board"); // board, calendar, timeline

  const columns = [
    { name: "Brainstorming", items: ["AI SaaS Idea", "Q&A Session", "Office Setup V2"], color: "border-purple-500/50" },
    { name: "Scripting", items: ["Next.js 16 Deep Dive", "Tailwind 4 vs 3"], color: "border-blue-500/50" },
    { name: "Production", items: ["State of React 2026"], color: "border-orange-500/50" },
    { name: "Post-Production", items: ["Editor Vlog #12"], color: "border-pink-500/50" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit mb-1">Content Roadmap</h2>
          <p className="text-neutral-400">Plan and track your content from idea to publication.</p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          <button 
            onClick={() => setView("board")}
            className={`p-2 rounded-md transition-all ${view === "board" ? "bg-neutral-800 text-blue-400" : "text-neutral-500 hover:text-white"}`}
          >
            <LayoutList className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView("calendar")}
            className={`p-2 rounded-md transition-all ${view === "calendar" ? "bg-neutral-800 text-blue-400" : "text-neutral-500 hover:text-white"}`}
          >
            <Calendar className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView("timeline")}
            className={`p-2 rounded-md transition-all ${view === "timeline" ? "bg-neutral-800 text-blue-400" : "text-neutral-500 hover:text-white"}`}
          >
            <GanttChart className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors ml-auto">
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
          {columns.map((col) => (
            <div key={col.name} className="flex flex-col gap-4">
              <div className={`flex items-center justify-between pb-2 border-b-2 ${col.color}`}>
                <h4 className="font-bold text-sm uppercase tracking-wider">{col.name}</h4>
                <span className="text-xs text-neutral-500">{col.items.length}</span>
              </div>
              
              <div className="flex flex-col gap-4">
                {col.items.map((item, i) => (
                  <div key={i} className="card p-4 bg-neutral-900/50 border-neutral-800/50 hover:border-neutral-700 cursor-grab active:cursor-grabbing">
                    <p className="text-sm font-medium mb-3">{item}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[1, 2].map(j => (
                          <div key={j} className="w-6 h-6 rounded-full bg-neutral-800 border-2 border-neutral-900 flex items-center justify-center text-[10px]">A</div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                        <Calendar className="w-3 h-3" />
                        <span>Apr 22</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {col.name === "Brainstorming" && (
                  <button className="flex items-center justify-center gap-2 p-3 border border-dashed border-neutral-800 rounded-xl text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-all text-sm group">
                    <Lightbulb className="w-4 h-4 group-hover:text-yellow-500" />
                    <span>Quick Idea</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view !== "board" && (
        <div className="card h-[600px] flex items-center justify-center border-dashed">
          <div className="text-center">
            <p className="text-neutral-500 mb-2">{view.charAt(0).toUpperCase() + view.slice(1)} view is being polished...</p>
            <p className="text-xs text-neutral-600">Switch back to Board for now.</p>
          </div>
        </div>
      )}
    </div>
  );
}
