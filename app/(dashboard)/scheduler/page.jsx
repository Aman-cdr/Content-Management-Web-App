"use client";

import { useState, useMemo } from "react";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  Camera, 
  Music, 
  Bird as TwitterIcon,
  MoreVertical,
  Calendar as CalendarIcon,
  Clock,
  Layout,
  ExternalLink,
  X,
  ChevronDown
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  addDays
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import RichTextEditor from "@/app/components/RichTextEditor";

// ---------- Constants & Mock Data ----------

const PLATFORMS = {
  YouTube: { name: "YouTube", color: "#FF0000", icon: Video },
  Instagram: { name: "Instagram", color: "#E1306C", icon: Camera },
  TikTok: { name: "TikTok", color: "#000000", icon: Music, textColor: "#FFFFFF" },
  Twitter: { name: "Twitter", color: "#1DA1F2", icon: TwitterIcon }
};

// Removed INITIAL_POSTS in favor of database integration

// ---------- Components ----------

function PlatformIcon({ platform, size = 16 }) {
  const Icon = PLATFORMS[platform]?.icon || Layout;
  return <Icon size={size} style={{ color: PLATFORMS[platform]?.color }} />;
}

function StatusBadge({ status }) {
  const styles = {
    Published: "bg-emerald-400/10 text-emerald-400",
    Scheduled: "bg-blue-400/10 text-blue-400",
    Draft: "bg-neutral-500/10 text-neutral-400"
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${styles[status]}`}>
      {status}
    </span>
  );
}

function CustomSelect({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOpt, setHoveredOpt] = useState(null);

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#F9FAFB] border border-black/[0.06] rounded-2xl px-6 py-4 text-sm font-bold flex items-center justify-between cursor-pointer hover:bg-neutral-100 transition-colors"
      >
        <div className="h-5 overflow-hidden flex items-center relative w-full">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
              className="text-[#0F0F0F] absolute"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 top-[100%] mt-2 bg-[#FCFCFD] border border-black/[0.08] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] p-2 z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
            >
              {options.map(opt => (
                <div 
                  key={opt}
                  onMouseEnter={() => setHoveredOpt(opt)}
                  onMouseLeave={() => setHoveredOpt(null)}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`relative px-4 py-3 text-sm font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-between z-10 ${value === opt ? 'text-blue-600' : 'text-[#374151]'}`}
                >
                  {hoveredOpt === opt && (
                    <motion.div 
                      layoutId="hover-bg-pill"
                      className="absolute inset-0 bg-[#F3F4F6] rounded-xl z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                    />
                  )}
                  <span className={`relative z-10 transform transition-transform duration-200 ${hoveredOpt === opt ? 'translate-x-1' : ''}`}>{opt}</span>
                  {value === opt && (
                    <motion.div 
                      layoutId="active-select-dot"
                      className="relative z-10 w-1.5 h-1.5 bg-blue-600 rounded-full"
                    />
                  )}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SchedulerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { contents, addContent } = useContent();

  const posts = useMemo(() => {
    return contents.map(c => {
      let platform = "YouTube";
      if (c.platforms && c.platforms.length > 0) {
        if (c.platforms.includes("Instagram Reels") || c.platforms.includes("Instagram")) platform = "Instagram";
        else if (c.platforms.includes("YouTube Shorts") || c.platforms.includes("YouTube")) platform = "YouTube";
        else if (c.platforms.includes("TikTok")) platform = "TikTok";
        else if (c.platforms.includes("Twitter/X") || c.platforms.includes("Twitter")) platform = "Twitter";
      }

      let status = "Draft";
      if (c.status === "published") status = "Published";
      else if (c.status === "scheduled" || c.status === "Scheduled") status = "Scheduled";

      let date = new Date();
      let time = "12:00";
      if (c.scheduledDate) {
        date = new Date(c.scheduledDate);
        time = c.scheduledTime || format(date, "HH:mm");
      } else if (c.createdAt) {
        date = new Date(c.createdAt);
        time = format(date, "HH:mm");
      }

      return {
        id: c.id,
        title: c.title || "Untitled",
        platform,
        date,
        time,
        status,
        description: c.description || ""
      };
    });
  }, [contents]);
  const [filter, setFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form State
  const [newPost, setNewPost] = useState({
    title: "",
    platform: "YouTube",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "12:00",
    status: "Scheduled",
    description: ""
  });

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filteredPosts = useMemo(() => {
    return posts.filter(p => filter === "All" || p.platform === filter);
  }, [posts, filter]);

  const upcomingPosts = useMemo(() => {
    return [...posts]
      .filter(p => p.date >= new Date())
      .sort((a, b) => a.date - b.date)
      .slice(0, 7);
  }, [posts]);

  const selectedDayPosts = useMemo(() => {
    return posts.filter(p => isSameDay(p.date, selectedDate));
  }, [posts, selectedDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleAddPost = async (e) => {
    e.preventDefault();
    
    let mappedPlatforms = ["YouTube"];
    if (newPost.platform === "Instagram") mappedPlatforms = ["Instagram Reels"];
    else if (newPost.platform === "TikTok") mappedPlatforms = ["TikTok"];
    else if (newPost.platform === "Twitter") mappedPlatforms = ["Twitter/X"];

    const postToAdd = {
      title: newPost.title,
      description: newPost.description,
      platforms: mappedPlatforms,
      type: "video",
      status: newPost.status.toLowerCase(),
      scheduledDate: new Date(newPost.date).toISOString(),
      scheduledTime: newPost.time
    };

    await addContent(postToAdd);
    
    setIsModalOpen(false);
    setNewPost({
      title: "",
      platform: "YouTube",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "12:00",
      status: "Scheduled",
      description: ""
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2 text-[#0F0F0F]">Scheduler</h2>
          <p className="text-neutral-500">Plan and schedule your content pipeline</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 group"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          New Post
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Section 1: Calendar View */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white border border-black/[0.06] p-4 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold min-w-[150px] text-[#0F0F0F]">{format(currentDate, "MMMM yyyy")}</h3>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-600">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-600">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex gap-1 p-1 bg-[#F3F4F6] border border-black/[0.06] rounded-2xl">
              {["All", ...Object.keys(PLATFORMS)].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filter === tab 
                    ? "bg-white text-[#0F0F0F] shadow-sm border border-black/[0.04]" 
                    : "text-neutral-500 hover:text-[#0F0F0F]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-0 overflow-hidden border-black/[0.06] bg-white shadow-sm">
            <div className="grid grid-cols-7 gap-px bg-black/[0.06] rounded-2xl overflow-hidden border border-black/[0.06]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="bg-[#FAFAFA] py-4 text-center text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  {day}
                </div>
              ))}
              {days.map((day, idx) => {
                const dayPosts = filteredPosts.filter(p => isSameDay(p.date, day));
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);

                return (
                  <div 
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[120px] bg-white p-2 transition-all cursor-pointer hover:bg-neutral-50 relative group ${
                      !isCurrentMonth ? "bg-neutral-50/50 opacity-40" : ""
                    } ${isSelected ? "ring-2 ring-purple-500 ring-inset z-10" : ""} ${isToday(day) ? "bg-purple-600/[0.04]" : ""}`}
                  >
                    <span className={`text-xs font-bold ${isToday(day) ? "text-purple-600 bg-purple-100/50 px-2 py-1 rounded-lg" : "text-[#374151]"}`}>
                      {format(day, "d")}
                    </span>
                    
                    <div className="mt-2 space-y-1">
                      {dayPosts.slice(0, 3).map(post => (
                        <div 
                          key={post.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F9FAFB] border border-black/[0.04]"
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full shrink-0" 
                            style={{ backgroundColor: PLATFORMS[post.platform]?.color }} 
                          />
                          <span className="text-[10px] font-bold text-[#374151] truncate max-w-[80%]">
                            {post.title.length > 12 ? post.title.substring(0, 12) + "..." : post.title}
                          </span>
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <div className="text-[9px] font-black text-neutral-500 px-2 uppercase tracking-tighter">
                          + {dayPosts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Day Detail Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col h-full"
        >
          <div className="card p-8 flex flex-col h-full border-black/[0.06] bg-white shadow-sm">
            <div className="mb-8">
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-2">Schedule for</p>
              <h3 className="text-3xl font-black text-[#0F0F0F]">{format(selectedDate, "EEEE, MMM do")}</h3>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
              {selectedDayPosts.length > 0 ? (
                selectedDayPosts.map(post => (
                  <motion.div 
                    key={post.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-3xl bg-[#F9FAFB] border border-black/[0.04] hover:border-black/[0.08] transition-all relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <PlatformIcon platform={post.platform} size={40} />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon platform={post.platform} />
                      <StatusBadge status={post.status} />
                    </div>
                    <h4 className="font-bold text-[#374151] mb-4 line-clamp-2">{post.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-neutral-400" />
                        {post.time}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-12">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
                    <CalendarIcon className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="font-bold text-neutral-500 mb-1">No content scheduled</p>
                  <p className="text-xs text-neutral-500 max-w-[200px]">Click the button below to add something to this day.</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                setNewPost({...newPost, date: format(selectedDate, "yyyy-MM-dd")});
                setIsModalOpen(true);
              }}
              className="mt-8 w-full py-4 rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-black/[0.06] transition-all text-sm font-black uppercase tracking-widest text-[#374151]"
            >
              Add to this day
            </button>
          </div>
        </motion.div>
      </div>

      {/* Section 3: Upcoming Queue */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Layout className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold">Upcoming Queue</h3>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {upcomingPosts.map(post => (
            <motion.div 
              key={post.id}
              whileHover={{ y: -5 }}
              className="min-w-[300px] card p-6 group cursor-pointer bg-white border-black/[0.06] shadow-sm"
            >
              <div className="h-40 w-full rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 mb-4 overflow-hidden relative border border-black/[0.04]">
                <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:scale-110 transition-transform duration-700">
                  <PlatformIcon platform={post.platform} size={60} />
                </div>
                <div className="absolute top-4 right-4">
                  <StatusBadge status={post.status} />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <PlatformIcon platform={post.platform} size={14} />
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  {format(new Date(post.date), "MMM d")} • {post.time}
                </p>
              </div>
              <h4 className="font-bold text-[#374151] line-clamp-1">{post.title}</h4>
            </motion.div>
          ))}
        </div>
      </section>

      {/* New Post Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-black/[0.06] rounded-[32px] p-8 shadow-2xl overflow-y-auto max-h-[90vh] [&::-webkit-scrollbar]:hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none z-0">
                <Layout size={150} className="text-black" />
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-black tracking-tighter text-[#0F0F0F]">New Post</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors relative z-10 cursor-pointer">
                  <X className="w-6 h-6 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleAddPost} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 block">Content Title</label>
                  <input 
                    type="text" 
                    required
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    placeholder="Enter post title..."
                    className="w-full bg-[#F9FAFB] border border-black/[0.06] rounded-2xl px-5 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-neutral-400 text-[#0F0F0F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 block">Platform</label>
                    <CustomSelect 
                      value={newPost.platform}
                      onChange={(val) => setNewPost({...newPost, platform: val})}
                      options={Object.keys(PLATFORMS)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 block">Status</label>
                    <CustomSelect 
                      value={newPost.status}
                      onChange={(val) => setNewPost({...newPost, status: val})}
                      options={["Draft", "Scheduled"]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 block">Date</label>
                    <input 
                      type="date" 
                      required
                      value={newPost.date}
                      onChange={(e) => setNewPost({...newPost, date: e.target.value})}
                      className="w-full bg-[#F9FAFB] border border-black/[0.06] rounded-2xl px-5 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-[#0F0F0F]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 block">Time</label>
                    <input 
                      type="time" 
                      required
                      value={newPost.time}
                      onChange={(e) => setNewPost({...newPost, time: e.target.value})}
                      className="w-full bg-[#F9FAFB] border border-black/[0.06] rounded-2xl px-5 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-[#0F0F0F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 block">Content Script / Notes</label>
                  <RichTextEditor 
                    content={newPost.description}
                    onChange={(html) => setNewPost({...newPost, description: html})}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                >
                  Schedule Post
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
