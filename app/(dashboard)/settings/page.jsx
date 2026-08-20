"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ThemePicker from "@/app/components/ThemePicker";
import { Paintbrush } from "lucide-react";
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
  ChevronRight,
  AlertTriangle,
  MoreVertical,
  Upload,
  FileText,
  RotateCcw,
  AlertCircle,
  Loader2
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
import { useAuth } from "@/hooks";
import { format } from "date-fns";
import httpClient, { TokenStorage } from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

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

const VALID_TABS = ["profile", "accounts", "notifications", "billing", "security"];

// ---------- Components ----------

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'toggle-checked' : 'bg-[#E2E4E9]'}`}
    >
      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function SectionHeading({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 border-bottom border-[#F4F5F8] pb-3 mb-5">
      {Icon && <Icon className="w-4 h-4 text-[#4B5264]" strokeWidth={1.5} />}
      <h4 className="text-base font-semibold text-[#0A0A0F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{children}</h4>
    </div>
  );
}

// ==========================================================
//  SETTINGS PAGE
// ==========================================================

function SettingsPageContent() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTabState] = useState(
    VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "profile"
  );

  // Keep the tab in sync with the URL — covers direct links (/settings?tab=security)
  // and browser back/forward, which only change searchParams, not component state.
  useEffect(() => {
    const tab = searchParams.get("tab");
    setActiveTabState(VALID_TABS.includes(tab) ? tab : "profile");
  }, [searchParams]);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const [showToast, setShowToast] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef(null);

  // Dynamic platform connection states
  const [toastMessage, setToastMessage] = useState("Profile updated successfully");
  const [toastType, setToastType] = useState("success");
  const [youtubeStatus, setYoutubeStatus] = useState({ connected: false });
  const [loadingYouTube, setLoadingYouTube] = useState(true);
  const [instagramStatus, setInstagramStatus] = useState({ connected: false });
  const [loadingInstagram, setLoadingInstagram] = useState(true);
  const [cookiesStatus, setCookiesStatus] = useState({ configured: false, updatedAt: null });
  const [isSavingCookies, setIsSavingCookies] = useState(false);
  const [cookiesError, setCookiesError] = useState("");
  const cookiesFileRef = useRef(null);

  const fetchYouTubeStatus = async () => {
    try {
      setLoadingYouTube(true);
      const res = await httpClient.get('/publish/youtube/status');
      if (res.success) setYoutubeStatus(res.data);
    } catch (err) {
      console.error("Failed to load YouTube status", err);
    } finally {
      setLoadingYouTube(false);
    }
  };

  const fetchInstagramStatus = async () => {
    try {
      setLoadingInstagram(true);
      const res = await httpClient.get('/publish/instagram/status');
      if (res.success) setInstagramStatus(res.data);
    } catch (err) {
      console.error("Failed to load Instagram status", err);
    } finally {
      setLoadingInstagram(false);
    }
  };

  const fetchCookiesStatus = async () => {
    try {
      const res = await httpClient.get('/publish/youtube/cookies/status');
      if (res.success) setCookiesStatus(res.data);
    } catch (err) {
      console.error("Failed to load cookies status", err);
    }
  };

  useEffect(() => {
    fetchYouTubeStatus();
    fetchInstagramStatus();
    fetchCookiesStatus();
  }, []);

  const handleCookiesFileSelect = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      setCookiesError("Please upload the cookies.txt file exported by your browser extension.");
      return;
    }
    setIsSavingCookies(true);
    setCookiesError("");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await httpClient.post('/publish/youtube/cookies', { cookiesText: reader.result });
        if (res.success) {
          await fetchCookiesStatus();
        }
      } catch (err) {
        setCookiesError(err.message || "Failed to save cookies.");
      } finally {
        setIsSavingCookies(false);
      }
    };
    reader.onerror = () => {
      setCookiesError("Couldn't read that file. Try again.");
      setIsSavingCookies(false);
    };
    reader.readAsText(file);
  };

  const handleRemoveCookies = async () => {
    try {
      await httpClient.delete('/publish/youtube/cookies');
      setCookiesStatus({ configured: false, updatedAt: null });
    } catch (err) {
      setCookiesError(err.message || "Failed to remove cookies.");
    }
  };

  // Handle OAuth callback redirects redirecting back from backend
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const success = params.get("success");
      const error = params.get("error");

      if (success === "youtube_connected") {
        setToastMessage("YouTube Connected Successfully");
        setToastType("success");
        setShowToast(true);
        fetchYouTubeStatus();
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => setShowToast(false), 3000);
      } else if (success === "instagram_connected") {
        setToastMessage("Instagram Connected Successfully");
        setToastType("success");
        setShowToast(true);
        fetchInstagramStatus();
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => setShowToast(false), 3000);
      } else if (error) {
        const msg = error.replace(/_/g, ' ');
        setToastMessage(`Connection Failed: ${msg}`);
        setToastType("error");
        setShowToast(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => setShowToast(false), 4000);
      }
    }
  }, []);

  const handleConnectYouTube = async () => {
    try {
      const res = await httpClient.get('/publish/youtube/connect');
      if (res.success && res.data.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        setToastMessage("Failed to get YouTube authorization link");
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      setToastMessage(err.message || "Failed to initiate YouTube connection");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDisconnectYouTube = async () => {
    try {
      const res = await httpClient.post('/publish/youtube/disconnect');
      if (res.success) {
        setToastMessage("YouTube channel disconnected");
        setToastType("success");
        setShowToast(true);
        setYoutubeStatus({ connected: false });
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      setToastMessage(err.message || "Failed to disconnect YouTube");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleConnectInstagram = async () => {
    try {
      const res = await httpClient.get('/publish/instagram/connect');
      if (res.success && res.data.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        setToastMessage("Failed to get Instagram authorization link");
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      setToastMessage(err.message || "Failed to initiate Instagram connection");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      const res = await httpClient.post('/publish/instagram/disconnect');
      if (res.success) {
        setToastMessage("Instagram disconnected");
        setToastType("success");
        setShowToast(true);
        setInstagramStatus({ connected: false });
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      setToastMessage(err.message || "Failed to disconnect Instagram");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleUnsupportedConnect = (platformName) => {
    setToastMessage(`${platformName} integration is coming soon!`);
    setToastType("success");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Form State — starts empty/from cached auth data, then hydrated with the
  // real saved profile once GET /user/profile resolves (see effect below).
  const [profileData, setProfileData] = useState(() => ({
    name: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    username: "",
    email: user?.email || "",
    bio: "",
    niche: NICHES[0],
    location: "",
    banner: BANNER_GRADIENTS[0],
    website: "",
    youtube: "",
    instagram: "",
    tiktok: "",
    twitter: "",
    avatar: null
  }));

  const [profileLoading, setProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  // Notification preferences — hydrated from GET /user/profile, saved individually
  // per-toggle via PUT /user/notifications (optimistic, reverted on failure).
  const [notifPrefs, setNotifPrefs] = useState({
    weeklyReport: true,
    subscriberMilestone: true,
    schedulerReminders: true,
    aiInsightAlerts: true,
    episodeDueReminders: true,
    roadmapDeadlineAlerts: true,
    teamMentions: false,
  });
  const [savingNotifKey, setSavingNotifKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await httpClient.get(ENDPOINTS.USER.PROFILE);
        if (cancelled || !res.data) return;
        const p = res.data;
        setProfileData({
          name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
          username: p.username || "",
          email: p.email || "",
          bio: p.bio || "",
          niche: p.niche || NICHES[0],
          location: p.location || "",
          banner: BANNER_GRADIENTS[p.bannerIndex ?? 0] || BANNER_GRADIENTS[0],
          website: p.website || "",
          youtube: p.socialLinks?.youtube || "",
          instagram: p.socialLinks?.instagram || "",
          tiktok: p.socialLinks?.tiktok || "",
          twitter: p.socialLinks?.twitter || "",
          avatar: p.avatar || null,
        });
        if (p.notificationPreferences) {
          setNotifPrefs(prev => ({ ...prev, ...p.notificationPreferences }));
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleToggleNotification = async (key) => {
    const nextValue = !notifPrefs[key];
    setNotifPrefs(prev => ({ ...prev, [key]: nextValue }));
    setSavingNotifKey(key);
    try {
      await httpClient.put(ENDPOINTS.USER.NOTIFICATIONS, { [key]: nextValue });
    } catch (err) {
      // Revert on failure
      setNotifPrefs(prev => ({ ...prev, [key]: !nextValue }));
      setToastMessage(err.message || "Failed to update notification preference");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSavingNotifKey(null);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (field === "username") setUsernameError("");
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("thumbnail", file);
      const res = await httpClient.post(ENDPOINTS.UPLOAD.THUMBNAIL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.success && res.data?.url) {
        handleProfileChange("avatar", res.data.url);
      }
    } catch (err) {
      setToastMessage(err.message || "Avatar upload failed");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (isSavingProfile) return;
    setIsSavingProfile(true);
    setUsernameError("");
    try {
      const [firstName, ...rest] = profileData.name.trim().split(/\s+/);
      const lastName = rest.join(" ");
      const bannerIndex = Math.max(0, BANNER_GRADIENTS.indexOf(profileData.banner));

      const res = await httpClient.put(ENDPOINTS.USER.PROFILE, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        username: profileData.username || undefined,
        bio: profileData.bio,
        niche: profileData.niche,
        location: profileData.location,
        website: profileData.website,
        avatar: profileData.avatar || "",
        bannerIndex,
        socialLinks: {
          youtube: profileData.youtube,
          instagram: profileData.instagram,
          tiktok: profileData.tiktok,
          twitter: profileData.twitter,
        },
      });

      // Sync the locally-cached user so the rest of the app (which reads the
      // same localStorage-backed useAuth()) reflects the change immediately.
      const cached = TokenStorage.getUserData() || {};
      TokenStorage.setUserData({
        ...cached,
        firstName: res.data?.firstName ?? cached.firstName,
        lastName: res.data?.lastName ?? cached.lastName,
      });
      refreshUser();

      setToastMessage("Profile updated successfully");
      setToastType("success");
      setShowToast(true);
      setIsDirty(false);
    } catch (err) {
      setToastMessage(err.message || "Failed to save profile");
      setToastType("error");
      setShowToast(true);
      if (/username/i.test(err.message || "")) setUsernameError(err.message);
    } finally {
      setIsSavingProfile(false);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Security tab — change password
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    const p = passwordForm.next;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }, [passwordForm.next]);

  const handlePasswordFormChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    setPasswordError("");
  };

  const handleUpdatePassword = async () => {
    if (isSavingPassword) return;
    if (!passwordForm.current || !passwordForm.next) {
      setPasswordError("Fill in both password fields.");
      return;
    }
    if (passwordForm.next.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError("New passwords don't match.");
      return;
    }
    setIsSavingPassword(true);
    try {
      await httpClient.put(ENDPOINTS.USER.PASSWORD, {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
      });
      setPasswordForm({ current: "", next: "", confirm: "" });
      setToastMessage("Password updated successfully");
      setToastType("success");
      setShowToast(true);
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Security tab — delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm.");
      return;
    }
    setIsDeletingAccount(true);
    try {
      await httpClient.delete(ENDPOINTS.USER.DELETE_ACCOUNT, { data: { password: deletePassword } });
      logout();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete account");
      setIsDeletingAccount(false);
    }
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
          <h2 className="text-3xl font-medium text-[#0F0F0F] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Settings</h2>
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
            className={`pb-4 text-sm font-semibold transition-colors duration-300 relative ${activeTab === tab.id ? "text-[#4F46E5]" : "text-neutral-500 hover:text-neutral-700"}`}
          >
            <div className="flex items-center gap-2 px-1">
              <tab.icon className="w-4 h-4" strokeWidth={1.5} />
              <span>{tab.name}</span>
            </div>
            {activeTab === tab.id && (
              <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: "var(--t-primary)" }} />
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
              <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] p-8 shadow-sm space-y-10">
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
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isUploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                          {isUploadingAvatar ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <Camera className="w-6 h-6 text-white" />
                          )}
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
                        onChange={(e) => handleProfileChange("username", e.target.value.toLowerCase())}
                        placeholder="yourusername"
                        className={`w-full h-12 bg-[#F9FAFB] border rounded-xl pl-10 pr-4 text-sm font-bold outline-none transition-all ${usernameError ? "border-red-400" : "border-[#E2E4E9] focus:border-indigo-500"}`}
                      />
                    </div>
                    {usernameError && (
                      <p className="text-[11px] font-semibold text-red-500 ml-1">{usernameError}</p>
                    )}
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

                {/* Appearance — Theme */}
                <div className="pt-6 border-t border-[#F4F5F8]">
                  <SectionHeading icon={Paintbrush}>Appearance</SectionHeading>
                  <p className="text-[13px] text-neutral-400 mb-5">Choose a colour theme for the entire app. Your selection is saved instantly.</p>
                  <ThemePicker />
                </div>

                {/* Footer Action */}
                <div className="pt-8 border-t border-[#F4F5F8] flex items-center justify-between">
                  <p className="text-[10px] font-bold text-neutral-400 italic">
                    {profileLoading ? "Loading your profile..." : "Changes are saved to your account."}
                  </p>
                  <button
                    onClick={handleSave}
                    disabled={isSavingProfile || profileLoading}
                    className="flex items-center gap-2 px-10 py-3.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-full text-sm font-black uppercase tracking-widest shadow-[0_4px_16px_-4px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSavingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Live Preview */}
              <aside className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">
                  <Eye className="w-3.5 h-3.5" />
                  Profile Preview
                </div>
                <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] overflow-hidden shadow-sm sticky top-24 transition-all hover:shadow-xl hover:-translate-y-1 duration-500 group">
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
                  {
                    name: "YouTube",
                    icon: FaYoutube,
                    color: "text-red-600",
                    connected: youtubeStatus.connected,
                    handle: youtubeStatus.handle || youtubeStatus.channelName || "",
                    followers: youtubeStatus.subscribers !== undefined ? (youtubeStatus.subscribers >= 1000 ? `${(youtubeStatus.subscribers / 1000).toFixed(1)}K` : youtubeStatus.subscribers.toString()) : "0",
                    lastSync: youtubeStatus.lastSync ? format(new Date(youtubeStatus.lastSync), "PP") : "Never",
                    onConnect: handleConnectYouTube,
                    onDisconnect: handleDisconnectYouTube
                  },
                  {
                    name: "YT Shorts",
                    icon: FaYoutube,
                    color: "text-red-500",
                    connected: youtubeStatus.connected,
                    handle: youtubeStatus.connected ? `Via ${youtubeStatus.channelName || "YouTube"}` : "",
                    followers: youtubeStatus.subscribers !== undefined ? (youtubeStatus.subscribers >= 1000 ? `${(youtubeStatus.subscribers / 1000).toFixed(1)}K` : youtubeStatus.subscribers.toString()) : "0",
                    lastSync: youtubeStatus.lastSync ? format(new Date(youtubeStatus.lastSync), "PP") : "Never",
                    note: "Uses your YouTube connection",
                    onConnect: handleConnectYouTube,
                    onDisconnect: handleDisconnectYouTube
                  },
                  { name: "Twitter/X", icon: FaTwitter, color: "text-[#0F0F0F]", connected: false, onConnect: () => handleUnsupportedConnect("Twitter/X") },
                  { name: "TikTok", icon: FaMusic, color: "text-[#000000]", connected: false, onConnect: () => handleUnsupportedConnect("TikTok") },
                  {
                    name: "Instagram",
                    icon: FaInstagram,
                    color: "text-pink-600",
                    connected: instagramStatus.connected,
                    handle: instagramStatus.handle || instagramStatus.accountName || "",
                    followers: instagramStatus.followers !== undefined ? (instagramStatus.followers >= 1000 ? `${(instagramStatus.followers / 1000).toFixed(1)}K` : instagramStatus.followers.toString()) : "0",
                    lastSync: instagramStatus.lastSync ? format(new Date(instagramStatus.lastSync), "PP") : "Never",
                    onConnect: handleConnectInstagram,
                    onDisconnect: handleDisconnectInstagram
                  },
                  { name: "LinkedIn", icon: FaLinkedin, color: "text-blue-700", connected: false, onConnect: () => handleUnsupportedConnect("LinkedIn") }
                ].map((acc) => (
                  <div key={acc.name} className="bg-white border border-[#E2E4E9] rounded-[1.75rem] p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center ${acc.color}`}>
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
                        <button 
                          onClick={acc.onConnect}
                          className="text-[10px] font-black text-indigo-600 border border-indigo-200 px-4 py-1.5 rounded-full hover:bg-indigo-50 transition-all uppercase tracking-widest"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                    {acc.note && (
                      <p className="text-[10px] text-neutral-400 -mt-3 mb-1">{acc.note}</p>
                    )}
                    {acc.connected && (
                      <div className="flex justify-between items-center pt-4 border-t border-[#F4F5F8]">
                        <div className="flex gap-4">
                          <div className="text-[10px] font-bold text-neutral-400">
                            <span className="block text-neutral-900 font-black">{acc.followers}</span> Subscribers
                          </div>
                          <div className="text-[10px] font-bold text-neutral-400">
                            <span className="block text-neutral-900 font-black">{acc.lastSync}</span> Sync
                          </div>
                        </div>
                        <button
                          onClick={acc.onDisconnect}
                          className="text-[10px] font-black text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                        >
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <SectionHeading icon={FileText}>Clip Download Quality</SectionHeading>
                <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div className="max-w-lg">
                      <p className="text-sm font-bold text-[#111318] mb-1.5">YouTube cookies for higher-quality downloads</p>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Without this, clips pulled from source YouTube videos are capped around 360p due to YouTube's
                        anti-bot restrictions. Uploading a <code className="px-1 py-0.5 bg-neutral-100 rounded text-[11px]">cookies.txt</code> file
                        (exported from a logged-in browser session using a free extension like "Get cookies.txt LOCALLY")
                        lets your downloads authenticate like a real browser and unlock 720p/1080p. This only affects
                        your own account's downloads — nobody else is impacted.
                      </p>
                    </div>

                    {cookiesStatus.configured ? (
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                          <Check className="w-3 h-3" /> Configured
                        </span>
                        <button
                          onClick={handleRemoveCookies}
                          className="text-[10px] font-black text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="shrink-0">
                        <input
                          ref={cookiesFileRef}
                          type="file"
                          accept=".txt"
                          className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) handleCookiesFileSelect(e.target.files[0]); e.target.value = ""; }}
                        />
                        <button
                          onClick={() => cookiesFileRef.current?.click()}
                          disabled={isSavingCookies}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-100 transition disabled:opacity-50"
                        >
                          {isSavingCookies ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          {isSavingCookies ? "Saving…" : "Upload cookies.txt"}
                        </button>
                      </div>
                    )}
                  </div>

                  {cookiesStatus.configured && cookiesStatus.updatedAt && (
                    <p className="text-[10px] text-neutral-400 mt-4">
                      Last updated {format(new Date(cookiesStatus.updatedAt), "PP")}
                    </p>
                  )}
                  {cookiesError && (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-600 font-semibold mt-4">
                      <AlertCircle className="w-3.5 h-3.5" /> {cookiesError}
                    </p>
                  )}
                </div>
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
              <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] p-8 shadow-sm space-y-8">
                <div>
                  <SectionHeading icon={Mail}>Email Notifications</SectionHeading>
                  <div className="space-y-6">
                    {[
                      { id: "weeklyReport", label: "Weekly performance report", desc: "Get a summary of your stats every Monday." },
                      { id: "subscriberMilestone", label: "New subscriber milestone", desc: "Notification when you reach subscriber goals." },
                      { id: "schedulerReminders", label: "Content scheduled reminders", desc: "Alerts for upcoming scheduled posts." },
                      { id: "aiInsightAlerts", label: "AI insight alerts", desc: "Get notified when AI finds new growth opportunities." }
                    ].map((row) => (
                      <div key={row.id} className="flex items-center justify-between group">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#111318] group-hover:text-indigo-600 transition-colors">{row.label}</p>
                          <p className="text-xs text-neutral-400">{row.desc}</p>
                        </div>
                        <Toggle
                          checked={notifPrefs[row.id]}
                          onChange={() => handleToggleNotification(row.id)}
                          disabled={savingNotifKey === row.id}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-[#F4F5F8]">
                  <SectionHeading icon={Smartphone}>In-App Notifications</SectionHeading>
                  <div className="space-y-6">
                    {[
                      { id: "episodeDueReminders", label: "Series episode due reminders", desc: "Desktop notification 1h before deadline." },
                      { id: "roadmapDeadlineAlerts", label: "Roadmap deadline alerts", desc: "Alerts when projects are overdue." },
                      { id: "teamMentions", label: "Team mentions", desc: "Notify when a collaborator tags you." }
                    ].map((row) => (
                      <div key={row.id} className="flex items-center justify-between group">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#111318] group-hover:text-indigo-600 transition-colors">{row.label}</p>
                          <p className="text-xs text-neutral-400">{row.desc}</p>
                        </div>
                        <Toggle
                          checked={notifPrefs[row.id]}
                          onChange={() => handleToggleNotification(row.id)}
                          disabled={savingNotifKey === row.id}
                        />
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
                <div className="col-span-2 bg-white border border-[#E2E4E9] rounded-[1.75rem] p-8 shadow-sm flex flex-col md:flex-row justify-between gap-8">
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
                
                <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] p-8 shadow-sm space-y-6">
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

              <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] p-8 shadow-sm space-y-6">
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
                <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] p-8 shadow-sm space-y-6">
                  <SectionHeading icon={Lock}>Change Password</SectionHeading>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Current Password</p>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.current}
                        onChange={(e) => handlePasswordFormChange("current", e.target.value)}
                        className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-4 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">New Password</p>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.next}
                        onChange={(e) => handlePasswordFormChange("next", e.target.value)}
                        className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-4 text-sm outline-none focus:border-indigo-500"
                      />
                      {passwordForm.next && (
                        <>
                          <div className="h-1 w-full bg-[#F4F5F8] rounded-full mt-2 overflow-hidden flex gap-1">
                            {[0, 1, 2].map(i => (
                              <div key={i} className={`h-full flex-1 rounded-full ${i < passwordStrength ? (passwordStrength === 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-neutral-200'}`} />
                            ))}
                          </div>
                          <p className={`text-[9px] font-bold uppercase ${passwordStrength === 1 ? 'text-red-500' : passwordStrength === 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            Strength: {passwordStrength === 1 ? 'Weak' : passwordStrength === 2 ? 'Fair' : 'Strong'}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Confirm New Password</p>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.confirm}
                        onChange={(e) => handlePasswordFormChange("confirm", e.target.value)}
                        className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-4 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    {passwordError && (
                      <p className="flex items-center gap-1.5 text-[11px] text-red-600 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> {passwordError}
                      </p>
                    )}
                    <button
                      onClick={handleUpdatePassword}
                      disabled={isSavingPassword}
                      className="w-full mt-4 py-3.5 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all btn-primary disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {isSavingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {isSavingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] p-8 shadow-sm space-y-6">
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
                    <button
                      onClick={() => { setShowDeleteModal(true); setDeletePassword(""); setDeleteError(""); }}
                      className="w-full py-3.5 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] p-8 shadow-sm space-y-6">
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

      {/* ── DELETE ACCOUNT MODAL ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
            onClick={() => !isDeletingAccount && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[1.75rem] p-8 w-full max-w-md shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-black text-[#0F0F0F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Delete your account?</h3>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                This permanently deactivates your account. Enter your password to confirm — this action cannot be undone.
              </p>
              <div className="space-y-2">
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleDeleteAccount()}
                  className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-4 text-sm outline-none focus:border-red-400"
                />
                {deleteError && (
                  <p className="flex items-center gap-1.5 text-[11px] text-red-600 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" /> {deleteError}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeletingAccount}
                  className="flex-1 py-3 rounded-xl border border-[#E2E4E9] text-sm font-bold text-neutral-500 hover:bg-neutral-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isDeletingAccount ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 text-white rounded-2xl shadow-2xl flex items-center gap-3 ${toastType === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              {toastType === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </div>
            <span className="text-sm font-black uppercase tracking-widest">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}
