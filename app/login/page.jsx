"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  ArrowUpRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar,
  BarChart3,
  Star,
  ShieldCheck,
  Globe,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDeviceRegister, useLogin, useRegister } from "@/hooks";

const HEADING = { fontFamily: "'Space Grotesk', sans-serif" };

const inputBase =
  "w-full h-[46px] xl:h-[50px] bg-white/[0.03] border rounded-xl pl-10 pr-4 outline-none transition-all duration-500 text-sm text-white font-medium placeholder:text-white/25 focus:bg-white/[0.05] focus:ring-[3px] focus:ring-indigo-500/15";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState(0);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { registerDevice, isLoading: isDeviceLoading } = useDeviceRegister();
  const { login, isLoading: isLoginLoading, error: loginError } = useLogin();
  const { register, isLoading: isRegisterLoading, error: registerError } = useRegister();

  const isLoading = isLoginLoading || isRegisterLoading;

  // ── Device Registration on Mount ──────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    // Register device to get bearer token for login/register
    registerDevice();
  }, [registerDevice]);

  // ── Password Strength Calculation ─────────────────────────────────────────
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength++;
      if (/[A-Z]/.test(formData.password)) strength++;
      if (/[0-9]/.test(formData.password)) strength++;
      if (/[^A-Za-z0-9]/.test(formData.password)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  // ── Form Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (isSignUp) {
        // ── Sign Up Flow ──
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        // Step 1: Register the user via backend API
        const registeredUser = await register({
          firstName: formData.name.split(" ")[0],
          lastName: formData.name.split(" ").slice(1).join(" ") || "User",
          email: formData.email,
          password: formData.password,
        });

        if (!registeredUser) {
          setError(registerError || "Registration failed");
          return;
        }

        setSuccess("Account created! Signing you in...");

        // Step 2: Auto-login after registration
        const loginResult = await login({
          email: formData.email,
          password: formData.password,
        });

        if (loginResult) {
          router.push("/dashboard");
        } else {
          setError("Account created but auto-login failed. Please sign in manually.");
          setIsSignUp(false);
        }
      } else {
        // ── Sign In Flow ──
        // Call login API with bearer token (handled by interceptor)
        const result = await login({
          email: formData.email,
          password: formData.password,
        });

        if (result) {
          router.push("/dashboard");
        } else {
          setError(loginError || "Invalid email or password");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const getStrengthColor = (index) => {
    if (index >= passwordStrength) return "bg-white/10";
    if (passwordStrength === 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-orange-500";
    if (passwordStrength === 3) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  if (!mounted) return null;

  return (
    <div
      className="relative flex h-screen w-full overflow-hidden bg-[#050505] text-white"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Left Panel — Brand */}
      <div className="relative hidden shrink-0 flex-col justify-between overflow-hidden p-10 md:flex md:w-[45%] xl:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-indigo-500/20 blur-[140px]" />
          <div className="absolute -bottom-32 -right-32 h-[26rem] w-[26rem] rounded-full bg-violet-500/15 blur-[140px]" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="relative z-10 w-full">
          {/* Logo */}
          <div className="mb-12 flex items-center gap-2.5 xl:mb-16">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-neutral-900 ring-1 ring-white/10">
              <img src="/logo.png" alt="CreatorCMS Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-[17px] font-semibold tracking-tight" style={HEADING}>
              CreatorCMS
            </span>
          </div>

          {/* Hero Text */}
          <div className="mb-10 xl:mb-12">
            <h1
              className="mb-3 text-[34px] font-medium leading-[1.05] tracking-tight xl:text-[40px]"
              style={HEADING}
            >
              The operating system
              <span className="block bg-gradient-to-br from-indigo-300 via-white to-violet-200 bg-clip-text text-transparent">
                for content creators.
              </span>
            </h1>
            <p className="text-[14px] font-medium text-white/45 xl:text-[15px]">
              Plan, create, schedule, and grow — all in one place.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3 xl:space-y-3.5">
            {[
              { icon: Zap, title: "AI Script Writer", desc: "Craft viral scripts in seconds" },
              { icon: Calendar, title: "Smart Scheduling", desc: "Post at the perfect time, automatically" },
              { icon: BarChart3, title: "Deep Analytics", desc: "Track growth across every platform" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                  <f.icon className="h-4 w-4 text-indigo-300" strokeWidth={1.25} />
                </div>
                <div>
                  <h3 className="text-[14px] font-medium leading-tight text-white/90 xl:text-[15px]">
                    {f.title}
                  </h3>
                  <p className="text-[12px] text-white/40 xl:text-[13px]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="relative z-10 pt-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-emerald-500"].map(
                (color, i) => (
                  <div
                    key={i}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#050505] text-[9px] font-bold text-white ${color}`}
                  >
                    {["AR", "JS", "ML", "KB", "TP"][i]}
                  </div>
                )
              )}
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#050505] bg-white/10 text-[9px] font-bold text-white/60">
                +12k
              </div>
            </div>
            <div className="flex flex-col">
              <div className="mb-0.5 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" strokeWidth={1} />
                ))}
              </div>
              <p className="text-[11px] font-medium text-white/60">Trusted by 50,000+ creators</p>
            </div>
          </div>

          <div className="mb-3.5 h-px w-full bg-white/[0.06]" />

          <div className="flex gap-2.5">
            {[
              { icon: ShieldCheck, label: "SECURE" },
              { icon: Globe, label: "WORLDWIDE" },
              { icon: LayoutDashboard, label: "ANALYTICS" },
            ].map((badge, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white/30"
              >
                <badge.icon className="h-3 w-3" strokeWidth={1.25} /> {badge.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thin Gradient Divider */}
      <div
        className="hidden h-screen w-px shrink-0 md:block"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(99,102,241,0.25) 30%, rgba(139,92,246,0.25) 70%, transparent)",
        }}
      />

      {/* Right Panel — Form */}
      <div className="relative z-10 flex h-screen flex-1 shrink-0 items-center justify-center p-6 md:p-8 xl:p-14">
        <div className="pointer-events-none absolute inset-0 md:hidden">
          <div className="absolute -top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[130px]" />
        </div>

        <div className="relative w-full max-w-[400px] rounded-[2rem] bg-white/[0.03] p-1.5 ring-1 ring-white/[0.06] md:bg-transparent md:p-0 md:ring-0">
          <div className="flex flex-col rounded-[calc(2rem-0.375rem)] bg-[#0A0A10] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ring-1 ring-white/[0.04] md:rounded-[2rem] md:bg-white/[0.02] md:p-8 md:ring-1 md:ring-white/[0.06] md:backdrop-blur-2xl">
            {/* Header */}
            <div className="mb-6 text-center md:text-left">
              <h2 className="mb-1 text-[24px] font-medium leading-tight tracking-tight xl:text-[26px]" style={HEADING}>
                Welcome back
              </h2>
              <p className="text-[13px] font-medium text-white/45 xl:text-sm">
                Sign in to your CreatorCMS account
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="relative mb-6 flex rounded-full border border-white/10 bg-white/[0.03] p-1">
              <button
                onClick={() => setIsSignUp(false)}
                className={`relative z-10 flex-1 py-1.5 text-xs font-semibold transition-colors duration-500 xl:text-sm ${
                  !isSignUp ? "text-black" : "text-white/50"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`relative z-10 flex-1 py-1.5 text-xs font-semibold transition-colors duration-500 xl:text-sm ${
                  isSignUp ? "text-black" : "text-white/50"
                }`}
              >
                Sign Up
              </button>
              <motion.div
                className="absolute bottom-1 left-1 top-1 z-0 w-[calc(50%-4px)] rounded-full bg-white"
                animate={{ x: isSignUp ? "100%" : "0%" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            </div>

            {/* Error / Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-3"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-red-300">{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-3"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-emerald-300">{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-3.5 xl:space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? "signup" : "signin"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="space-y-3.5 xl:space-y-4"
                >
                  {isSignUp && (
                    <div className="space-y-1">
                      <label className="ml-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                        Full name
                      </label>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                          strokeWidth={1.25}
                        />
                        <input
                          type="text"
                          name="name"
                          required={isSignUp}
                          value={formData.name}
                          onChange={handleChange}
                          className={inputBase}
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="ml-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                        strokeWidth={1.25}
                      />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={`${inputBase} ${error && !isSignUp ? "border-red-400/50" : "border-white/10"}`}
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <div className="relative space-y-1">
                    <div className="mb-0.5 flex items-center justify-between px-0.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                        Password
                      </label>
                      {!isSignUp && (
                        <button
                          type="button"
                          className="text-[11px] font-bold text-indigo-300 transition-colors hover:text-indigo-200"
                        >
                          FORGOT?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                        strokeWidth={1.25}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className={`${inputBase} pr-11 ${error && !isSignUp ? "border-red-400/50" : "border-white/10"}`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 transition-colors hover:text-white/60"
                      >
                        {showPassword ? (
                          <EyeOff size={16} strokeWidth={1.25} />
                        ) : (
                          <Eye size={16} strokeWidth={1.25} />
                        )}
                      </button>
                    </div>

                    {isSignUp && formData.password && (
                      <div className="flex gap-1 px-0.5 pt-1.5">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-500 ${getStrengthColor(i)}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {isSignUp && (
                    <div className="space-y-1">
                      <label className="ml-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                        Confirm password
                      </label>
                      <div className="relative">
                        <Lock
                          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                          strokeWidth={1.25}
                        />
                        <input
                          type="password"
                          name="confirmPassword"
                          required={isSignUp}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={inputBase}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isDeviceLoading}
                className="group mt-4 flex h-[48px] w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-bold text-black transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 xl:h-[52px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                    <span>{isSignUp ? "Creating..." : "Signing in..."}</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px]">
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[13px] font-medium text-white/45 transition-colors hover:text-white/80"
              >
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <span className="ml-1 text-indigo-300">Sign up free</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
