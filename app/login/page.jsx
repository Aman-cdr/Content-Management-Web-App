"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
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
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDeviceRegister, useLogin, useRegister } from "@/hooks";

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
    confirmPassword: ""
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
          firstName: formData.name.split(' ')[0],
          lastName: formData.name.split(' ').slice(1).join(' ') || 'User',
          email: formData.email,
          password: formData.password
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
    return "bg-green-500";
  };

  if (!mounted) return null;

  return (
    <div className="h-screen w-full bg-[#080810] md:bg-white flex font-inter overflow-hidden">
      {/* Left Panel - Premium Dark Section */}
      <div className="hidden md:flex md:w-[45%] bg-[#080810] relative flex-col justify-between p-10 xl:p-14 overflow-hidden shrink-0">
        {/* Background Effects */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] pointer-events-none rounded-full" 
             style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] pointer-events-none rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }}></div>
        <div className="absolute inset-0 opacity-100 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-12 xl:mb-16">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-outfit">CreatorCMS</span>
          </div>

          {/* Hero Text */}
          <div className="mb-10 xl:mb-12">
            <h1 className="text-[36px] xl:text-[40px] font-extrabold leading-[1.1] tracking-tight mb-3 text-white font-outfit">
              The operating system<br />
              <span className="bg-gradient-to-r from-[#6366F1] to-[#A78BFA] bg-clip-text text-transparent">for content creators.</span>
            </h1>
            <p className="text-sm xl:text-base text-white/50 font-medium">Plan, create, schedule, and grow — all in one place.</p>
          </div>
          
          {/* Feature List */}
          <div className="space-y-3.5 xl:space-y-4">
            {[
              { icon: Zap, title: "AI Script Writer", desc: "Craft viral scripts in seconds" },
              { icon: Calendar, title: "Smart Scheduling", desc: "Post at the perfect time, automatically" },
              { icon: BarChart3, title: "Deep Analytics", desc: "Track growth across every platform" }
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3.5 group">
                <div className="w-9 h-9 bg-indigo-600/12 border border-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                  <f.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-[14px] xl:text-[15px] font-semibold text-white leading-tight">{f.title}</h3>
                  <p className="text-[12px] xl:text-[13px] text-white/40">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="relative z-10 pt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex -space-x-2">
              {['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-emerald-500'].map((color, i) => (
                <div key={i} className={`w-7 h-7 rounded-full border-2 border-[#080810] ${color} flex items-center justify-center text-[9px] font-bold text-white shadow-sm`}>
                  {['AR', 'JS', 'ML', 'KB', 'TP'][i]}
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-[#080810] bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60 shadow-sm">
                +12k
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex gap-0.5 mb-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />)}
              </div>
              <p className="text-[11px] font-semibold text-white/70">Trusted by 50,000+ creators</p>
            </div>
          </div>
          
          <div className="h-[1px] w-full bg-white/5 mb-3.5"></div>
          
          <div className="flex gap-3">
            {[
              { icon: ShieldCheck, label: "SECURE" },
              { icon: Globe, label: "WORLDWIDE" },
              { icon: LayoutDashboard, label: "ANALYTICS" }
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-1 px-2.5 py-1.2 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold text-white/25 tracking-widest uppercase shrink-0">
                <badge.icon className="w-3 h-3" /> {badge.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thin Gradient Divider */}
      <div className="hidden md:block w-[1px] h-screen shrink-0" style={{ background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.2) 30%, rgba(139,92,246,0.2) 70%, transparent)' }}></div>

      {/* Right Panel - Clean White Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 xl:p-14 bg-[#080810] md:bg-[#FAFAFA] h-screen relative z-10 shrink-0">
        <div className="w-full max-w-[400px] flex flex-col bg-white md:bg-transparent p-6 md:p-0 rounded-2xl shadow-xl md:shadow-none overflow-hidden">
          {/* Header */}
          <div className="mb-6 text-center md:text-left">
            <h2 className="text-[26px] xl:text-[28px] font-bold text-[#0A0A0F] mb-1 font-outfit leading-tight">Welcome back</h2>
            <p className="text-[#6B7280] text-[13px] xl:text-sm font-medium">Sign in to your CreatorCMS account</p>
          </div>

          {/* Toggle Tabs */}
          <div className="bg-[#F3F4F6] p-1 rounded-lg flex mb-6 relative">
            <button 
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-1.5 text-xs xl:text-sm font-semibold transition-all relative z-10 ${!isSignUp ? 'text-[#0A0A0F]' : 'text-[#6B7280]'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-1.5 text-xs xl:text-sm font-semibold transition-all relative z-10 ${isSignUp ? 'text-[#0A0A0F]' : 'text-[#6B7280]'}`}
            >
              Sign Up
            </button>
            <motion.div 
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm z-0"
              animate={{ x: isSignUp ? '100%' : '0%' }}
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
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-700 font-medium">{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-sm text-green-700 font-medium">{success}</span>
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
                    <label className="text-[12px] font-semibold text-[#374151] ml-0.5 uppercase tracking-wide">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-[16px] h-[16px]" />
                      <input 
                        type="text"
                        name="name"
                        required={isSignUp}
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full h-[46px] xl:h-[50px] bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 outline-none focus:border-[#6366F1] focus:ring-[3px] focus:ring-indigo-600/5 transition-all text-sm text-[#0A0A0F] font-medium placeholder:text-[#9CA3AF]"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#374151] ml-0.5 uppercase tracking-wide">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-[16px] h-[16px]" />
                    <input 
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full h-[46px] xl:h-[50px] bg-white border ${error && !isSignUp ? 'border-red-400' : 'border-[#E5E7EB]'} rounded-lg pl-10 pr-4 outline-none focus:border-[#6366F1] focus:ring-[3px] focus:ring-indigo-600/5 transition-all text-sm text-[#0A0A0F] font-medium placeholder:text-[#9CA3AF]`}
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div className="space-y-1 relative">
                  <div className="flex justify-between items-center mb-0.5 px-0.5">
                    <label className="text-[12px] font-semibold text-[#374151] uppercase tracking-wide">Password</label>
                    {!isSignUp && (
                      <button type="button" className="text-[11px] text-[#6366F1] font-bold hover:text-[#4F46E5] transition-colors">FORGOT?</button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-[16px] h-[16px]" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full h-[46px] xl:h-[50px] bg-white border ${error && !isSignUp ? 'border-red-400' : 'border-[#E5E7EB]'} rounded-lg pl-10 pr-11 outline-none focus:border-[#6366F1] focus:ring-[3px] focus:ring-indigo-600/5 transition-all text-sm text-[#0A0A0F] font-medium placeholder:text-[#9CA3AF]`}
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  {isSignUp && formData.password && (
                    <div className="flex gap-1 pt-1.5 px-0.5">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${getStrengthColor(i)}`}></div>
                      ))}
                    </div>
                  )}
                </div>

                {isSignUp && (
                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-[#374151] ml-0.5 uppercase tracking-wide">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-[16px] h-[16px]" />
                      <input 
                        type="password"
                        name="confirmPassword"
                        required={isSignUp}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full h-[46px] xl:h-[50px] bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 outline-none focus:border-[#6366F1] focus:ring-[3px] focus:ring-indigo-600/5 transition-all text-sm text-[#0A0A0F] font-medium placeholder:text-[#9CA3AF]"
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
              className="w-full h-[48px] xl:h-[52px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-[15px] shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_18px_rgba(99,102,241,0.4)] mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>{isSignUp ? "Creating..." : "Signing in..."}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[13px] font-bold text-[#6B7280] hover:text-[#0A0A0F] transition-colors"
            >
              {isSignUp ? "Already have an account?" : "Don't have an account?"} <span className="text-[#6366F1] ml-1">Sign up free</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
