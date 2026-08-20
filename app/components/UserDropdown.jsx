"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks";
import { ChevronDown, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserDropdown({ variant = "light", collapsed = false }) {
  const { user, logout } = useAuth();
  
  // Use stored user data or fallback
  const userData = user ? {
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    image: null
  } : {
    name: "Demo Creator",
    email: "demo@creatorcms.com",
    image: null
  };
  
  const isDark = variant === "dark";

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayUser = userData;
  
  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.split(" ").filter(p => p.length > 0);
    if (parts.length === 0) return "??";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(displayUser.name);

  return (
    <div className={`relative py-3 ${collapsed ? "px-0 flex justify-center" : "px-2"}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={collapsed ? displayUser?.name || "User" : undefined}
        className={`flex items-center gap-3 rounded-full transition-colors duration-300 cursor-pointer outline-none hover:bg-white/[0.05] group ${collapsed ? "p-1.5 justify-center" : "p-2 w-full"}`}
      >
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
          {displayUser?.image ? (
            <img src={displayUser.image} alt={displayUser?.name || "Avatar"} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[13px] font-semibold text-white">{initials}</span>
          )}
        </div>

        {!collapsed && (
          <>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate w-full text-left leading-tight">
                {displayUser?.name || "User"}
              </p>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-0.5">
                CREATOR PRO
              </p>
            </div>

            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/30 group-hover:text-white/50 transition-colors"
            >
              <ChevronDown size={14} strokeWidth={1.75} />
            </motion.div>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isDark ? -10 : 10, scale: 0.96, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: isDark ? -10 : 10, scale: 0.96, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className={`absolute ${isDark ? "bottom-full mb-3 left-0" : "right-0 mt-3"} w-56 bg-[#FCFCFD] border border-black/[0.08] rounded-[1.75rem] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)] overflow-hidden z-50`}
          >
            <div className="p-4 border-b border-black/[0.04]">
              <p className="text-sm font-semibold text-[#0F0F0F] truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{displayUser?.name || "User"}</p>
              <p className="text-xs text-neutral-500 truncate">{displayUser?.email || "No email provided"}</p>
            </div>
            <div className="p-2">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-300 group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" strokeWidth={1.5} />
                <span className="text-sm font-semibold">Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
