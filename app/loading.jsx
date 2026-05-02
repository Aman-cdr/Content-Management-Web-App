import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-neutral-400 animate-pulse">Loading CreatorCMS...</p>
      </div>
    </div>
  );
}
