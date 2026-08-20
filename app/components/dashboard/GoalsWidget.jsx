"use client";

import { useState, useEffect } from "react";
import { Target, Pencil, Check } from "lucide-react";

const GOAL_STORAGE_KEY = "creator-cms-monthly-upload-goal";
const DEFAULT_GOAL = 8;

/**
 * Monthly upload goal tracker. Progress (`publishedThisMonth`) is real, derived
 * from actual Content data by the caller — only the target number is user-set,
 * persisted locally since there's no backend Goals model yet.
 */
export default function GoalsWidget({ publishedThisMonth }) {
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(DEFAULT_GOAL));

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(GOAL_STORAGE_KEY);
      if (saved) {
        setGoal(Number(saved));
        setDraft(saved);
      }
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
  }, []);

  const saveGoal = () => {
    const n = Math.max(1, parseInt(draft, 10) || DEFAULT_GOAL);
    setGoal(n);
    setDraft(String(n));
    try {
      window.localStorage.setItem(GOAL_STORAGE_KEY, String(n));
    } catch {
      // ignore
    }
    setEditing(false);
  };

  const pct = Math.min(100, Math.round((publishedThisMonth / goal) * 100));
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[1.75rem] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03),0_12px_32px_-12px_rgba(0,0,0,0.08)] flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.10)" }}>
            <Target className="w-4 h-4" style={{ color: "#10B981" }} strokeWidth={1.5} />
          </div>
          <h3 className="text-[13px] font-semibold text-[#0A0A0F]">{monthName} Goal</h3>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="p-1 text-neutral-300 hover:text-neutral-600 transition-colors duration-300" title="Edit goal">
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 mb-4">
          <input
            type="number"
            min="1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveGoal()}
            className="w-20 px-2.5 py-1.5 bg-[#F9FAFB] border border-[#E2E4E9] rounded-full text-[13px] font-semibold outline-none focus:border-emerald-400 transition-colors duration-300"
            autoFocus
          />
          <span className="text-[12px] text-neutral-400">uploads / month</span>
          <button onClick={saveGoal} className="ml-auto p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors duration-300">
            <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] font-semibold text-[#0A0A0F] leading-none tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{publishedThisMonth}</span>
            <span className="text-[13px] text-neutral-400 font-semibold">/ {goal} uploads</span>
          </div>
        </div>
      )}

      <div className="mt-auto">
        <div className="h-2 bg-emerald-50 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] font-semibold text-neutral-400 mt-2">
          {pct}% of this month's goal{pct >= 100 ? " — goal reached! 🎉" : ""}
        </p>
      </div>
    </div>
  );
}
