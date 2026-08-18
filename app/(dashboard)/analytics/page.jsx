"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play, Users, Video, Clock, ChevronDown, Download, Calendar,
  Sparkles, Zap, ExternalLink, ThumbsUp, MessageSquare, Eye,
  RefreshCw, AlertCircle, Lock, Grid3x3, Heart
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

// Icon map — backend sends iconKey strings
const ICON_MAP = { Play, Users, Video, Clock, Eye, Grid3x3, Heart };

function YouTubeLogo({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#ef4444">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.5v-7l6.25 3.5-6.25 3.5z"/>
    </svg>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  const mo = Math.floor(days / 30);
  if (mo < 12)    return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-black/[0.06] rounded-xl ${className}`} />;
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ stat, isLoading }) {
  const Icon = ICON_MAP[stat?.iconKey] || Play;

  const BG_MAP  = { Play: "bg-blue-50",   Users: "bg-purple-50", Video: "bg-pink-50",   Clock: "bg-emerald-50", Grid3x3: "bg-pink-50", Heart: "bg-rose-50" };
  const CLR_MAP = { Play: "text-blue-600", Users: "text-purple-600", Video: "text-pink-600", Clock: "text-emerald-600", Grid3x3: "text-pink-600", Heart: "text-rose-600" };
  const bg  = BG_MAP[stat?.iconKey]  || "bg-blue-50";
  const clr = CLR_MAP[stat?.iconKey] || "text-blue-600";

  if (isLoading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="w-10 h-10" />
        </div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${bg}`}>
          <Icon className={`w-5 h-5 ${clr}`} />
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">LIVE</span>
      </div>
      <p className="text-sm text-neutral-500 mb-1">{stat.name}</p>
      <p className="text-3xl font-bold tracking-tight text-[#0F0F0F]">
        {stat.value ?? <span className="text-neutral-300">—</span>}
      </p>
    </motion.div>
  );
}

// ── Not connected banner ──────────────────────────────────────────────────────
function NotConnectedBanner({ platform = "YouTube" }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-6 flex items-start gap-4">
      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-amber-800 mb-1">{platform} not connected</p>
        <p className="text-sm text-amber-700">
          Connect your {platform} account in{" "}
          <a href="/settings" className="underline font-bold">Settings</a>{" "}
          to see real analytics data.
        </p>
      </div>
    </div>
  );
}

// ── Analytics API locked banner ──────────────────────────────────────────────
function AnalyticsApiBanner() {
  return (
    <div className="flex items-center gap-3 bg-[#F3F4F6] border border-black/[0.06] rounded-2xl px-5 py-3">
      <Lock className="w-4 h-4 text-neutral-400 shrink-0" />
      <p className="text-xs text-neutral-500 font-medium">
        Time-series charts, CTR, Revenue, Watch Time and Geography require the{" "}
        <span className="font-bold text-neutral-700">YouTube Analytics API</span>{" "}
        — coming soon.
      </p>
    </div>
  );
}

// ── Top Videos table ─────────────────────────────────────────────────────────
function TopVideosTable({ videos, isLoading, sortConfig, onSort }) {
  const cols = [
    { key: "views",    label: "Views" },
    { key: "likes",    label: "Likes" },
    { key: "comments", label: "Comments" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-16 h-10 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <svg className="w-8 h-8 mx-auto mb-2 opacity-30" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.5v-7l6.25 3.5-6.25 3.5z"/></svg>
        <p className="text-sm font-medium">No videos found on your channel</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] text-neutral-400 uppercase font-black tracking-widest border-b border-black/[0.06]">
            <th className="pb-3 font-black">Video</th>
            {cols.map(c => (
              <th
                key={c.key}
                className="pb-3 cursor-pointer hover:text-[#0F0F0F] transition-colors pr-4"
                onClick={() => onSort(c.key)}
              >
                {c.label} {sortConfig.key === c.key ? (sortConfig.dir === "asc" ? "↑" : "↓") : ""}
              </th>
            ))}
            <th className="pb-3">Published</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.04]">
          {videos.map(v => (
            <tr key={v.id} className="hover:bg-[#F9FAFB] transition-colors group">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="w-20 h-12 rounded-lg object-cover bg-neutral-100"
                    />
                    {v.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1 rounded">
                        {v.duration}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#374151] line-clamp-2 leading-snug">{v.title}</p>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 hover:underline font-medium flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Open on YouTube <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm font-black text-[#0F0F0F]">{fmt(v.views)}</span>
                </div>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm font-black text-[#0F0F0F]">{fmt(v.likes)}</span>
                </div>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm font-black text-[#0F0F0F]">{fmt(v.comments)}</span>
                </div>
              </td>
              <td className="py-3 text-xs text-neutral-400 font-bold whitespace-nowrap">{timeAgo(v.publishedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Top Instagram Posts table ───────────────────────────────────────────────
function TopInstagramTable({ posts, isLoading, sortConfig, onSort }) {
  const cols = [
    { key: "likes",    label: "Likes" },
    { key: "comments", label: "Comments" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-16 h-10 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <FaInstagram className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">No Instagram posts found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] text-neutral-400 uppercase font-black tracking-widest border-b border-black/[0.06]">
            <th className="pb-3 font-black">Post</th>
            {cols.map(c => (
              <th
                key={c.key}
                className="pb-3 cursor-pointer hover:text-[#0F0F0F] transition-colors pr-4"
                onClick={() => onSort(c.key)}
              >
                {c.label} {sortConfig.key === c.key ? (sortConfig.dir === "asc" ? "↑" : "↓") : ""}
              </th>
            ))}
            <th className="pb-3">Published</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.04]">
          {posts.map(p => (
            <tr key={p.id} className="hover:bg-[#F9FAFB] transition-colors group">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={p.thumbnail}
                      alt={p.caption}
                      className="w-12 h-12 rounded-lg object-cover bg-neutral-100"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#374151] line-clamp-2 leading-snug">{p.caption}</p>
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-pink-500 hover:underline font-medium flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Open on Instagram <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm font-black text-[#0F0F0F]">{fmt(p.likes)}</span>
                </div>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-sm font-black text-[#0F0F0F]">{fmt(p.comments)}</span>
                </div>
              </td>
              <td className="py-3 text-xs text-neutral-400 font-bold whitespace-nowrap">{timeAgo(p.publishedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData]         = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState(null);
  const [sortConfig, setSort]   = useState({ key: "views", dir: "desc" });
  const [igSortConfig, setIgSort] = useState({ key: "likes", dir: "desc" });
  const [activeTab, setActiveTab] = useState("youtube");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await httpClient.get(ENDPOINTS.ANALYTICS);
      setData(res.data);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setError("Failed to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleSort = (key) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));
  };

  const handleIgSort = (key) => {
    setIgSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));
  };

  const sortedVideos = data?.topVideos
    ? [...data.topVideos].sort((a, b) =>
        sortConfig.dir === "asc" ? a[sortConfig.key] - b[sortConfig.key] : b[sortConfig.key] - a[sortConfig.key]
      )
    : [];

  const sortedInstagramPosts = data?.topInstagramPosts
    ? [...data.topInstagramPosts].sort((a, b) =>
        igSortConfig.dir === "asc" ? a[igSortConfig.key] - b[igSortConfig.key] : b[igSortConfig.key] - a[igSortConfig.key]
      )
    : [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-[3px] h-8 bg-gradient-to-b from-[#6366F1] to-[#8B5CF6] rounded-full" />
            <h2 className="text-[32px] font-[800] text-[#0F0F0F] tracking-tight">Analytics</h2>
          </div>
          <p className="text-neutral-500 text-[14px] mt-0.5">
            {activeTab === "youtube" && data?.channelName ? (
              <span className="flex items-center gap-1.5">
                <YouTubeLogo className="w-4 h-4" />
                <span className="font-bold text-[#374151]">{data.channelName}</span>
                <span className="text-neutral-400">— live data</span>
              </span>
            ) : activeTab === "instagram" && data?.instagramUsername ? (
              <span className="flex items-center gap-1.5">
                <FaInstagram className="w-4 h-4 text-pink-500" />
                <span className="font-bold text-[#374151]">@{data.instagramUsername}</span>
                <span className="text-neutral-400">— live data</span>
              </span>
            ) : (
              "Your channel performance at a glance"
            )}
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white border border-black/[0.06] rounded-2xl px-5 py-2.5 text-sm font-bold hover:bg-[#F9FAFB] transition-all text-[#374151] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 flex items-center gap-3 text-red-700 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Platform tabs */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#E5E7EB] shadow-[0_1px_4px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.04)] w-fit">
        {[
          { id: "youtube", label: "YouTube" },
          { id: "instagram", label: "Instagram" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              activeTab === tab.id ? "text-[#0F0F0F]" : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="analytics-tab"
                className="absolute inset-0 bg-[#F4F5F8] rounded-lg border border-[#E2E4E9]"
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.id === "youtube" ? (
                <YouTubeLogo className="w-4 h-4" />
              ) : (
                <FaInstagram className="w-4 h-4 text-pink-500" />
              )}
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── YouTube tab ── */}
      {activeTab === "youtube" && (
        <>
          {/* Not connected */}
          {!isLoading && !data?.youtubeConnected && <NotConnectedBanner platform="YouTube" />}

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading
              ? [0, 1, 2].map(i => <StatCard key={i} stat={{}} isLoading />)
              : (data?.stats || []).map(s => <StatCard key={s.name} stat={s} isLoading={false} />)
            }
          </div>

          {/* Analytics API notice */}
          {!isLoading && data?.youtubeConnected && <AnalyticsApiBanner />}

          {/* Top Videos */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E7EB] rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-[20px] font-[800] text-[#0F0F0F]">Top Videos</h3>
                <p className="text-xs text-neutral-400 font-medium mt-0.5">
                  {data?.topVideos?.length
                    ? `${data.topVideos.length} videos · sorted by views`
                    : "Connect YouTube to see your videos"}
                </p>
              </div>
              {data?.topVideos?.length > 0 && (
                <a
                  href="https://studio.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline font-bold flex items-center gap-1"
                >
                  YouTube Studio <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <TopVideosTable
              videos={sortedVideos}
              isLoading={isLoading}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </motion.div>

          {/* Coming soon — time series charts placeholder */}
          {!isLoading && data?.youtubeConnected && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#E5E7EB] rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-[20px] font-[800] text-[#0F0F0F]">Performance Over Time</h3>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-widest">
                  Coming Soon
                </span>
              </div>
              <div className="h-[220px] flex flex-col items-center justify-center gap-3 bg-[#F9FAFB] rounded-2xl border border-dashed border-black/[0.08]">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-sm font-bold text-[#374151]">Views, Watch Time & CTR over time</p>
                <p className="text-xs text-neutral-400 text-center max-w-xs">
                  Requires YouTube Analytics API (separate OAuth scope). This will be added in the next update.
                </p>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ── Instagram tab ── */}
      {activeTab === "instagram" && (
        <>
          {/* Not connected */}
          {!isLoading && !data?.instagramConnected && <NotConnectedBanner platform="Instagram" />}

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading
              ? [0, 1, 2].map(i => <StatCard key={i} stat={{}} isLoading />)
              : (data?.instagramStats || []).map(s => <StatCard key={s.name} stat={s} isLoading={false} />)
            }
          </div>

          {/* Top Instagram Posts */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E7EB] rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-[20px] font-[800] text-[#0F0F0F]">Top Instagram Posts</h3>
                <p className="text-xs text-neutral-400 font-medium mt-0.5">
                  {data?.topInstagramPosts?.length
                    ? `${data.topInstagramPosts.length} posts · sorted by likes`
                    : "Connect Instagram to see your posts"}
                </p>
              </div>
              {data?.topInstagramPosts?.length > 0 && data?.instagramUsername && (
                <a
                  href={`https://www.instagram.com/${data.instagramUsername}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pink-500 hover:underline font-bold flex items-center gap-1"
                >
                  View Profile <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <TopInstagramTable
              posts={sortedInstagramPosts}
              isLoading={isLoading}
              sortConfig={igSortConfig}
              onSort={handleIgSort}
            />
          </motion.div>
        </>
      )}
    </div>
  );
}
