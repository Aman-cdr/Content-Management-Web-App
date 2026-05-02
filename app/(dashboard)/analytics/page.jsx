"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  DollarSign, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown,
  MoreVertical,
  Search,
  Filter,
  Download,
  Calendar
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// ---------- Mock Data ----------

const STATS_DATA = [
  {
    name: "Total Views",
    value: "1,284,502",
    change: "+12.5%",
    trend: [3000, 4000, 3500, 5000, 4800, 6000, 5500],
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: Eye
  },
  {
    name: "Subscribers",
    value: "84,200",
    change: "+8.2%",
    trend: [2000, 2500, 2200, 3000, 2800, 3500, 3200],
    color: "text-purple-600",
    bg: "bg-purple-50",
    icon: Users
  },
  {
    name: "Avg Watch Time",
    value: "4m 32s",
    change: "+5.1%",
    trend: [4.1, 4.2, 4.0, 4.5, 4.3, 4.6, 4.4],
    color: "text-pink-600",
    bg: "bg-pink-50",
    icon: Clock
  },
  {
    name: "Revenue",
    value: "$12,450",
    change: "+15.3%",
    trend: [8000, 9000, 8500, 10000, 9500, 11000, 10500],
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    icon: DollarSign
  }
];

const MAIN_CHART_DATA = {
  Views: [
    { date: "Apr 1", value: 45000 }, { date: "Apr 3", value: 52000 }, { date: "Apr 5", value: 48000 },
    { date: "Apr 7", value: 61000 }, { date: "Apr 9", value: 55000 }, { date: "Apr 11", value: 67000 },
    { date: "Apr 13", value: 72000 }, { date: "Apr 15", value: 68000 }, { date: "Apr 17", value: 75000 },
    { date: "Apr 19", value: 82000 }, { date: "Apr 21", value: 78000 }, { date: "Apr 23", value: 85000 },
    { date: "Apr 25", value: 92000 }, { date: "Apr 27", value: 88000 }, { date: "Apr 29", value: 95000 }
  ],
  Subscribers: [
    { date: "Apr 1", value: 1200 }, { date: "Apr 3", value: 1500 }, { date: "Apr 5", value: 1300 },
    { date: "Apr 7", value: 1800 }, { date: "Apr 9", value: 1600 }, { date: "Apr 11", value: 2100 },
    { date: "Apr 13", value: 2300 }, { date: "Apr 15", value: 2000 }, { date: "Apr 17", value: 2500 },
    { date: "Apr 19", value: 2800 }, { date: "Apr 21", value: 2600 }, { date: "Apr 23", value: 3100 },
    { date: "Apr 25", value: 3300 }, { date: "Apr 27", value: 3000 }, { date: "Apr 29", value: 3500 }
  ],
  Revenue: [
    { date: "Apr 1", value: 400 }, { date: "Apr 3", value: 550 }, { date: "Apr 5", value: 480 },
    { date: "Apr 7", value: 620 }, { date: "Apr 9", value: 580 }, { date: "Apr 11", value: 710 },
    { date: "Apr 13", value: 750 }, { date: "Apr 15", value: 680 }, { date: "Apr 17", value: 820 },
    { date: "Apr 19", value: 880 }, { date: "Apr 21", value: 840 }, { date: "Apr 23", value: 950 },
    { date: "Apr 25", value: 1020 }, { date: "Apr 27", value: 980 }, { date: "Apr 29", value: 1100 }
  ],
  "Watch Time": [
    { date: "Apr 1", value: 3200 }, { date: "Apr 3", value: 3800 }, { date: "Apr 5", value: 3500 },
    { date: "Apr 7", value: 4100 }, { date: "Apr 9", value: 3900 }, { date: "Apr 11", value: 4500 },
    { date: "Apr 13", value: 4800 }, { date: "Apr 15", value: 4400 }, { date: "Apr 17", value: 5100 },
    { date: "Apr 19", value: 5400 }, { date: "Apr 21", value: 5200 }, { date: "Apr 23", value: 5800 },
    { date: "Apr 25", value: 6100 }, { date: "Apr 27", value: 5700 }, { date: "Apr 29", value: 6300 }
  ]
};

const PLATFORM_DATA = [
  { name: "YouTube", value: 45, color: "#ef4444", amount: "578K" },
  { name: "Instagram", value: 25, color: "#ec4899", amount: "321K" },
  { name: "TikTok", value: 20, color: "#a855f7", amount: "256K" },
  { name: "Twitter", value: 10, color: "#3b82f6", amount: "128K" }
];

const TOP_CONTENT = [
  { id: 1, title: "10 Tips for Better Lighting", views: "124K", ctr: "8.2%", revenue: "$1,240", thumb: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=100&q=80" },
  { id: 2, title: "My Daily Morning Routine", views: "98K", ctr: "7.5%", revenue: "$850", thumb: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80" },
  { id: 3, title: "Setup Tour 2024 (Minimalist)", views: "86K", ctr: "9.1%", revenue: "$2,100", thumb: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=100&q=80" },
  { id: 4, title: "How I grew to 100K subs", views: "75K", ctr: "6.8%", revenue: "$620", thumb: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&q=80" },
  { id: 5, title: "Top 5 AI tools for creators", views: "62K", ctr: "10.4%", revenue: "$1,540", thumb: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&q=80" },
];

const GEOGRAPHY_DATA = [
  { name: "United States", value: 42 },
  { name: "United Kingdom", value: 15 },
  { name: "India", value: 12 },
  { name: "Canada", value: 8 },
  { name: "Germany", value: 5 }
];

const DEVICE_DATA = [
  { name: "Mobile", value: 58, color: "#7c3aed" },
  { name: "Desktop", value: 32, color: "#3b82f6" },
  { name: "Tablet", value: 10, color: "#ec4899" }
];

// 7 days x 24 hours heatmap mock
const HEATMAP_DATA = Array.from({ length: 7 }, (_, day) => 
  Array.from({ length: 24 }, (_, hour) => ({
    day,
    hour,
    intensity: Math.floor(Math.random() * 100)
  }))
).flat();

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------- Components ----------

function StatCard({ stat, isLoading }) {
  if (isLoading) {
    return (
      <div className="glass-card p-6 relative overflow-hidden animate-pulse bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-black/5" />
          <div className="w-14 h-6 rounded-lg bg-black/5" />
        </div>
        <div className="h-4 w-24 rounded bg-black/5 mb-2" />
        <div className="h-8 w-32 rounded bg-black/5" />
      </div>
    );
  }

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-6 relative overflow-hidden group bg-white border-black/[0.06]"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <stat.icon size={80} className="text-black" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${stat.bg}`}>
          <stat.icon className={`w-5 h-5 ${stat.color}`} />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.change.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
          {stat.change}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-neutral-500 mb-1">{stat.name}</p>
          <p className="text-3xl font-bold tracking-tight text-[#0F0F0F]">{stat.value}</p>
        </div>
        <div className="h-12 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stat.trend.map((v, i) => ({ v, i }))}>
              <Line 
                type="monotone" 
                dataKey="v" 
                stroke={stat.color.includes('blue') ? '#2563eb' : stat.color.includes('purple') ? '#9333ea' : stat.color.includes('pink') ? '#db2777' : '#059669'} 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

function SectionSkeleton({ height = "400px" }) {
  return (
    <div className={`card w-full h-[${height}] animate-pulse bg-white border-black/[0.06] rounded-3xl overflow-hidden`}>
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-black/5 rounded" />
        <div className="h-4 w-full bg-black/5 rounded" />
        <div className="flex-1 h-full bg-black/5 rounded mt-8" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Views");
  const [sortConfig, setSortConfig] = useState({ key: 'views', direction: 'desc' });
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);

  const timeRanges = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const formatValue = (value) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value;
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedContent = [...TOP_CONTENT].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    // Clean strings for comparison
    if (typeof aVal === 'string') {
      aVal = parseFloat(aVal.replace(/[^0-9.]/g, ''));
      bVal = parseFloat(bVal.replace(/[^0-9.]/g, ''));
    }

    if (sortConfig.direction === 'asc') return aVal - bVal;
    return bVal - aVal;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2 text-[#0F0F0F]">Analytics</h2>
          <p className="text-neutral-500">Your channel performance at a glance.</p>
        </div>
        <div className="flex gap-3 relative">
          <div className="relative">
            <button 
              onClick={() => setIsRangeDropdownOpen(!isRangeDropdownOpen)}
              className="flex items-center gap-2 bg-white border border-black/[0.06] rounded-2xl px-6 py-2.5 text-sm font-bold hover:bg-[#F9FAFB] transition-all min-w-[180px] justify-between text-[#374151]"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                {timeRange}
              </div>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isRangeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isRangeDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsRangeDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-full min-w-[200px] bg-[#FCFCFD] border border-black/[0.08] rounded-2xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
                  >
                    {timeRanges.map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setTimeRange(range);
                          setIsRangeDropdownOpen(false);
                          setIsLoading(true);
                          setTimeout(() => setIsLoading(false), 300);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          timeRange === range 
                          ? "bg-blue-600 text-white" 
                          : "text-neutral-500 hover:bg-[#F3F4F6] hover:text-[#0F0F0F]"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Section 1: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_DATA.map((stat, idx) => (
          <StatCard key={stat.name} stat={stat} isLoading={isLoading} />
        ))}
      </div>

      {/* Section 2: Main Chart */}
      {isLoading ? (
        <SectionSkeleton height="500px" />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 bg-white border-black/[0.06] shadow-sm"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div className="flex gap-1 p-1 bg-[#F3F4F6] border border-black/[0.06] rounded-2xl">
              {Object.keys(MAIN_CHART_DATA).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab 
                    ? "bg-white text-[#0F0F0F] shadow-sm border border-black/[0.04]" 
                    : "text-neutral-500 hover:text-[#0F0F0F]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-xs font-bold text-neutral-500">{activeTab}</span>
              </div>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MAIN_CHART_DATA[activeTab]}>
                <defs>
                  <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 700 }}
                  tickFormatter={formatValue}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderColor: 'rgba(0,0,0,0.06)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
                    padding: '12px 16px',
                    color: '#0F0F0F'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: '800', color: '#7c3aed' }}
                  cursor={{ stroke: '#7c3aed', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#7c3aed" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPurple)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Section 3: Two Column Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Platform Breakdown */}
        {isLoading ? (
          <SectionSkeleton />
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-8 bg-white border-black/[0.06] shadow-sm"
          >
            <h3 className="text-xl font-bold mb-8 text-[#0F0F0F]">Platform Breakdown</h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-[250px] w-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PLATFORM_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {PLATFORM_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-[#0F0F0F]">1.2M</span>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Total Reach</span>
                </div>
              </div>
              <div className="flex-1 space-y-4 w-full">
                {PLATFORM_DATA.map((p) => (
                  <div key={p.name} className="flex items-center justify-between p-3 rounded-2xl bg-[#F9FAFB] border border-black/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-bold text-[#374151]">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#0F0F0F]">{p.amount}</p>
                      <p className="text-[10px] text-neutral-500 font-bold">{p.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Performing Content */}
        {isLoading ? (
          <SectionSkeleton />
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-8 flex flex-col bg-white border-black/[0.06] shadow-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-[#0F0F0F]">Top Performing Content</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-bold">See All</button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-neutral-500 uppercase font-black tracking-widest border-b border-black/[0.06]">
                    <th className="pb-4 font-black">Content</th>
                    <th className="pb-4 cursor-pointer hover:text-[#0F0F0F] transition-colors" onClick={() => handleSort('views')}>
                      Views {sortConfig.key === 'views' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="pb-4 cursor-pointer hover:text-[#0F0F0F] transition-colors" onClick={() => handleSort('ctr')}>
                      CTR {sortConfig.key === 'ctr' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="pb-4 cursor-pointer hover:text-[#0F0F0F] transition-colors" onClick={() => handleSort('revenue')}>
                      Revenue {sortConfig.key === 'revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {sortedContent.map((item) => (
                    <tr key={item.id} className="group hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <img src={item.thumb} alt={item.title} className="w-12 h-8 rounded-lg object-cover bg-neutral-100" />
                          <span className="text-sm font-bold text-[#374151] line-clamp-1">{item.title}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm font-black text-[#0F0F0F]">{item.views}</td>
                      <td className="py-4 text-sm font-black text-emerald-600">{item.ctr}</td>
                      <td className="py-4 text-sm font-black text-[#0F0F0F]">{item.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Section 4: Audience Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Geographies */}
        {isLoading ? (
          <SectionSkeleton />
        ) : (
          <motion.div 
            whileHover={{ y: -5 }}
            className="card p-8 bg-white border-black/[0.06] shadow-sm"
          >
            <h3 className="text-xl font-bold mb-8 text-[#0F0F0F]">Top Geographies</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={GEOGRAPHY_DATA} layout="vertical" barSize={12}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 'bold' }}
                    width={100}
                  />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '12px' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Device Breakdown */}
        {isLoading ? (
          <SectionSkeleton />
        ) : (
          <motion.div 
            whileHover={{ y: -5 }}
            className="card p-8 bg-white border-black/[0.06] shadow-sm"
          >
            <h3 className="text-xl font-bold mb-8 text-[#0F0F0F]">Device Breakdown</h3>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DEVICE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {DEVICE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                <span className="text-3xl font-black text-[#0F0F0F]">58%</span>
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Mobile First</span>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {DEVICE_DATA.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs font-bold text-neutral-500">{d.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Peak Hours Heatmap */}
        {isLoading ? (
          <SectionSkeleton />
        ) : (
          <motion.div 
            whileHover={{ y: -5 }}
            className="card p-8 bg-white border-black/[0.06] shadow-sm"
          >
            <h3 className="text-xl font-bold mb-6 text-[#0F0F0F]">Peak Active Hours</h3>
            <div className="flex flex-col h-[250px]">
              <div className="grid grid-cols-[30px_1fr] flex-1 gap-2">
                <div className="flex flex-col justify-between py-2">
                  {DAYS.map(day => (
                    <span key={day} className="text-[10px] font-black text-neutral-500 uppercase">{day}</span>
                  ))}
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                  {HEATMAP_DATA.map((cell, i) => (
                    <div 
                      key={i} 
                      className="rounded-[2px] transition-all hover:scale-125 hover:z-10 cursor-help"
                      style={{ 
                        backgroundColor: cell.intensity > 80 ? '#7c3aed' : cell.intensity > 50 ? '#8b5cf6' : cell.intensity > 20 ? '#ddd6fe' : '#F3F4F6',
                        aspectRatio: '1/1'
                      }}
                      title={`${DAYS[cell.day]} ${cell.hour}:00 - Intensity: ${cell.intensity}%`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-4 px-8">
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Quiet</span>
                <div className="flex gap-1 h-2 items-center">
                  <div className="w-3 h-2 bg-[#F3F4F6] rounded-[1px]" />
                  <div className="w-3 h-2 bg-[#ddd6fe] rounded-[1px]" />
                  <div className="w-3 h-2 bg-[#8b5cf6] rounded-[1px]" />
                  <div className="w-3 h-2 bg-[#7c3aed] rounded-[1px]" />
                </div>
                <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest font-bold">Peak</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
