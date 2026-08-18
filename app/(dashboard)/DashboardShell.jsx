"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  PlusCircle,
  Kanban,
  ListVideo,
  Library,
  CalendarClock,
  Images,
  BarChart3,
  Settings2,
  Bell,
  Search,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  X,
  Wrench,
  Upload,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import UserDropdown from "@/app/components/UserDropdown";
import AIAgentPanel from "@/app/components/AIAgentPanel";
import { SERIES_LOOKUP } from "@/lib/mock-data";
import { SeriesProvider } from "@/context/SeriesContext";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

// Best posting windows per day (0=Sun … 6=Sat), times in 24h local
const BEST_TIMES = {
  instagram: {
    // [day]: [[startH, endH], ...]
    0: [[12, 14], [17, 19]],
    1: [[6, 9], [12, 15], [19, 21]],
    2: [[6, 9], [12, 15], [19, 21]],
    3: [[9, 12], [18, 20]],
    4: [[9, 12], [17, 20]],
    5: [[9, 12], [14, 17]],
    6: [[11, 13], [16, 18]],
  },
  youtube: {
    0: [[14, 17], [19, 22]],
    1: [[12, 15], [19, 21]],
    2: [[12, 15], [19, 21]],
    3: [[14, 17], [19, 22]],
    4: [[12, 16], [20, 22]],
    5: [[9, 12], [15, 18], [20, 22]],
    6: [[9, 12], [15, 18], [19, 22]],
  },
};

function fmt12(h) {
  const ampm = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${ampm}`;
}

function getBestWindows(platform) {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const windows = BEST_TIMES[platform][day] || [];
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Find next upcoming window today or tomorrow
  const todayUpcoming = windows.filter(([s]) => s > hour);
  const activeNow = windows.find(([s, e]) => hour >= s && hour < e);

  if (activeNow) {
    return { status: "now", label: "Right now!", sub: `Best window until ${fmt12(activeNow[1])}`, day: "Today" };
  }
  if (todayUpcoming.length > 0) {
    const [s, e] = todayUpcoming[0];
    return { status: "today", label: `${fmt12(s)} – ${fmt12(e)}`, sub: "Today's next best window", day: "Today" };
  }
  // Check tomorrow
  const tomorrow = (day + 1) % 7;
  const tomorrowWindows = BEST_TIMES[platform][tomorrow] || [];
  if (tomorrowWindows.length > 0) {
    const [s, e] = tomorrowWindows[0];
    return { status: "tomorrow", label: `${fmt12(s)} – ${fmt12(e)}`, sub: `${DAY_NAMES[tomorrow]}'s first window`, day: DAY_NAMES[tomorrow] };
  }
  return { status: "soon", label: "Check back soon", sub: "No windows today", day: "" };
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const [issuesOpen, setIssuesOpen] = useState(false);
  const issuesRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // Real connection status — default {loading:true} so the "Action Required"
  // badge doesn't flash a false-positive warning before the check resolves.
  const [connStatus, setConnStatus] = useState({ loading: true, youtube: true, instagram: true });

  // Persist the collapsed/expanded choice across page loads.
  useEffect(() => {
    const saved = window.localStorage.getItem("cms-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  // Only checked on the Dashboard page, where the "Action Required" badge is
  // shown — no need to hit these endpoints on every single page navigation.
  useEffect(() => {
    if (pathname !== "/dashboard") return;
    let cancelled = false;
    setConnStatus({ loading: true, youtube: true, instagram: true });
    Promise.allSettled([
      httpClient.get(ENDPOINTS.PUBLISH.YOUTUBE_STATUS),
      httpClient.get(ENDPOINTS.PUBLISH.INSTAGRAM_STATUS),
    ]).then(([ytRes, igRes]) => {
      if (cancelled) return;
      setConnStatus({
        loading: false,
        youtube: ytRes.status === "fulfilled" ? !!ytRes.value?.data?.connected : false,
        instagram: igRes.status === "fulfilled" ? !!igRes.value?.data?.connected : false,
      });
    });
    return () => { cancelled = true; };
  }, [pathname]);

  const connIssues = connStatus.loading ? [] : [
    ...(!connStatus.youtube ? [{ id: "youtube", title: "YouTube not connected", desc: "Connect your YouTube account to publish Shorts and see real analytics." }] : []),
    ...(!connStatus.instagram ? [{ id: "instagram", title: "Instagram not connected", desc: "Connect your Instagram account to publish Reels and see real analytics." }] : []),
  ];

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("cms-sidebar-collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (issuesRef.current && !issuesRef.current.contains(e.target)) setIssuesOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sections = [
    {
      label: "WORKSPACE",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      label: "PLANNING",
      items: [
        { name: "Roadmap", href: "/roadmap", icon: Kanban },
        { name: "Series Planner", href: "/series", icon: ListVideo },
      ]
    },
    {
      label: "CREATION",
      items: [
        { name: "Content", href: "/all-content", icon: Library },
        { name: "Add Content", href: "/add-content", icon: PlusCircle },
        { name: "AI Workspace", href: "/research", icon: Search, isNew: true },
      ]
    },
    {
      label: "PUBLISHING",
      items: [
        { name: "Scheduler", href: "/scheduler", icon: CalendarClock },
        { name: "Media", href: "/media-library", icon: Images },
      ]
    },
    {
      label: "INSIGHTS",
      items: [
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
      ]
    },
    {
      label: "SETTINGS",
      items: [
        { name: "Settings", href: "/settings", icon: Settings2 },
      ]
    }
  ];

  return (
    <SeriesProvider>
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--t-bg)", color: "var(--t-text)" }}>
      {/* Sidebar */}
      <aside className={`app-sidebar border-r border-white/5 flex flex-col h-screen fixed z-50 transition-[width] duration-200 ${collapsed ? "w-[76px]" : "w-[240px]"}`}>
        <div className={`p-5 pb-4 border-b border-white/[0.05] mb-2 flex items-center ${collapsed ? "px-3 justify-center" : "px-4 justify-between"}`}>
          <Link href="/dashboard" className="flex items-center gap-3 no-underline group min-w-0">
            <div className="w-[36px] h-[36px] rounded-[10px] overflow-hidden flex items-center justify-center flex-shrink-0 bg-neutral-900 border border-white/10" style={{ boxShadow: "0 4px 12px rgba(99,102,241,0.2)" }}>
              <img src="/logo.png" alt="CreatorCMS Logo" className="w-full h-full object-cover" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-white font-bold text-[15px] tracking-tight leading-none truncate">CreatorCMS</span>
                <span className="text-white/25 text-[10px] font-medium mt-1">v2.0</span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              title="Hide sidebar"
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
            >
              <PanelLeftClose size={16} strokeWidth={1.8} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            title="Show sidebar"
            className="mx-auto mb-2 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <PanelLeft size={16} strokeWidth={1.8} />
          </button>
        )}

        <nav className="flex-1 overflow-y-auto py-2 custom-sidebar-scroll">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="flex flex-col gap-[2px]">
              {section.label && !collapsed && (
                <div className="px-4 pt-4 pb-1.5 text-[10px] font-bold tracking-widest text-white/25 uppercase">
                  {section.label}
                </div>
              )}
              <div className={`flex flex-col gap-[2px] ${collapsed ? "px-2 pt-2" : "px-[10px]"}`}>
                {section.items.map((item) => {
                  const itemPath = item.href.split("?")[0];
                  const isActive = pathname === itemPath || (itemPath !== "/dashboard" && pathname.startsWith(itemPath + "/"));
                  const isAIAgent = item.name === "AI Agent";

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      className={`
                        relative flex items-center rounded-lg transition-all duration-150 group no-underline
                        ${collapsed ? "justify-center px-2 py-[10px] mx-0 my-[2px]" : "gap-[10px] px-3 py-[9px] mx-[10px] my-[2px]"}
                        ${isActive ? 'bg-white/[0.10] text-white font-semibold' : 'text-white/55 font-medium hover:bg-white/[0.05] hover:text-white/85'}
                      `}
                    >
                      {isActive && (
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          height: '60%',
                          width: '3px',
                          background: 'linear-gradient(180deg, var(--t-primary), var(--t-secondary))',
                          borderRadius: '0 2px 2px 0'
                        }} />
                      )}

                      <item.icon
                        size={16}
                        strokeWidth={1.8}
                        className={isAIAgent ? 'text-[#A78BFA]' : (isActive ? 'text-white' : 'text-inherit')}
                      />

                      {!collapsed && (
                        <span className="text-[13.5px] leading-none">
                          {item.name}
                        </span>
                      )}

                      {item.isNew && !collapsed && (
                        <span className="ml-auto text-white text-[9px] font-bold px-[7px] py-[2px] rounded-full" style={{ background: "linear-gradient(135deg, var(--t-primary), var(--t-secondary))" }}>
                          NEW
                        </span>
                      )}
                      {item.isNew && collapsed && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "linear-gradient(135deg, var(--t-primary), var(--t-secondary))" }} />
                      )}
                    </Link>
                  );
                })}
              </div>
              {sIdx < sections.length - 1 && !sections[sIdx+1].label && (
                <div className="mx-4 my-2 border-t border-white/[0.05]" />
              )}
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/[0.06]">
          <UserDropdown variant="dark" collapsed={collapsed} />
        </div>

        <style jsx global>{`
          .custom-sidebar-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .custom-sidebar-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          .custom-sidebar-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .custom-sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.1) rgba(255, 255, 255, 0.05);
          }
        `}</style>
      </aside>

      {/* Main Content - Adjusted for fixed sidebar */}
      <main className={`flex-1 overflow-y-auto relative transition-[margin] duration-200 ${collapsed ? "ml-[76px]" : "ml-[240px]"}`} style={{ background: "var(--t-bg)" }}>
        <header className="app-header h-20 border-b flex items-center justify-between px-10 sticky top-0 z-30" style={{ borderColor: "var(--t-border)" }}>
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-bold text-[#8A91A8] uppercase tracking-widest">
              {(() => {
                if (pathname.includes("/series/")) {
                  const id = pathname.split("/").pop();
                  const series = SERIES_LOOKUP[id];
                  return series ? `Series Planner / ${series.name}` : "Series Planner";
                }
                if (pathname.startsWith("/editor/")) {
                  return "Video Editor";
                }
                return pathname.split("/").pop()?.replace("-", " ") || "Dashboard";
              })()}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {pathname === "/dashboard" && !connStatus.loading && (
              <div className="relative" ref={issuesRef}>
                <button
                  onClick={() => setIssuesOpen(!issuesOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors shadow-sm ${
                    connIssues.length > 0
                      ? "bg-amber-50 text-amber-600 border-amber-200/50 hover:bg-amber-100"
                      : "bg-emerald-50 text-emerald-600 border-emerald-200/50 hover:bg-emerald-100"
                  }`}
                >
                  {connIssues.length > 0 ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span className="text-xs font-bold">
                    {connIssues.length > 0 ? `${connIssues.length} Issue${connIssues.length > 1 ? "s" : ""}` : "All Connected"}
                  </span>
                </button>

                <AnimatePresence>
                  {issuesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-3 right-0 w-80 bg-white border border-black/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden z-50"
                    >
                      {connIssues.length > 0 ? (
                        <>
                          <div className="p-4 border-b border-black/[0.04] bg-[#F9FAFB]">
                            <h4 className="text-sm font-bold text-[#0A0A0F]">Action Required</h4>
                            <p className="text-xs text-[#8A91A8] mt-0.5">Connect these platforms to unlock publishing and analytics.</p>
                          </div>
                          <div className="divide-y divide-black/[0.04]">
                            {connIssues.map(issue => (
                              <div key={issue.id} className="p-4 hover:bg-neutral-50 transition-colors">
                                <h5 className="text-xs font-bold text-[#111318] mb-1">{issue.title}</h5>
                                <p className="text-[11px] text-[#8A91A8] mb-3 leading-relaxed">{issue.desc}</p>
                                <Link
                                  href="/settings"
                                  onClick={() => setIssuesOpen(false)}
                                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-white rounded-lg text-[10px] font-bold transition-colors btn-primary no-underline"
                                >
                                  <Wrench className="w-3 h-3" /> Connect in Settings
                                </Link>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="p-5 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#0A0A0F]">All connected</h4>
                            <p className="text-xs text-[#8A91A8] mt-0.5">YouTube and Instagram are both linked — you're good to publish.</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-neutral-500 hover:text-[#0F0F0F] transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
              </button>

              <AnimatePresence>
                {notifOpen && (() => {
                  const ig = getBestWindows("instagram");
                  const yt = getBestWindows("youtube");
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-3 right-0 w-80 bg-white border border-black/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden z-50"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-black/[0.04] bg-[#F9FAFB] flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-[#0A0A0F]">Best Time to Post</h4>
                          <p className="text-[11px] text-[#8A91A8] mt-0.5">Post now for maximum reach & views</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Live</span>
                      </div>

                      <div className="divide-y divide-black/[0.04]">
                        {/* Instagram */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <FaInstagram className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-[12px] font-bold text-[#0A0A0F]">Instagram Reels</span>
                            {ig.status === "now" && (
                              <span className="ml-auto text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full animate-pulse">● Post Now</span>
                            )}
                          </div>
                          <div className={`rounded-xl px-3 py-2.5 flex items-center justify-between ${ig.status === "now" ? "bg-emerald-50 border border-emerald-100" : "bg-[#F4F5F8] border border-[#E2E4E9]"}`}>
                            <div>
                              <p className={`text-[13px] font-black ${ig.status === "now" ? "text-emerald-700" : "text-[#0A0A0F]"}`}>{ig.label}</p>
                              <p className="text-[10px] text-[#8A91A8] mt-0.5">{ig.sub}</p>
                            </div>
                            {ig.status !== "now" && (
                              <span className="text-[10px] font-bold text-neutral-400 bg-white border border-neutral-200 px-2 py-0.5 rounded-lg">{ig.day}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#8A91A8] mt-2 leading-relaxed">Reels posted in peak windows get 2–3× more reach on average.</p>
                        </div>

                        {/* YouTube */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
                              <FaYoutube className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-[12px] font-bold text-[#0A0A0F]">YouTube Shorts</span>
                            {yt.status === "now" && (
                              <span className="ml-auto text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full animate-pulse">● Post Now</span>
                            )}
                          </div>
                          <div className={`rounded-xl px-3 py-2.5 flex items-center justify-between ${yt.status === "now" ? "bg-emerald-50 border border-emerald-100" : "bg-[#F4F5F8] border border-[#E2E4E9]"}`}>
                            <div>
                              <p className={`text-[13px] font-black ${yt.status === "now" ? "text-emerald-700" : "text-[#0A0A0F]"}`}>{yt.label}</p>
                              <p className="text-[10px] text-[#8A91A8] mt-0.5">{yt.sub}</p>
                            </div>
                            {yt.status !== "now" && (
                              <span className="text-[10px] font-bold text-neutral-400 bg-white border border-neutral-200 px-2 py-0.5 rounded-lg">{yt.day}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#8A91A8] mt-2 leading-relaxed">Thursday–Saturday evenings drive the highest YT Shorts views.</p>
                        </div>

                        {/* Footer tip */}
                        <div className="px-4 py-3 bg-[#F9FAFB]">
                          <p className="text-[10px] text-[#8A91A8] leading-relaxed">
                            <span className="font-bold text-[#4B5264]">Tip:</span> Post consistently at the same time each day to train the algorithm and build audience habits.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto relative">
          {children}
        </div>

        {/* Subtle Background Decorative Elements for Light Theme */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none -z-10"></div>
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none -z-10"></div>
      </main>

      {/* Floating AI Agent Button — visible on every page, opens the slide-in panel */}
      <button
        type="button"
        onClick={() => setIsAIPanelOpen(true)}
        className="fixed bottom-8 right-8 z-[60] group"
      >
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center shadow-[0_8px_30px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.55)] transition-shadow"
        >
          <Sparkles className="w-6 h-6" />
        </motion.div>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[#111318] text-white text-[11px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          ✨ AI Content Agent
        </div>
      </button>

      {/* AI Agent slide-in panel */}
      <AnimatePresence>
        {isAIPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAIPanelOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white z-[80] shadow-2xl"
            >
              <AIAgentPanel onClose={() => setIsAIPanelOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </SeriesProvider>
  );
}
