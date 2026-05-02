"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
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

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Something went wrong");
          setIsLoading(false);
          return;
        }

        setSuccess("Account created! Signing you in...");
        
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result.error) {
          setError(result.error);
          setIsLoading(false);
        } else {
          router.push("/dashboard");
        }
      } else {
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result.error) {
          setError(result.error === "CredentialsSignin" ? "Invalid email or password" : result.error);
          setIsLoading(false);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
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
              disabled={isLoading}
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

          {/* Divider */}
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-[#E5E7EB]"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">Or</span>
            <div className="flex-grow border-t border-[#E5E7EB]"></div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3.5">
            <button 
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="h-[44px] xl:h-[48px] flex items-center justify-center gap-2 bg-white text-[#374151] rounded-lg hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all font-semibold border border-[#E5E7EB] text-xs shadow-sm"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button 
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="h-[44px] xl:h-[48px] flex items-center justify-center gap-2 bg-[#24292E] text-white rounded-lg hover:bg-[#1A1E22] transition-all font-semibold border border-[#24292E] text-xs shadow-sm"
            >
              <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              GitHub
            </button>
          </div>

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
