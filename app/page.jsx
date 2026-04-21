import Link from "next/link";
import { Sparkles, ArrowRight, BarChart3, Calendar, Layers } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full -z-10"></div>

      <nav className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold font-outfit">CreatorCMS</span>
        </div>
        <Link href="/dashboard" className="text-sm font-medium hover:text-blue-400 transition-colors">
          Sign In
        </Link>
      </nav>

      <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-3 h-3" />
          Powered by Advanced AI
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold font-outfit tracking-tight leading-[1.1]">
          The OS for <span className="gradient-text">Modern Creators.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Plan, produce, and optimize your content across all platforms with AI-driven insights and a premium workflow.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center pt-8">
          <Link 
            href="/dashboard" 
            className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-neutral-200 transition-all flex items-center gap-2 group"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-4 bg-neutral-900 border border-neutral-800 rounded-full font-bold text-lg hover:bg-neutral-800 transition-all">
            Watch Demo
          </button>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-left">
        {[
          { icon: BarChart3, title: "Cross-Platform Analytics", desc: "Compare YouTube, TikTok, and IG performance in one dashboard." },
          { icon: Calendar, title: "Smart Scheduling", desc: "AI recommends the perfect time to post for maximum engagement." },
          { icon: Layers, title: "Series Planning", desc: "Structure courses and long-form series with ease." }
        ].map((feature, i) => (
          <div key={i} className="glass-panel p-8 group hover:border-blue-500/30 transition-all">
            <feature.icon className="w-8 h-8 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-3 font-outfit">{feature.title}</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}