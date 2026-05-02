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
  ChevronDown
} from "lucide-react";
import { motion } from "framer-motion";
import UserDropdown from "@/app/components/UserDropdown";
import { SERIES_LOOKUP } from "@/lib/mock-data";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  const sections = [
    {
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      label: "CREATE",
      items: [
        { name: "AI Agent", href: "/ai-agent", icon: Sparkles, isNew: true },
        { name: "Add Content", href: "/add-content", icon: PlusCircle },
      ]
    },
    {
      label: "CONTENT",
      items: [
        { name: "Roadmap", href: "/roadmap", icon: Kanban },
        { name: "Series Planner", href: "/series", icon: ListVideo },
        { name: "Content Library", href: "/all-content", icon: Library },
      ]
    },
    {
      label: "PUBLISH",
      items: [
        { name: "Scheduler", href: "/scheduler", icon: CalendarClock },
        { name: "Media Library", href: "/media-library", icon: Images },
      ]
    },
    {
      label: "INSIGHTS",
      items: [
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
      ]
    },
    {
      label: "ACCOUNT",
      items: [
        { name: "Settings", href: "/settings", icon: Settings2 },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#EEEEF0] text-[#0A0A0F] overflow-hidden">
      {/* Sidebar - Premium Dark Redesign */}
      <aside className="w-[240px] bg-[#0C0C14] border-r border-white/5 flex flex-col h-screen fixed z-50">
        <div className="p-5 px-4 pb-4 border-b border-white/[0.05] mb-2">
          <Link href="/dashboard" className="flex items-center gap-3 no-underline group">
            <div className="w-[36px] h-[36px] rounded-[10px] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(99,102,241,0.4)]">
              <Sparkles size={18} color="white" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-[15px] tracking-tight leading-none">CreatorCMS</span>
              <span className="text-white/25 text-[10px] font-medium mt-1">v2.0</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 custom-sidebar-scroll">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="flex flex-col gap-[2px]">
              {section.label && (
                <div className="px-4 pt-4 pb-1.5 text-[10px] font-bold tracking-widest text-white/25 uppercase">
                  {section.label}
                </div>
              )}
              <div className="px-[10px] flex flex-col gap-[2px]">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                  const isAIAgent = item.name === "AI Agent";
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        relative flex items-center gap-[10px] px-3 py-[9px] mx-[10px] my-[2px] rounded-lg transition-all duration-150 group no-underline
                        ${isActive ? 'bg-indigo-500/15 text-white font-semibold' : 'text-white/55 font-medium hover:bg-white/[0.05] hover:text-white/85'}
                      `}
                    >
                      {isActive && (
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          height: '60%',
                          width: '3px',
                          background: 'linear-gradient(180deg, #6366F1, #8B5CF6)',
                          borderRadius: '0 2px 2px 0'
                        }} />
                      )}
                      
                      <item.icon 
                        size={16} 
                        strokeWidth={1.8}
                        className={isAIAgent ? 'text-[#A78BFA]' : (isActive ? 'text-white' : 'text-inherit')}
                      />
                      
                      <span className="text-[13.5px] leading-none">
                        {item.name}
                      </span>

                      {item.isNew && (
                        <span className="ml-auto bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[9px] font-bold px-[7px] py-[2px] rounded-full">
                          NEW
                        </span>
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
          <UserDropdown variant="dark" />
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
      <main className="flex-1 ml-[240px] overflow-y-auto relative bg-[#EEEEF0]">
        <header className="h-20 border-b border-[#E2E4E9] flex items-center justify-between px-10 bg-[#FFFFFF] sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-bold text-[#8A91A8] uppercase tracking-widest">
              {(() => {
                if (pathname.includes("/series/")) {
                  const id = pathname.split("/").pop();
                  const series = SERIES_LOOKUP[id];
                  return series ? `Series Planner / ${series.name}` : "Series Planner";
                }
                return pathname.split("/").pop()?.replace("-", " ") || "Dashboard";
              })()}
            </h1>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-[#F4F5F8] border border-[#E2E4E9] rounded-2xl focus-within:border-[#6366F1] transition-colors">
              <Search className="w-4 h-4 text-[#8A91A8]" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none outline-none text-sm text-[#0A0A0F] w-48 focus:w-64 transition-all placeholder:text-[#8A91A8]"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-neutral-500 hover:text-[#0F0F0F] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto relative">
          {children}
        </div>
        
        {/* Subtle Background Decorative Elements for Light Theme */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none -z-10"></div>
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none -z-10"></div>
      </main>
    </div>
  );
}