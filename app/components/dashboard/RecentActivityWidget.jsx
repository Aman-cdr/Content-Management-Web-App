"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Clock3, ChevronRight, History } from "lucide-react";
import { FaYoutube, FaInstagram, FaTiktok } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

const PLATFORM_ICON = {
  youtube: FaYoutube,
  youtube_shorts: FaYoutube,
  instagram: FaInstagram,
  instagram_reels: FaInstagram,
  tiktok: FaTiktok,
};

const STATUS_META = {
  published:  { icon: CheckCircle2, color: "#10B981", label: "Published" },
  failed:     { icon: XCircle,      color: "#EF4444", label: "Failed" },
  publishing: { icon: Loader2,      color: "#F59E0B", label: "Publishing" },
  scheduled:  { icon: Clock3,       color: "#6366F1", label: "Scheduled" },
};

/**
 * Last few publish attempts (any outcome), so a failed job doesn't sit
 * invisible until someone happens to open All Content — the first screen
 * after login should surface it immediately.
 */
export default function RecentActivityWidget() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    httpClient
      .get(ENDPOINTS.PUBLISH.LIST, { params: { limit: 5 } })
      .then((res) => { if (!cancelled) setJobs(res.data || []); })
      .catch(() => { if (!cancelled) setJobs([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[1.75rem] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03),0_12px_32px_-12px_rgba(0,0,0,0.08)] flex flex-col h-full sm:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(99,102,241,0.10)" }}>
            <History className="w-4 h-4" style={{ color: "#6366F1" }} strokeWidth={1.5} />
          </div>
          <h3 className="text-[13px] font-semibold text-[#0A0A0F]">Recent Activity</h3>
        </div>
      </div>

      <div className="flex-1 space-y-1 min-h-[44px]">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-9 rounded-full bg-black/[0.03] animate-pulse" />
          ))
        ) : jobs.length === 0 ? (
          <p className="text-[12px] text-neutral-400 py-2">No publish activity yet.</p>
        ) : (
          jobs.map((job) => {
            const meta = STATUS_META[job.status] || STATUS_META.scheduled;
            const StatusIcon = meta.icon;
            const failedResult = job.platformResults?.find((pr) => pr.status === "failed");
            return (
              <button
                key={job._id || job.id}
                onClick={() => router.push("/all-content")}
                title={job.status === "failed" ? failedResult?.error || "Publish failed" : undefined}
                className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-full hover:bg-[#F9FAFB] transition-colors duration-300 text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <StatusIcon
                    className={`w-4 h-4 shrink-0 ${job.status === "publishing" ? "animate-spin" : ""}`}
                    style={{ color: meta.color }}
                    strokeWidth={1.5}
                  />
                  <span className="text-[12px] font-semibold text-[#374151] truncate">{job.title}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {(job.platforms || []).slice(0, 2).map((p, i) => {
                      const Icon = PLATFORM_ICON[p];
                      return Icon ? <Icon key={i} className="w-3 h-3 text-neutral-300" /> : null;
                    })}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 shrink-0">
                  {job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : ""}
                </span>
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={() => router.push("/all-content")}
        className="mt-3 pt-3 border-t border-[#F4F5F8] w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-[#4F46E5] transition-colors duration-300"
      >
        View all <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
      </button>
    </div>
  );
}
