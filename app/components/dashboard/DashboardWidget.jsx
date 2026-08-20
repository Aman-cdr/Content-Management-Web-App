"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

/**
 * Generic "count + short list + view all" dashboard card. Reused across every
 * content/job-backed widget (Today's Tasks, Upcoming Uploads, Ideas Waiting,
 * Scripts Pending, Thumbnails Pending, Posts Scheduled) so the card chrome and
 * empty/list states are only implemented once.
 */
export default function DashboardWidget({
  icon: Icon,
  iconColor = "#6366F1",
  iconBg = "rgba(99,102,241,0.10)",
  title,
  count,
  items = [],
  getItemId = (it) => it.id || it._id,
  getItemLabel = (it) => it.title,
  getItemSublabel,
  emptyLabel = "Nothing here — you're all caught up.",
  viewAllHref,
  viewAllLabel = "View all",
  onItemClick,
}) {
  const router = useRouter();

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[1.75rem] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03),0_12px_32px_-12px_rgba(0,0,0,0.08)] flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: iconBg }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} strokeWidth={1.5} />
          </div>
          <h3 className="text-[13px] font-semibold text-[#0A0A0F] truncate">{title}</h3>
        </div>
        <span className="text-[20px] font-semibold tabular-nums shrink-0" style={{ color: iconColor, fontFamily: "'Space Grotesk', sans-serif" }}>
          {count}
        </span>
      </div>

      <div className="flex-1 space-y-1 min-h-[44px]">
        {items.length === 0 ? (
          <p className="text-[12px] text-neutral-400 py-2">{emptyLabel}</p>
        ) : (
          items.map((it) => (
            <button
              key={getItemId(it)}
              onClick={() => onItemClick?.(it)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-full hover:bg-[#F9FAFB] transition-colors duration-300 text-left"
            >
              <span className="text-[12px] font-semibold text-[#374151] truncate">{getItemLabel(it)}</span>
              {getItemSublabel && (
                <span className="text-[10px] text-neutral-400 shrink-0">{getItemSublabel(it)}</span>
              )}
            </button>
          ))
        )}
      </div>

      {viewAllHref && (
        <button
          onClick={() => router.push(viewAllHref)}
          className="mt-3 pt-3 border-t border-[#F4F5F8] w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-[#4F46E5] transition-colors duration-300"
        >
          {viewAllLabel} <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
