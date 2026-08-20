"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { FaYoutube, FaInstagram } from "react-icons/fa";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

const PLATFORMS = [
  { key: "youtube", label: "YouTube", icon: FaYoutube, color: "#FF0000", endpoint: ENDPOINTS.PUBLISH.YOUTUBE_STATUS },
  { key: "instagram", label: "Instagram", icon: FaInstagram, color: "#E1306C", endpoint: ENDPOINTS.PUBLISH.INSTAGRAM_STATUS },
];

/**
 * Surfaces connection health for YouTube/Instagram right on the dashboard —
 * without this, a dropped OAuth token only shows up once a publish attempt
 * fails mid-demo. Reuses the same status endpoints PublishModal already
 * checks before allowing a publish.
 */
export default function PlatformStatusWidget() {
  const router = useRouter();
  const [status, setStatus] = useState({
    youtube: { loading: true, connected: null },
    instagram: { loading: true, connected: null },
  });

  useEffect(() => {
    let cancelled = false;
    PLATFORMS.forEach(({ key, endpoint }) => {
      httpClient
        .get(endpoint)
        .then((res) => {
          if (cancelled) return;
          setStatus((prev) => ({ ...prev, [key]: { loading: false, connected: !!res?.data?.connected } }));
        })
        .catch(() => {
          if (cancelled) return;
          setStatus((prev) => ({ ...prev, [key]: { loading: false, connected: false } }));
        });
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[1.75rem] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03),0_12px_32px_-12px_rgba(0,0,0,0.08)] flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-[#0A0A0F]">Platform Connections</h3>
      </div>

      <div className="flex-1 space-y-2.5">
        {PLATFORMS.map(({ key, label, icon: Icon, color }) => {
          const s = status[key];
          return (
            <div key={key} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-full bg-[#F9FAFB]">
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                <span className="text-[12px] font-semibold text-[#374151] truncate">{label}</span>
              </div>
              {s.loading ? (
                <Loader2 className="w-3.5 h-3.5 text-neutral-300 animate-spin shrink-0" strokeWidth={1.5} />
              ) : s.connected ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} /> Not connected
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => router.push("/settings")}
        className="mt-3 pt-3 border-t border-[#F4F5F8] w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-[#4F46E5] transition-colors duration-300"
      >
        Manage in Settings
      </button>
    </div>
  );
}
