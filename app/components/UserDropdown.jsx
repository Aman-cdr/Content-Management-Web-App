"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserDropdown({ variant = "light" }) {
  const { data: session } = useSession();
  
  // Use session data or fallback to mock for UI development
  const userData = session?.user || {
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

  const user = userData;
  
  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.split(" ").filter(p => p.length > 0);
    if (parts.length === 0) return "??";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(user.name);

  return (
    <div className="relative px-2 py-3" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg transition-all duration-150 cursor-pointer outline-none w-full hover:bg-white/[0.05] group"
      >
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
          {user?.image ? (
            <img src={user.image} alt={user?.name || "Avatar"} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[13px] font-semibold text-white">{initials}</span>
          )}
        </div>
        
        <div className="flex flex-col items-start flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate w-full text-left leading-tight">
            {user?.name || "User"}
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
          <ChevronDown size={14} strokeWidth={2.5} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isDark ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isDark ? -10 : 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${isDark ? "bottom-full mb-3 left-0" : "right-0 mt-3"} w-56 bg-[#FCFCFD] border border-black/[0.08] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] overflow-hidden z-50`}
          >
            <div className="p-4 border-b border-black/[0.04]">
              <p className="text-sm font-bold text-[#0F0F0F] truncate">{user?.name || "User"}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.email || "No email provided"}</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-semibold">Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
