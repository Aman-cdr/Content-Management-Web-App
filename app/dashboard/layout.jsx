"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BarChart3, 
  Map, 
  ListVideo, 
  PlusSquare, 
  Files, 
  Image as ImageIcon, 
  Calendar, 
  Settings,
  Sparkles
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Roadmap", href: "/dashboard/roadmap", icon: Map },
    { name: "Series Planner", href: "/dashboard/series-planner", icon: ListVideo },
    { name: "Add Content", href: "/dashboard/add-content", icon: PlusSquare },
    { name: "All Content", href: "/dashboard/all-content", icon: Files },
    { name: "Media Library", href: "/dashboard/media-library", icon: ImageIcon },
    { name: "Scheduler", href: "/dashboard/scheduler", icon: Calendar },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#262626] flex flex-col bg-[#0a0a0a]">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-outfit gradient-text">CreatorCMS</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20">
            <p className="text-xs text-blue-400 font-semibold mb-1">AI READY</p>
            <p className="text-xs text-neutral-400">Your AI assistant is ready to help with suggestions.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <header className="h-16 border-b border-[#262626] flex items-center justify-between px-8 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-10">
          <h1 className="text-sm font-medium text-neutral-400 capitalize">
            {pathname.split("/").pop() || "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            <button className="text-xs bg-white text-black px-4 py-2 rounded-full font-semibold hover:bg-neutral-200 transition-colors">
              Upgrade Pro
            </button>
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-[#262626]"></div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}