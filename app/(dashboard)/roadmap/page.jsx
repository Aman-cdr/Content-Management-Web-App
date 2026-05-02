"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Calendar, LayoutList, GanttChart, Plus, Search, Filter,
  MoreVertical, Clock, CheckCircle2, X, Tag, AlignLeft,
  ListTodo, MessageSquare, Activity, ChevronDown, ChevronUp,
  GripVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROADMAP_ITEMS, COLUMNS } from "@/lib/mock-data";

const CustomSelect = ({ value, onChange, options, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl overflow-hidden z-[100] py-1.5"
          >
            <div className="max-h-60 overflow-y-auto">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${value === opt.value ? 'bg-blue-50 text-blue-600' : 'text-[#374151] hover:bg-[#F9FAFB]'}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function RoadmapPage() {
  const [view, setView] = useState("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [ideas, setIdeas] = useState(ROADMAP_ITEMS);
  const [isBrowser, setIsBrowser] = useState(false);

  // Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStage, setFilterStage] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterPlatform, setFilterPlatform] = useState("All");

  // Drag and Drop
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Modals
  const [activeItem, setActiveItem] = useState(null); // Detail modal
  const [activeTab, setActiveTab] = useState("Overview");
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false); // Global new modal
  const [newModalTitle, setNewModalTitle] = useState("");
  const [newModalStage, setNewModalStage] = useState("Brainstorming");
  const [newModalPriority, setNewModalPriority] = useState("Medium");
  const [newModalDue, setNewModalDue] = useState("");
  const [quickAddColumn, setQuickAddColumn] = useState(null); // Inline quick add
  const [quickAddTitle, setQuickAddTitle] = useState("");

  // Sort for list view
  const [sortField, setSortField] = useState("due");
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => { setIsBrowser(true); }, []);

  // Filtered Ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter(item => {
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchStage = filterStage === "All" || item.status === filterStage;
      const matchPriority = filterPriority === "All" || item.priority === filterPriority;
      const matchPlatform = filterPlatform === "All" || (item.platforms && item.platforms.includes(filterPlatform));
      return matchSearch && matchStage && matchPriority && matchPlatform;
    });
  }, [ideas, searchQuery, filterStage, filterPriority, filterPlatform]);

  const activeFiltersCount = (filterStage !== "All" ? 1 : 0) + (filterPriority !== "All" ? 1 : 0) + (filterPlatform !== "All" ? 1 : 0);

  const sortedIdeas = useMemo(() => {
    return [...filteredIdeas].sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredIdeas, sortField, sortDir]);

  // Drag and Drop Handlers
  const handleDragStart = (e, id) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = "move";
    // For firefox
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e, colName) => {
    e.preventDefault();
    if (dragOverColumn !== colName) {
      setDragOverColumn(colName);
    }
  };

  const handleDragLeave = (e) => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, colName) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedItemId) return;

    setIdeas(prev => {
      const newIdeas = [...prev];
      const itemIndex = newIdeas.findIndex(i => i.id.toString() === draggedItemId.toString());
      if (itemIndex > -1) {
        const item = { ...newIdeas[itemIndex] };
        if (item.status !== colName) {
          item.status = colName;
          item.activity = [{ id: Date.now(), text: `Moved to ${colName}`, date: "Just now" }, ...(item.activity || [])];
          newIdeas.splice(itemIndex, 1);
          newIdeas.push(item);
        }
      }
      return newIdeas;
    });
    setDraggedItemId(null);
  };

  // Update item
  const updateItem = (id, updates) => {
    setIdeas(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    if (activeItem && activeItem.id === id) {
      setActiveItem(prev => ({ ...prev, ...updates }));
    }
  };

  const handleQuickAdd = () => {
    if (!quickAddTitle.trim() || !quickAddColumn) return;
    const newItem = {
      id: Date.now(),
      title: quickAddTitle,
      status: quickAddColumn,
      tags: ["New"],
      due: "TBD",
      priority: "Medium",
      progress: 0,
      checklist: [],
      notes: "",
      platforms: [],
      activity: [{ id: Date.now(), text: "Created via quick add", date: "Just now" }]
    };
    setIdeas([newItem, ...ideas]);
    setQuickAddTitle("");
    setQuickAddColumn(null);
  };

  const handleCreateNewProject = () => {
    if (!newModalTitle.trim()) return;
    const newItem = {
      id: Date.now(),
      title: newModalTitle,
      status: newModalStage,
      tags: ["New"],
      due: newModalDue || "TBD",
      priority: newModalPriority,
      progress: 0,
      checklist: [],
      notes: "",
      platforms: [],
      activity: [{ id: Date.now(), text: "Created project", date: "Just now" }]
    };
    setIdeas([newItem, ...ideas]);
    setIsNewModalOpen(false);
    setNewModalTitle("");
    setNewModalStage("Brainstorming");
    setNewModalPriority("Medium");
    setNewModalDue("");
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Low": return "text-gray-600 bg-gray-100 border-gray-200";
      case "Medium": return "text-blue-600 bg-blue-100 border-blue-200";
      case "High": return "text-orange-600 bg-orange-100 border-orange-200";
      case "Urgent": return "text-red-600 bg-red-100 border-red-200";
      default: return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getColumnBorderColor = (name) => {
    if (name === "Brainstorming") return "border-l-blue-500";
    if (name === "Scripting") return "border-l-amber-500";
    if (name === "Production") return "border-l-orange-500";
    if (name === "Post-Production") return "border-l-emerald-500";
    return "border-l-gray-500";
  };

  const getColumnColor = (name) => {
    if (name === "Brainstorming") return "#3b82f6";
    if (name === "Scripting") return "#f59e0b";
    if (name === "Production") return "#f97316";
    if (name === "Post-Production") return "#22c55e";
    return "#cbd5e1";
  };

  if (!isBrowser) return null;

  return (
    <div className="space-y-8 pb-12 bg-[#EEEEF0] min-h-screen px-6 pt-6 -mx-6 -mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-[32px] font-bold tracking-tight mb-2 text-[#0A0A0F]">Content Roadmap</h2>
          <p className="text-[#8A91A8] font-medium text-sm">Plan and track your content from idea to publication.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#FFFFFF] p-1.5 rounded-xl border border-[#E2E4E9] shadow-[0_1px_4px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.04)]">
          {[
            { id: "board", icon: LayoutList, label: "Board" },
            { id: "timeline", icon: GanttChart, label: "Timeline" },
            { id: "list", icon: AlignLeft, label: "List" },
          ].map((v) => (
            <button 
              key={v.id}
              onClick={() => setView(v.id)}
              className={`p-2.5 rounded-lg transition-all relative group flex items-center gap-2 ${view === v.id ? "text-[#4F46E5]" : "text-[#8A91A8] hover:text-[#0A0A0F]"}`}
              title={v.label}
            >
              <v.icon className="w-4 h-4 relative z-10" />
              {view === v.id && (
                <motion.div 
                  layoutId="roadmap-view"
                  className="absolute inset-0 bg-[#F4F5F8] rounded-lg border border-[#E2E4E9]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A91A8]" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F4F5F8] border border-[#E2E4E9] rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 transition-all text-[#0A0A0F] placeholder:text-[#8A91A8] shadow-sm focus-within:border-[#6366F1]"
          />
        </div>
        <div className="flex gap-4 w-full sm:w-auto relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFFFF] border border-[#E2E4E9] rounded-xl text-sm font-semibold text-[#4B5264] hover:bg-[#F9FAFB] transition-all flex-1 sm:flex-none shadow-sm relative"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-2 w-64 bg-white border border-black/[0.08] shadow-xl rounded-xl p-4 z-20 space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Stage</label>
                  <CustomSelect 
                    value={filterStage} 
                    onChange={setFilterStage} 
                    options={[{value: "All", label: "All Stages"}, ...COLUMNS.map(c => ({value: c.name, label: c.name}))]} 
                    className="px-3 py-2 bg-[#F5F5F7] border border-black/[0.06] rounded-lg text-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Priority</label>
                  <CustomSelect 
                    value={filterPriority} 
                    onChange={setFilterPriority} 
                    options={[{value: "All", label: "All Priorities"}, {value: "Low", label: "Low"}, {value: "Medium", label: "Medium"}, {value: "High", label: "High"}, {value: "Urgent", label: "Urgent"}]} 
                    className="px-3 py-2 bg-[#F5F5F7] border border-black/[0.06] rounded-lg text-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Platform</label>
                  <CustomSelect 
                    value={filterPlatform} 
                    onChange={setFilterPlatform} 
                    options={[{value: "All", label: "All Platforms"}, {value: "YouTube", label: "YouTube"}, {value: "Instagram", label: "Instagram"}, {value: "TikTok", label: "TikTok"}, {value: "Twitter", label: "Twitter"}]} 
                    className="px-3 py-2 bg-[#F5F5F7] border border-black/[0.06] rounded-lg text-sm font-medium" 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white rounded-[10px] text-sm font-bold hover:bg-[#4338CA] transition-all shadow-[0_2px_8px_rgba(79,70,229,0.25)] flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
      </div>

      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {COLUMNS.map((col) => {
            const colItems = filteredIdeas.filter(i => i.status === col.name);
            const isDragOver = dragOverColumn === col.name;
            
            return (
              <div 
                key={col.name} 
                className={`flex flex-col gap-4 bg-black/[0.02] p-3 rounded-2xl border-2 transition-colors ${isDragOver ? "border-dashed border-purple-500 bg-purple-500/[0.04]" : "border-transparent"}`}
                onDragOver={(e) => handleDragOver(e, col.name)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.name)}
              >
                <div className="flex items-center justify-between px-2 pt-1 pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getColumnColor(col.name) }}></div>
                    <h4 className="font-bold text-sm text-[#0A0A0F]">{col.name}</h4>
                    <span className="text-xs font-semibold bg-[#F4F5F8] border border-[#E2E4E9] px-2 py-0.5 rounded-full text-[#8A91A8]">{colItems.length}</span>
                  </div>
                  <button 
                    onClick={() => setQuickAddColumn(col.name)}
                    className="p-1 text-[#8A91A8] hover:text-[#4F46E5] hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {quickAddColumn === col.name && (
                  <div className="p-3 bg-white border border-black/[0.06] rounded-xl shadow-sm mb-2">
                    <input 
                      autoFocus
                      placeholder="What needs to be done?"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-[#0F0F0F] placeholder:text-neutral-400 mb-3"
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setQuickAddColumn(null); setQuickAddTitle(""); }}
                        className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-[#F3F4F6] rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleQuickAdd}
                        className="px-3 py-1.5 bg-blue-600 rounded-md text-xs font-bold text-white shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-3 min-h-[150px]">
                  {colItems.map((item) => (
                    <div 
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onClick={() => setActiveItem(item)}
                      className={`card border-l-4 ${getColumnBorderColor(col.name)} p-4 cursor-pointer group`}
                      style={{ padding: "1rem" }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {item.tags?.map(tag => (
                            <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F4F5F8] text-[#4B5264] border border-[#E2E4E9]">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button className="text-[#8A91A8] hover:text-[#0A0A0F] opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <h5 className="text-[15px] font-semibold text-[#111318] mb-3 leading-snug">{item.title}</h5>
                      
                      <div className="w-full bg-[#E2E4E9] rounded-[3px] h-[6px] mb-4 overflow-hidden">
                        <div className="h-[6px] rounded-[3px] transition-all" style={{ width: `${item.progress || 0}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {[1, 2].map(j => (
                            <div key={j} className="w-7 h-7 rounded-full bg-neutral-100 border-2 border-white flex items-center justify-center overflow-hidden shadow-sm">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id + j}`} alt="User" className="w-full h-full" />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8A91A8]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{item.due}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {colItems.length === 0 && !quickAddColumn && (
                    <div className="flex items-center justify-center h-24 border border-dashed border-black/[0.08] rounded-xl text-neutral-400 text-sm font-medium">
                      Drop cards here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "list" && (
        <div className="card p-0 overflow-hidden border-[#E2E4E9]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] border-b border-[#E2E4E9]">
                <tr>
                  {["Title", "Stage", "Priority", "Tags", "Due Date", "Progress"].map(h => (
                    <th key={h} className="px-6 py-4 font-bold text-[#8A91A8] uppercase tracking-wider text-xs">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4E9]">
                {sortedIdeas.map(item => (
                  <tr key={item.id} onClick={() => setActiveItem(item)} className="hover:bg-[#FAFAFA] cursor-pointer transition-colors group">
                    <td className="px-6 py-4 font-semibold text-[#111318]">{item.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold" style={{ color: getColumnColor(item.status), backgroundColor: `${getColumnColor(item.status)}1A` }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getColumnColor(item.status) }}></div>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {item.tags?.slice(0, 2).map(t => (
                          <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F4F5F8] text-[#4B5264] border border-[#E2E4E9]">{t}</span>
                        ))}
                        {item.tags?.length > 2 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F4F5F8] text-[#4B5264] border border-[#E2E4E9]">+{item.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#8A91A8] font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {item.due}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-[#E2E4E9] rounded-[3px] h-[6px]">
                          <div className="h-[6px] rounded-[3px]" style={{ width: `${item.progress || 0}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}></div>
                        </div>
                        <span className="text-xs font-bold text-[#8A91A8]">{item.progress || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "timeline" && (
        <div className="card p-6">
          <div className="space-y-8">
            {/* Grouping by week mock */}
            {["This Week", "Next Week", "Later"].map(week => {
              const weekItems = sortedIdeas.filter(i => {
                if (week === "This Week") return i.due.includes("Apr 24") || i.due.includes("Apr 25") || i.due.includes("Apr 26");
                if (week === "Next Week") return i.due.includes("Apr 28") || i.due.includes("Apr 30");
                return i.due.includes("May");
              });
              
              if (weekItems.length === 0) return null;
              
              return (
                <div key={week}>
                  <h3 className="text-sm font-bold text-[#8A91A8] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {week}
                  </h3>
                  <div className="space-y-3">
                    {weekItems.map(item => (
                      <div key={item.id} onClick={() => setActiveItem(item)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#FAFAFA] border border-transparent hover:border-[#E2E4E9] cursor-pointer transition-all">
                        <div className="w-2 h-10 rounded-full" style={{ backgroundColor: getColumnColor(item.status) }}></div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-[#111318]">{item.title}</h5>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="text-xs font-medium text-[#4B5264]">{item.status}</span>
                            <span className="w-1 h-1 rounded-full bg-[#E2E4E9]"></span>
                            <span className="text-xs font-medium text-[#8A91A8]">{item.due}</span>
                          </div>
                        </div>
                        <div className="w-32 hidden md:block">
                           <div className="w-full bg-[#E2E4E9] rounded-[3px] h-[6px]">
                            <div className="h-[6px] rounded-[3px]" style={{ width: `${item.progress || 0}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}></div>
                          </div>
                        </div>
                        <div className="flex -space-x-2 hidden sm:flex">
                          {[1].map(j => (
                            <div key={j} className="w-8 h-8 rounded-full bg-neutral-100 border-2 border-white flex items-center justify-center overflow-hidden">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id + j}`} alt="User" className="w-full h-full" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {activeItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveItem(null)}
              className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl border-l border-black/[0.06] z-50 flex flex-col"
            >
              <div className="px-6 py-4 border-b border-black/[0.06] flex items-start justify-between bg-[#F9FAFB]">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest" style={{ color: getColumnColor(activeItem.status), backgroundColor: `${getColumnColor(activeItem.status)}1A` }}>
                      {activeItem.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${getPriorityColor(activeItem.priority)}`}>
                      {activeItem.priority}
                    </span>
                  </div>
                  <input 
                    className="text-2xl font-bold text-[#0F0F0F] bg-transparent outline-none border-none focus:ring-0 w-full p-0"
                    value={activeItem.title}
                    onChange={e => updateItem(activeItem.id, { title: e.target.value })}
                  />
                </div>
                <button onClick={() => setActiveItem(null)} className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex border-b border-black/[0.06] px-6 gap-6 text-sm font-semibold text-neutral-500">
                {["Overview", "Checklist", "Notes", "Activity"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 relative ${activeTab === tab ? "text-blue-600" : "hover:text-[#0F0F0F]"}`}
                  >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "Overview" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Due Date</label>
                        <div className="flex items-center gap-2 px-3 py-2 border border-black/[0.06] rounded-xl">
                          <Clock className="w-4 h-4 text-neutral-400" />
                          <input 
                            type="text" 
                            className="text-sm font-semibold outline-none w-full" 
                            value={activeItem.due} 
                            onChange={e => updateItem(activeItem.id, { due: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Priority</label>
                        <CustomSelect 
                          value={activeItem.priority} 
                          onChange={val => updateItem(activeItem.id, { priority: val })} 
                          options={[{value: "Low", label: "Low"}, {value: "Medium", label: "Medium"}, {value: "High", label: "High"}, {value: "Urgent", label: "Urgent"}]} 
                          className="px-3 py-2 border border-black/[0.06] rounded-xl text-sm font-semibold" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Tags
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {activeItem.tags?.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-[#F4F5F8] text-[#4B5264] border border-[#E2E4E9] rounded-lg text-xs font-semibold flex items-center gap-1">
                            {tag}
                            <button className="text-neutral-400 hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                        <button className="px-3 py-1 border border-dashed border-neutral-300 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-neutral-50">
                          + Add Tag
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                        <AlignLeft className="w-4 h-4" /> Description
                      </label>
                      <textarea 
                        className="w-full min-h-[120px] p-4 bg-[#F9FAFB] border border-black/[0.06] rounded-xl text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Add a more detailed description..."
                        value={activeItem.notes || ""}
                        onChange={e => updateItem(activeItem.id, { notes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                )}

                {activeTab === "Checklist" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-xs font-bold text-[#8A91A8]">{activeItem.progress || 0}%</span>
                      <div className="flex-1 bg-[#E2E4E9] rounded-[3px] h-[6px]">
                        <div className="h-[6px] rounded-[3px] transition-all" style={{ width: `${activeItem.progress || 0}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}></div>
                      </div>
                    </div>
                    
                    {activeItem.checklist?.map((task, idx) => (
                      <div key={task.id || idx} className="flex items-center gap-3 p-3 hover:bg-[#F9FAFB] rounded-xl group transition-colors">
                        <button 
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${task.done ? 'bg-blue-600 border-blue-600 text-white' : 'border-neutral-300'}`}
                          onClick={() => {
                            const newChecklist = [...activeItem.checklist];
                            newChecklist[idx].done = !newChecklist[idx].done;
                            const doneCount = newChecklist.filter(t => t.done).length;
                            const newProgress = Math.round((doneCount / newChecklist.length) * 100);
                            updateItem(activeItem.id, { checklist: newChecklist, progress: newProgress });
                          }}
                        >
                          {task.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <input 
                          type="text" 
                          className={`flex-1 bg-transparent border-none outline-none text-sm font-medium ${task.done ? 'text-neutral-400 line-through' : 'text-[#0F0F0F]'}`}
                          value={task.text}
                          onChange={(e) => {
                            const newChecklist = [...activeItem.checklist];
                            newChecklist[idx].text = e.target.value;
                            updateItem(activeItem.id, { checklist: newChecklist });
                          }}
                        />
                        <button 
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all"
                          onClick={() => {
                            const newChecklist = activeItem.checklist.filter((_, i) => i !== idx);
                            const doneCount = newChecklist.filter(t => t.done).length;
                            const newProgress = newChecklist.length ? Math.round((doneCount / newChecklist.length) * 100) : 0;
                            updateItem(activeItem.id, { checklist: newChecklist, progress: newProgress });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => {
                        const newChecklist = [...(activeItem.checklist || []), { id: Date.now(), text: "", done: false }];
                        const doneCount = newChecklist.filter(t => t.done).length;
                        const newProgress = Math.round((doneCount / newChecklist.length) * 100);
                        updateItem(activeItem.id, { checklist: newChecklist, progress: newProgress });
                      }}
                      className="px-4 py-2 mt-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold transition-colors w-full"
                    >
                      Add an item
                    </button>
                  </div>
                )}

                {activeTab === "Notes" && (
                   <textarea 
                   className="w-full h-full min-h-[300px] p-4 bg-[#F9FAFB] border border-black/[0.06] rounded-xl text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                   placeholder="Scratchpad for random thoughts..."
                   value={activeItem.notes || ""}
                   onChange={e => updateItem(activeItem.id, { notes: e.target.value })}
                 ></textarea>
                )}

                {activeTab === "Activity" && (
                  <div className="space-y-6">
                    {activeItem.activity?.map((act, i) => (
                      <div key={act.id || i} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0F0F0F]">{act.text}</p>
                          <p className="text-xs font-medium text-neutral-500 mt-0.5">{act.date}</p>
                        </div>
                      </div>
                    ))}
                    {(!activeItem.activity || activeItem.activity.length === 0) && (
                      <p className="text-sm text-neutral-500 text-center py-8 font-medium">No activity yet.</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Modal */}
      <AnimatePresence>
        {isNewModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsNewModalOpen(false)}
              className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[500px] bg-white rounded-3xl shadow-2xl p-6 z-50 border border-black/[0.06]"
            >
              <h3 className="text-xl font-bold mb-6 text-[#0F0F0F]">Create New Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Title</label>
                  <input type="text" value={newModalTitle} onChange={e => setNewModalTitle(e.target.value)} className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-black/[0.06] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Next.js 16 Tutorial" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Stage</label>
                    <CustomSelect 
                      value={newModalStage} 
                      onChange={setNewModalStage} 
                      options={COLUMNS.map(c => ({value: c.name, label: c.name}))} 
                      className="px-4 py-2.5 bg-[#F9FAFB] border border-black/[0.06] rounded-xl text-sm font-medium" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Priority</label>
                    <CustomSelect 
                      value={newModalPriority} 
                      onChange={setNewModalPriority} 
                      options={[{value: "Low", label: "Low"}, {value: "Medium", label: "Medium"}, {value: "High", label: "High"}, {value: "Urgent", label: "Urgent"}]} 
                      className="px-4 py-2.5 bg-[#F9FAFB] border border-black/[0.06] rounded-xl text-sm font-medium" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Due Date</label>
                  <input type="text" value={newModalDue} onChange={e => setNewModalDue(e.target.value)} className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-black/[0.06] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Tomorrow" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setIsNewModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-neutral-500 hover:bg-neutral-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleCreateNewProject} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-500 transition-all">Create Project</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
