"use client";

import { useRouter } from "next/navigation";
import { DollarSign, Lock } from "lucide-react";

/**
 * There is no revenue/monetization data source anywhere in this stack today —
 * the YouTube Analytics monetary scope was never requested during OAuth (see
 * backend analytics.service.ts). Rather than fabricate a number, this is an
 * honest "not connected" state, consistent with how the app degrades gracefully
 * elsewhere when an API key/scope isn't configured.
 */
export default function RevenueWidget() {
  const router = useRouter();

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.10)" }}>
          <DollarSign className="w-4 h-4" style={{ color: "#10B981" }} />
        </div>
        <h3 className="text-[13px] font-bold text-[#0A0A0F]">Revenue</h3>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
        <Lock className="w-5 h-5 text-neutral-300 mb-2" />
        <p className="text-[12px] font-bold text-neutral-500 mb-1">Not connected yet</p>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Revenue needs the YouTube Analytics monetary permission, which isn't requested during sign-in yet.
        </p>
      </div>
      <button
        onClick={() => router.push("/analytics")}
        className="mt-3 pt-3 border-t border-[#F4F5F8] w-full text-[11px] font-bold text-neutral-400 hover:text-[#4F46E5] transition-colors"
      >
        View Analytics
      </button>
    </div>
  );
}
