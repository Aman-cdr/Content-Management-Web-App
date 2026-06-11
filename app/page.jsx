"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  BarChart3, 
  Calendar, 
  Layers, 
  Zap, 
  Play, 
  Check, 
  Image as ImageIcon, 
  Map, 
  Plug, 
  Rocket, 
  Menu, 
  X,
  Star
} from "lucide-react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");

  return (
    <div className="landing-page landing-theme min-h-screen selection:bg-indigo-500/30">
      
      {/* 1. Navbar */}
      <nav className="landing-navbar fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">CreatorCMS</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Pricing</Link>
            <Link href="#blog" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Blog</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="landing-btn-ghost text-sm">Sign In</Link>
            <Link href="/login" className="landing-btn-primary text-sm">Get Started →</Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#080810] border-b border-white/10 p-6 flex flex-col gap-4">
            <Link href="#features" onClick={() => setIsMenuOpen(false)}>Features</Link>
            <Link href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <Link href="#blog" onClick={() => setIsMenuOpen(false)}>Blog</Link>
            <hr className="border-white/10" />
            <Link href="/login" className="landing-btn-ghost text-center">Sign In</Link>
            <Link href="/login" className="landing-btn-primary text-center">Get Started</Link>
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden min-h-screen flex flex-col items-center justify-center text-center">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl pointer-events-none opacity-20"
             style={{ background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.5), transparent)" }}>
        </div>

        <div className="landing-badge mb-8 animate-fade-in">
          <span>✦</span> Trusted by 50,000+ creators
        </div>

        <h1 className="text-5xl md:text-[64px] font-bold leading-[1.1] tracking-tight max-w-4xl">
          Create Content Faster.<br />
          <span className="landing-gradient-text">Grow Your Audience.</span>
        </h1>

        <p className="mt-8 text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed">
          The all-in-one platform for content creators — AI scripts, smart scheduling, multi-platform publishing, and deep analytics.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-12">
          <Link href="/login" className="landing-btn-primary px-10 py-4 text-lg rounded-[10px] flex items-center justify-center gap-2">
            Start for Free <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="landing-btn-outline">
            View Demo
          </button>
        </div>

        <p className="mt-6 text-sm text-white/40">
          No credit card required · Free plan available · Setup in 2 minutes
        </p>
      </section>

      {/* 3. Stats Bar */}
      <section className="landing-stats-bar py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
          <div className="text-center md:border-r border-white/10 px-4">
            <div className="text-4xl font-bold mb-1">50,000+</div>
            <div className="text-sm text-white/50">Active Creators</div>
          </div>
          <div className="text-center md:border-r border-white/10 px-4">
            <div className="text-4xl font-bold mb-1">12M+</div>
            <div className="text-sm text-white/50">Posts Managed</div>
          </div>
          <div className="text-center md:border-r border-white/10 px-4">
            <div className="text-4xl font-bold mb-1">99%</div>
            <div className="text-sm text-white/50">Uptime SLA</div>
          </div>
          <div className="text-center px-4">
            <div className="text-4xl font-bold mb-1">4.9★</div>
            <div className="text-sm text-white/50">Average Rating</div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4 inline-block relative">
              Everything you need to grow
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6 text-white" />}
              title="Cross-Platform Analytics"
              desc="Compare YouTube, TikTok, and IG performance in one unified dashboard."
            />
            <FeatureCard 
              icon={<Calendar className="w-6 h-6 text-white" />}
              title="Smart Scheduling"
              desc="AI recommends the perfect time to post for maximum engagement."
            />
            <FeatureCard 
              icon={<Layers className="w-6 h-6 text-white" />}
              title="Series Planning"
              desc="Structure courses and long-form series with intelligent automation."
            />
            <FeatureCard 
              icon={<Sparkles className="w-6 h-6 text-white" />}
              title="AI Script Writer"
              desc="Generate high-converting scripts tailored to your unique voice and style."
            />
            <FeatureCard 
              icon={<ImageIcon className="w-6 h-6 text-white" />}
              title="Media Library"
              desc="Store and organize all your assets in one secure, accessible location."
            />
            <FeatureCard 
              icon={<Map className="w-6 h-6 text-white" />}
              title="Content Roadmap"
              desc="Visualize your growth strategy and upcoming content themes."
            />
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <Step 
              num="1"
              icon={<Plug className="w-6 h-6 text-white" />}
              title="Connect your platforms"
              desc="Link your YouTube, TikTok, and Instagram accounts in seconds."
            />
            <div className="hidden md:block landing-step-line"></div>
            <Step 
              num="2"
              icon={<Sparkles className="w-6 h-6 text-white" />}
              title="Create with AI assistance"
              desc="Draft scripts and plan episodes with our intelligent co-pilot."
            />
            <div className="hidden md:block landing-step-line"></div>
            <Step 
              num="3"
              icon={<Rocket className="w-6 h-6 text-white" />}
              title="Publish and grow"
              desc="Schedule posts and track your progress with real-time data."
            />
          </div>
        </div>
      </section>

      {/* 6. Testimonials Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold">Loved by creators worldwide</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="CreatorCMS completely changed how I manage my content. I went from 10K to 100K subscribers in 6 months."
              author="Sarah K."
              role="Tech Creator"
              subscribers="142K subscribers"
              color="bg-pink-500"
            />
            <TestimonialCard 
              quote="The AI script writer saves me 5 hours every week. It's like having a writing assistant that knows my voice."
              author="Marcus T."
              role="Educator"
              subscribers="89K subscribers"
              color="bg-blue-500"
            />
            <TestimonialCard 
              quote="Finally a tool that understands creators. The analytics alone are worth it."
              author="Priya M."
              role="Lifestyle Creator"
              subscribers="234K subscribers"
              color="bg-amber-500"
            />
          </div>
        </div>
      </section>

      {/* 7. Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-8">Simple, transparent pricing</h2>
            
            <div className="inline-flex items-center p-1 bg-white/5 rounded-full border border-white/10">
              <button 
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === "monthly" ? "bg-indigo-600 text-white" : "text-white/60"}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === "annual" ? "bg-indigo-600 text-white" : "text-white/60"}`}
              >
                Annual <span className="text-[10px] ml-1 bg-indigo-400/20 text-indigo-300 px-1.5 py-0.5 rounded">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="landing-pricing-card">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-white/40 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-10 flex-grow">
                <PricingFeature text="3 platforms" />
                <PricingFeature text="10 posts/month" />
                <PricingFeature text="Basic analytics" />
              </ul>
              <Link href="/login" className="landing-btn-outline text-center">Get Started</Link>
            </div>

            {/* Pro */}
            <div className="landing-pricing-card popular relative">
              <div className="absolute -top-4 right-6 bg-indigo-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</div>
              <h3 className="text-xl font-bold mb-2">Creator Pro ⭐</h3>
              <div className="text-4xl font-bold mb-6">${billingCycle === "monthly" ? "29" : "23"}<span className="text-lg text-white/40 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-10 flex-grow">
                <PricingFeature text="Unlimited everything" />
                <PricingFeature text="Full AI suite" />
                <PricingFeature text="Advanced analytics" />
                <PricingFeature text="Smart scheduling" />
              </ul>
              <Link href="/login" className="landing-btn-primary text-center">Start Free Trial</Link>
            </div>

            {/* Team */}
            <div className="landing-pricing-card">
              <h3 className="text-xl font-bold mb-2">Team</h3>
              <div className="text-4xl font-bold mb-6">${billingCycle === "monthly" ? "79" : "63"}<span className="text-lg text-white/40 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-10 flex-grow">
                <PricingFeature text="Everything in Pro" />
                <PricingFeature text="5 team members" />
                <PricingFeature text="Custom domain" />
                <PricingFeature text="Priority support" />
              </ul>
              <Link href="/login" className="landing-btn-outline text-center">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="landing-cta-box">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to grow your audience?</h2>
            <p className="text-xl text-white/60 mb-12">Join 50,000+ creators already using CreatorCMS</p>
            
            <Link href="/login" className="landing-btn-primary px-12 py-5 text-xl inline-flex items-center gap-3 mb-12">
              Start Creating Now <ArrowRight className="w-6 h-6" />
            </Link>

            <div className="flex flex-col items-center gap-4">
              <div className="flex -space-x-3">
                <div className="avatar-circle bg-indigo-500">SK</div>
                <div className="avatar-circle bg-purple-500">MT</div>
                <div className="avatar-circle bg-pink-500">PM</div>
                <div className="avatar-circle bg-blue-500">AJ</div>
                <div className="avatar-circle bg-emerald-500">LR</div>
              </div>
              <span className="text-sm text-white/50">Join 50,000+ creators</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="pt-20 pb-10 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-bold">CreatorCMS</span>
            </div>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">
              The premium content management platform built specifically for modern video creators.
            </p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/30 transition-colors cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/30 transition-colors cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/30 transition-colors cursor-pointer"></div>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Analytics</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Scheduler</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Series Planner</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Media Library</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Press</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 text-center text-sm text-white/30">
          © 2026 CreatorCMS. Built for creators.
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="landing-card group">
      <div className="landing-icon-box group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ num, icon, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center max-w-[240px]">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
          {num}
        </div>
      </div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </div>
  );
}

function TestimonialCard({ quote, author, role, subscribers, color }) {
  return (
    <div className="landing-card">
      <div className="flex gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-white text-lg mb-8 leading-relaxed italic">"{quote}"</p>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${color}`}>
          {author[0]}
        </div>
        <div>
          <div className="font-bold">{author}</div>
          <div className="text-xs text-white/50">{role} · {subscribers}</div>
        </div>
      </div>
    </div>
  );
}

function PricingFeature({ text }) {
  return (
    <li className="flex items-center gap-3 text-sm text-white/70">
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <Check className="w-3 h-3 text-emerald-500" />
      </div>
      {text}
    </li>
  );
}