"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Clock, 
  MessageSquare, 
  Heart,
  ChevronDown
} from "lucide-react";

export default function AllContentPage() {
  const [activeTab, setActiveTab] = useState("all");

  const contents = [
    { title: "Next.js 16 Breaking Changes", platform: "YouTube", status: "Published", views: "45K", date: "2 days ago" },
    { title: "Tailwind 4 Setup Guide", platform: "YouTube", status: "Draft", views: "-", date: "Just now" },
    { title: "AI Agent Workflow", platform: "TikTok", status: "Scheduled", views: "-", date: "In 4 hours" },
    { title: "React 19 vs Next 16", platform: "YouTube", status: "Published", views: "12K", date: "1 week ago" },
    { title: "Creator Office Tour", platform: "Instagram", status: "Draft", views: "-", date: "2 weeks ago" },
  ];

  const filteredContents = activeTab === "all" ? contents : contents.filter(c => c.status.toLowerCase() === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold font-outfit mb-2">Content Library</h2>
        <p className="text-neutral-400">Manage all your videos, shorts, and posts in one place.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-neutral-800 pb-2">
        <div className="flex gap-6">
          {["all", "published", "draft", "scheduled"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium capitalize transition-all relative ${activeTab === tab ? "text-blue-400" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full"></div>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Filter content..." 
              className="bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none"
            />
          </div>
          <button className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-500 hover:text-white">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs font-medium text-neutral-400">
          <input type="checkbox" className="rounded border-neutral-700 bg-neutral-800" />
          <span>{filteredContents.length} items selected</span>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold transition-colors">
            Move to Archive
          </button>
          <button className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold transition-colors">
            Update Tags
          </button>
          <button className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors">
            Delete
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-900/50 border-b border-neutral-800">
              <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Content</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Platform</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Performance</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Date</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filteredContents.map((item, i) => (
              <tr key={i} className="hover:bg-neutral-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 rounded bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-600">THUMB</div>
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-1 rounded-full border ${item.platform === "YouTube" ? "border-red-500/20 text-red-500 bg-red-500/5" : "border-purple-500/20 text-purple-500 bg-purple-500/5"}`}>
                    {item.platform}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs ${item.status === "Published" ? "text-emerald-400" : item.status === "Draft" ? "text-neutral-500" : "text-blue-400"}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.status === "Published" ? (
                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                      <div className="flex items-center gap-1"><Play className="w-3 h-3" /> {item.views}</div>
                      <div className="flex items-center gap-1"><Heart className="w-3 h-3" /> 2.1K</div>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-600">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-neutral-500">{item.date}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 rounded-lg hover:bg-neutral-700 text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
