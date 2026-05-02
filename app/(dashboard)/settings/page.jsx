"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  User, 
  Bell, 
  Shield, 
  Link as LinkIcon, 
  Globe, 
  CreditCard,
  Check,
  ExternalLink,
  Camera,
  Zap,
  MapPin,
  AtSign,
  Eye,
  Info,
  Lock,
  Mail,
  Smartphone,
  History,
  Trash2,
  ChevronRight,
  AlertTriangle,
  MoreVertical
} from "lucide-react";
import { 
  FaYoutube, 
  FaInstagram, 
  FaTwitter, 
  FaMusic, 
  FaLinkedin,
  FaGlobe,
  FaLink
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

// ---------- Constants ----------

const BANNER_GRADIENTS = [
  "linear-gradient(135deg, #6366F1, #8B5CF6)",
  "linear-gradient(135deg, #EC4899, #8B5CF6)",
  "linear-gradient(135deg, #10B981, #3B82F6)",
  "linear-gradient(135deg, #F59E0B, #EF4444)",
  "linear-gradient(135deg, #0F172A, #334155)",
  "linear-gradient(135deg, #60A5FA, #3B82F6)"
];

const NICHES = ["Content Creator", "Developer", "Designer", "Educator", "Entertainer", "Fitness", "Business", "Other"];

// ---------- Components ----------

function Toggle({ checked, onChange }) {
  return (
    <button 
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 outline-none ${checked ? 'bg-[#4F46E5]' : 'bg-[#E2E4E9]'}`}
    >
      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function SectionHeading({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 border-bottom border-[#F4F5F8] pb-3 mb-5">
      {Icon && <Icon className="w-4 h-4 text-[#4B5264]" />}
      <h4 className="text-base font-semibold text-[#0A0A0F]">{children}</h4>
    </div>
  );
}

// ==========================================================
//  SETTINGS PAGE
// ==========================================================

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [showToast, setShowToast] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || "Aman Singh",
    username: "amansingh",
    email: session?.user?.email || "aman@creatorpro.com",
    bio: "I build awesome SaaS products and create content about Next.js and AI workflows. Love exploring new AI tools and web tech.",
    niche: "Developer",
    location: "New Delhi, India",
    banner: BANNER_GRADIENTS[0],
    website: "",
    youtube: "youtube.com/@AlexTech",
    instagram: "alex.codes",
    tiktok: "alex_creates",
    twitter: "alex_dev",
    avatar: null
  });

  const [usernameStatus, setUsernameStatus] = useState("available"); // checking | available | taken

  // Handle username check mock
  useEffect(() => {
    if (profileData.username) {
      setUsernameStatus("checking");
      const timer = setTimeout(() => setUsernameStatus("available"), 600);
      return () => clearTimeout(timer);
    }
  }, [profileData.username]);

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleProfileChange("avatar", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setShowToast(true);
    setIsDirty(false);
    setTimeout(() => setShowToast(false), 3000);
  };

  const initials = profileData.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "accounts", name: "Connected Accounts", icon: LinkIcon },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "billing", name: "Billing", icon: CreditCard },
    { id: "security", name: "Security", icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#0F0F0F] mb-1">Settings</h2>
          <p className="text-neutral-500 text-sm">Manage your account preferences and creator identity.</p>
        </div>
        {isDirty && (
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-widest"
          >
            <AlertTriangle className="w-3 h-3" />
            Unsaved Changes
          </motion.div>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="border-b border-[#E2E4E9] flex gap-8 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === tab.id ? "text-[#4F46E5]" : "text-neutral-500 hover:text-neutral-700"}`}
          >
            <div className="flex items-center gap-2 px-1">
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </div>
            {activeTab === tab.id && (
              <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5]" />
            )}
          </button>
        ))}
      </div>

      <main>
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8"
            >
              {/* Profile Form */}
              <div className="bg-white border border-[#E2E4E9] rounded-[24px] p-8 shadow-sm space-y-10">
                {/* Banner & Avatar */}
                <div className="space-y-6">
                  <SectionHeading icon={Camera}>Identity Design</SectionHeading>
                  <div 
                    className="h-40 rounded-2xl relative transition-all duration-500 overflow-hidden" 
                    style={{ background: profileData.banner }}
                  >
                    <div className="absolute inset-0 bg-black/5" />
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                    
                    {/* Avatar Overlay */}
                    <div 
                      onClick={handleAvatarClick}
                      className="absolute -bottom-10 left-8 w-24 h-24 rounded-full border-4 border-white bg-white shadow-xl cursor-pointer group"
                    >
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative">
                        {profileData.avatar ? (
                          <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black">
                            {initials}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pl-[136px] pt-2">
                    <div className="flex gap-2">
                      {BANNER_GRADIENTS.map((g, i) => (
                        <button 
                          key={i}
                          onClick={() => handleProfileChange("banner", g)}
                          className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-125 ${profileData.banner === g ? 'border-indigo-600 scale-110' : 'border-white shadow-sm'}`}
                          style={{ background: g }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Banner Presets</p>
                  </div>
                </div>

                {/* Info Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Display Name</label>
                    <input 
                      type="text" 
                      value={profileData.name}
                      onChange={(e) => handleProfileChange("name", e.target.value)}
                      className="w-full h-12 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Username</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <AtSign className="w-4 h-4 text-neutral-400" />
                      </div>
                      <input 
                        type="text" 
                        value={profileData.username}
                        onChange={(e) => handleProfileChange("username", e.target.value)}
                        className="w-full h-12 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl pl-10 pr-10 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {usernameStatus === "checking" ? (
                          <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        ) : usernameStatus === "available" ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group cursor-not-allowed" title="Change email in Security tab">
                      <input 
                        type="email" 
                        value={profileData.email}
                        readOnly
                        className="w-full h-12 bg-[#EEEEF0] border border-[#E2E4E9] rounded-xl px-4 text-sm font-bold text-neutral-400 outline-none"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Lock className="w-3.5 h-3.5 text-neutral-300" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Creator Niche</label>
                    <select 
                      value={profileData.niche}
                      onChange={(e) => handleProfileChange("niche", e.target.value)}
                      className="w-full h-12 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Bio / About Me</label>
                    <span className={`text-[10px] font-bold ${profileData.bio.length > 160 ? 'text-red-500' : 'text-neutral-400'}`}>
                      {profileData.bio.length}/160
                    </span>
                  </div>
                  <textarea 
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => handleProfileChange("bio", e.target.value.substring(0, 160))}
                    className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-6 py-4 text-sm font-medium focus:border-indigo-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input 
                      type="text" 
                      value={profileData.location}
                      onChange={(e) => handleProfileChange("location", e.target.value)}
                      className="w-full h-12 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl pl-11 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Creator Links */}
                <div className="pt-6">
                  <SectionHeading icon={LinkIcon}>Creator Presence</SectionHeading>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input 
                        placeholder="Website URL"
                        value={profileData.website}
                        onChange={(e) => handleProfileChange("website", e.target.value)}
                        className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl pl-11 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="relative group">
                      <FaYoutube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input 
                        placeholder="YouTube URL"
                        value={profileData.youtube}
                        onChange={(e) => handleProfileChange("youtube", e.target.value)}
                        className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl pl-11 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="relative group">
                      <FaInstagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input 
                        placeholder="@instagram"
                        value={profileData.instagram}
                        onChange={(e) => handleProfileChange("instagram", e.target.value)}
                        className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl pl-11 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="relative group">
                      <FaTwitter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input 
                        placeholder="@twitter"
                        value={profileData.twitter}
                        onChange={(e) => handleProfileChange("twitter", e.target.value)}
                        className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl pl-11 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-8 border-t border-[#F4F5F8] flex items-center justify-between">
                  <p className="text-[10px] font-bold text-neutral-400 italic">Syncing with public profile...</p>
                  <button 
                    onClick={handleSave}
                    className="px-10 py-3.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Live Preview */}
              <aside className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">
                  <Eye className="w-3.5 h-3.5" />
                  Profile Preview
                </div>
                <div className="bg-white border border-[#E2E4E9] rounded-[24px] overflow-hidden shadow-sm sticky top-24 transition-all hover:shadow-xl hover:-translate-y-1 duration-500 group">
                  <div className="h-20 transition-all duration-500" style={{ background: profileData.banner }} />
                  <div className="px-6 pb-6 text-center">
                    <div className="relative -mt-8 mb-4 inline-block">
                      <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-lg group-hover:scale-110 transition-transform duration-500">
                        <div className="w-full h-full rounded-xl bg-[#F3F4F6] overflow-hidden flex items-center justify-center">
                          {profileData.avatar ? (
                            <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-black">{initials}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <h5 className="font-bold text-[#111318] line-clamp-1">{profileData.name}</h5>
                    <p className="text-[11px] text-indigo-600 font-bold mb-3">@{profileData.username}</p>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest border border-indigo-100 mb-4">
                      {profileData.niche}
                    </span>
                    <p className="text-[11px] text-[#4B5264] line-clamp-3 leading-relaxed mb-6 italic">"{profileData.bio}"</p>
                    
                    <div className="flex justify-center gap-4 py-4 border-y border-[#F4F5F8]">
                      <div className="text-center">
                        <p className="text-xs font-black text-[#111318]">12.5K</p>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase">Fans</p>
                      </div>
                      <div className="h-6 w-px bg-[#F4F5F8]" />
                      <div className="text-center">
                        <p className="text-xs font-black text-[#111318]">482</p>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase">Posts</p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center gap-3">
                      <FaYoutube className="w-4 h-4 text-neutral-300 hover:text-red-500 cursor-pointer transition-colors" />
                      <FaInstagram className="w-4 h-4 text-neutral-300 hover:text-pink-500 cursor-pointer transition-colors" />
                      <FaTwitter className="w-4 h-4 text-neutral-300 hover:text-blue-400 cursor-pointer transition-colors" />
                      <FaGlobe className="w-4 h-4 text-neutral-300 hover:text-indigo-600 cursor-pointer transition-colors" />
                    </div>
                  </div>
                </div>
              </aside>
            </motion.div>
          )}

          {activeTab === "accounts" && (
            <motion.div 
              key="accounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <SectionHeading icon={LinkIcon}>Connected Accounts</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: "YouTube", icon: FaYoutube, color: "text-red-600", connected: true, handle: "@AmanTech", followers: "45.2K", lastSync: "2 hours ago" },
                  { name: "Twitter/X", icon: FaTwitter, color: "text-[#0F0F0F]", connected: true, handle: "@aman_cdr", followers: "12.8K", lastSync: "5 mins ago" },
                  { name: "TikTok", icon: FaMusic, color: "text-[#000000]", connected: false },
                  { name: "Instagram", icon: FaInstagram, color: "text-pink-600", connected: false },
                  { name: "LinkedIn", icon: FaLinkedin, color: "text-blue-700", connected: false }
                ].map((acc) => (
                  <div key={acc.name} className="bg-white border border-[#E2E4E9] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center ${acc.color}`}>
                          <acc.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-[#111318]">{acc.name}</p>
                          {acc.connected ? (
                            <p className="text-xs text-indigo-600 font-bold">{acc.handle}</p>
                          ) : (
                            <p className="text-xs text-neutral-400">Not connected</p>
                          )}
                        </div>
                      </div>
                      {acc.connected ? (
                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                          <Check className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <button className="text-[10px] font-black text-indigo-600 border border-indigo-200 px-4 py-1.5 rounded-full hover:bg-indigo-50 transition-all uppercase tracking-widest">
                          Connect
                        </button>
                      )}
                    </div>
                    {acc.connected && (
                      <div className="flex justify-between items-center pt-4 border-t border-[#F4F5F8]">
                        <div className="flex gap-4">
                          <div className="text-[10px] font-bold text-neutral-400">
                            <span className="block text-neutral-900 font-black">{acc.followers}</span> Followers
                          </div>
                          <div className="text-[10px] font-bold text-neutral-400">
                            <span className="block text-neutral-900 font-black">{acc.lastSync}</span> Sync
                          </div>
                        </div>
                        <button className="text-[10px] font-black text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest">Disconnect</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div 
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div className="bg-white border border-[#E2E4E9] rounded-2xl p-8 shadow-sm space-y-8">
                <div>
                  <SectionHeading icon={Mail}>Email Notifications</SectionHeading>
                  <div className="space-y-6">
                    {[
                      { id: "weekly", label: "Weekly performance report", desc: "Get a summary of your stats every Monday." },
                      { id: "milestone", label: "New subscriber milestone", desc: "Notification when you reach subscriber goals." },
                      { id: "scheduler", label: "Content scheduled reminders", desc: "Alerts for upcoming scheduled posts." },
                      { id: "insights", label: "AI insight alerts", desc: "Get notified when AI finds new growth opportunities." }
                    ].map((row) => (
                      <div key={row.id} className="flex items-center justify-between group">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#111318] group-hover:text-indigo-600 transition-colors">{row.label}</p>
                          <p className="text-xs text-neutral-400">{row.desc}</p>
                        </div>
                        <Toggle checked={true} onChange={() => {}} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-[#F4F5F8]">
                  <SectionHeading icon={Smartphone}>In-App Notifications</SectionHeading>
                  <div className="space-y-6">
                    {[
                      { id: "due", label: "Series episode due reminders", desc: "Desktop notification 1h before deadline." },
                      { id: "roadmap", label: "Roadmap deadline alerts", desc: "Alerts when projects are overdue." },
                      { id: "mentions", label: "Team mentions", desc: "Notify when a collaborator tags you." }
                    ].map((row) => (
                      <div key={row.id} className="flex items-center justify-between group">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#111318] group-hover:text-indigo-600 transition-colors">{row.label}</p>
                          <p className="text-xs text-neutral-400">{row.desc}</p>
                        </div>
                        <Toggle checked={row.id !== "mentions"} onChange={() => {}} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "billing" && (
            <motion.div 
              key="billing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 bg-white border border-[#E2E4E9] rounded-2xl p-8 shadow-sm flex flex-col md:flex-row justify-between gap-8">
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      Current Plan
                    </span>
                    <h3 className="text-3xl font-black text-[#0F0F0F]">Creator Pro</h3>
                    <p className="text-neutral-500 font-medium">$29/month · Billed annually</p>
                    <div className="space-y-2 pt-2">
                      {["Unlimited AI Scripts", "Advanced Analytics", "Team Collaborators (5)", "Custom Domain"].map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs font-bold text-[#374151]">
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Next Payment</p>
                      <p className="font-black text-[#111318]">Dec 12, 2026</p>
                    </div>
                    <button className="px-6 py-2.5 border border-indigo-600 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all">Manage Plan</button>
                  </div>
                </div>
                
                <div className="bg-white border border-[#E2E4E9] rounded-2xl p-8 shadow-sm space-y-6">
                  <SectionHeading icon={Zap}>Usage Meter</SectionHeading>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black">
                        <span className="text-neutral-400 uppercase tracking-widest">API Calls</span>
                        <span className="text-indigo-600">650 / 1000</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#F4F5F8] rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '65%' }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black">
                        <span className="text-neutral-400 uppercase tracking-widest">Storage</span>
                        <span className="text-indigo-600">2.3GB / 10GB</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#F4F5F8] rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '23%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E2E4E9] rounded-2xl p-8 shadow-sm space-y-6">
                <SectionHeading icon={History}>Billing History</SectionHeading>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#F4F5F8]">
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Date</th>
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Description</th>
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Amount</th>
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</th>
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[
                        { date: "Dec 12, 2025", desc: "Creator Pro Annual Subscription", amt: "$290.00", status: "Paid" },
                        { date: "Dec 12, 2024", desc: "Creator Pro Annual Subscription", amt: "$290.00", status: "Paid" },
                        { date: "Nov 05, 2024", desc: "Storage Add-on (5GB)", amt: "$10.00", status: "Paid" },
                        { date: "Dec 12, 2023", desc: "Creator Pro Annual Subscription", amt: "$290.00", status: "Paid" }
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-[#F9FAFB] hover:bg-[#FAFBFC]">
                          <td className="py-4 font-bold text-[#4B5264]">{row.date}</td>
                          <td className="py-4 font-medium text-[#4B5264]">{row.desc}</td>
                          <td className="py-4 font-black text-[#111318]">{row.amt}</td>
                          <td className="py-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">Paid</span></td>
                          <td className="py-4 text-right"><button className="text-indigo-600 font-bold hover:underline">Download</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div 
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-[#E2E4E9] rounded-2xl p-8 shadow-sm space-y-6">
                  <SectionHeading icon={Lock}>Change Password</SectionHeading>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Current Password</p>
                      <input type="password" placeholder="••••••••" className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-4 text-sm outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">New Password</p>
                      <input type="password" placeholder="••••••••" className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-4 text-sm outline-none focus:border-indigo-500" />
                      <div className="h-1 w-full bg-[#F4F5F8] rounded-full mt-2 overflow-hidden flex gap-1">
                        <div className="h-full bg-emerald-500 flex-1 rounded-full" />
                        <div className="h-full bg-emerald-500 flex-1 rounded-full" />
                        <div className="h-full bg-neutral-200 flex-1 rounded-full" />
                      </div>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase">Strength: Strong</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Confirm New Password</p>
                      <input type="password" placeholder="••••••••" className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-4 text-sm outline-none focus:border-indigo-500" />
                    </div>
                    <button className="w-full mt-4 py-3.5 bg-[#4F46E5] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all">Update Password</button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white border border-[#E2E4E9] rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <SectionHeading icon={Smartphone}>Two-Factor Authentication</SectionHeading>
                      <Toggle checked={false} onChange={() => {}} />
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">Add an extra layer of security to your account by requiring more than just a password to log in.</p>
                    <div className="p-6 bg-[#FAFBFC] border border-dashed border-[#E2E4E9] rounded-2xl flex flex-col items-center justify-center gap-4">
                      <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-sm opacity-50 flex items-center justify-center">
                        <AtSign className="w-12 h-12 text-neutral-200" />
                      </div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">QR Code Placeholder</p>
                    </div>
                  </div>

                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-8 space-y-6">
                    <SectionHeading icon={AlertTriangle}>Danger Zone</SectionHeading>
                    <p className="text-xs text-red-600/60 leading-relaxed font-medium">Permanently delete your account and all associated data. This action is not reversible.</p>
                    <button className="w-full py-3.5 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all">Delete Account</button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E2E4E9] rounded-2xl p-8 shadow-sm space-y-6">
                <SectionHeading icon={History}>Active Sessions</SectionHeading>
                <div className="space-y-4">
                  {[
                    { device: "MacBook Pro · Chrome", loc: "New Delhi, India", status: "Current Session", date: "Online Now" },
                    { device: "iPhone 15 Pro · Safari", loc: "Mumbai, India", status: "Active", date: "Yesterday, 14:20" }
                  ].map((s, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${i === 0 ? 'bg-indigo-50/50 border-indigo-100' : 'bg-[#FAFBFC] border-[#E2E4E9]'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-neutral-400 border border-[#E2E4E9]'}`}>
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111318]">{s.device}</p>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{s.loc} · {s.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {i === 0 && <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest px-2 py-0.5 bg-white rounded-full border border-indigo-100 shadow-sm">Current</span>}
                        <button className="text-[10px] font-black text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest">Revoke</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Profile updated successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
