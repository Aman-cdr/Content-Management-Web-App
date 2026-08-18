import { ListVideo, Plus, MoreVertical, Layers, ArrowRight } from "lucide-react";

export default function SeriesPlannerPage() {
  const series = [
    { name: "Next.js Masterclass", episodes: 12, completed: 4, type: "Course" },
    { name: "Daily Tech News", episodes: 30, completed: 18, type: "Shorts" },
    { name: "Build a CMS with AI", episodes: 5, completed: 1, type: "Project" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold font-outfit mb-2">Series Planner</h2>
          <p className="text-neutral-400">Manage long-form content, courses, and themed series.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Series</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {series.map((item) => (
          <div key={item.name} className="card group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-2xl bg-neutral-800 text-blue-400 group-hover:scale-110 transition-transform">
                <ListVideo className="w-6 h-6" />
              </div>
              <button className="text-neutral-500 hover:text-white">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold mb-1 font-outfit">{item.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">{item.type}</span>
            
            <div className="mt-8 space-y-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Progress</span>
                <span className="text-neutral-200">{Math.round((item.completed / item.episodes) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${(item.completed / item.episodes) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>{item.completed} segments done</span>
                <span>{item.episodes} total</span>
              </div>
            </div>

            <button className="w-full mt-6 py-3 rounded-xl border border-neutral-800 text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 group/btn">
              <span>View Structure</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}

        <button className="card border-dashed border-neutral-800 flex flex-col items-center justify-center gap-3 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-all p-12 min-h-[300px]">
          <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
            <Layers className="w-6 h-6" />
          </div>
          <p className="font-medium">Create New Series Template</p>
        </button>
      </div>
    </div>
  );
}
