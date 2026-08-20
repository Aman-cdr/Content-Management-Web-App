"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Layers,
  Play,
  Check,
  Share2,
  Scissors,
  Plug,
  Rocket,
  Star,
} from "lucide-react";

const EASE = [0.32, 0.72, 0, 1];
const HEADING = { fontFamily: "'Space Grotesk', sans-serif" };

function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 56, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function DoubleBezel({ children, className = "", highlight = false }) {
  return (
    <div
      className={`rounded-[2rem] p-1.5 ring-1 transition-colors duration-500 ${
        highlight ? "bg-indigo-500/[0.08] ring-indigo-400/20" : "bg-white/[0.04] ring-white/[0.06]"
      } ${className}`}
    >
      <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0A0A10] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ring-1 ring-white/[0.04]">
        {children}
      </div>
    </div>
  );
}

/** Pill CTA — renders as a Next.js Link (navigational) with the button-in-button trailing-icon pattern. */
function PillLink({ href, children, variant = "primary", className = "", onClick }) {
  const styles =
    variant === "primary"
      ? "bg-white text-black hover:shadow-[0_0_40px_-6px_rgba(255,255,255,0.35)]"
      : variant === "outline"
      ? "bg-white/[0.03] text-white ring-1 ring-white/15 hover:bg-white/[0.07]"
      : "bg-transparent text-white/70 hover:text-white";
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative inline-flex items-center gap-1 rounded-full pl-6 pr-1.5 py-1.5 text-[13px] font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${styles} ${className}`}
    >
      <span>{children}</span>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 ${
          variant === "primary" ? "bg-black/10 group-hover:bg-black/20" : "bg-white/10 group-hover:bg-white/20"
        }`}
      >
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
      </span>
    </Link>
  );
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Blog", href: "#blog" },
  ];

  return (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden bg-[#050505] text-white selection:bg-indigo-500/30"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Fixed ambient mesh */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full bg-indigo-500/25 blur-[150px]" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-violet-500/15 blur-[150px]" />
      </div>

      {/* 1. Fluid Island Navbar */}
      <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
        <nav className="flex w-full max-w-3xl items-center justify-between rounded-full border border-white/10 bg-black/60 px-5 py-2.5 backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-neutral-900 ring-1 ring-white/10">
              <img src="/logo.png" alt="CreatorCMS Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight" style={HEADING}>
              CreatorCMS
            </span>
          </div>

          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-[13px] text-white/60 transition-colors duration-500 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <PillLink href="/login" variant="ghost" className="pr-4">
              Sign In
            </PillLink>
            <PillLink href="/login" variant="primary">
              Get Started
            </PillLink>
          </div>

          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            className="relative h-8 w-8 md:hidden"
            aria-label="Toggle menu"
          >
            <span
              className={`absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 bg-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isMenuOpen ? "rotate-45" : "-translate-y-1.5"
              }`}
            />
            <span
              className={`absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 bg-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isMenuOpen ? "-rotate-45" : "translate-y-1.5"
              }`}
            />
          </button>
        </nav>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/85 backdrop-blur-3xl transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {navLinks.map((l, i) => (
          <Link
            key={l.label}
            href={l.href}
            onClick={() => setIsMenuOpen(false)}
            className={`text-2xl font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
            style={{ transitionDelay: isMenuOpen ? `${100 + i * 60}ms` : "0ms" }}
          >
            {l.label}
          </Link>
        ))}
        <hr className="w-24 border-white/10" />
        <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-lg text-white/70">
          Sign In
        </Link>
        <PillLink href="/login" variant="primary" onClick={() => setIsMenuOpen(false)}>
          Get Started
        </PillLink>
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4">
        {/* 2. Hero */}
        <section className="flex min-h-[100dvh] flex-col items-center justify-center pt-24 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-3 w-3" strokeWidth={1.5} />
              Trusted by 50,000+ creators
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1
              className="mt-8 max-w-3xl text-[11vw] leading-[0.95] font-medium tracking-tight md:text-[4.5rem]"
              style={HEADING}
            >
              Create Content Faster.
              <span className="block bg-gradient-to-br from-indigo-300 via-white to-violet-200 bg-clip-text text-transparent">
                Grow Your Audience.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 max-w-xl text-balance text-[15px] leading-relaxed text-white/50">
              The all-in-one platform for content creators — AI scripts, smart scheduling,
              multi-platform publishing, and deep analytics.
            </p>
          </Reveal>

          <Reveal delay={0.3} className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <PillLink href="/login" variant="primary" className="px-1.5">
              Start for Free
            </PillLink>
            <button className="group flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-medium text-white/70 transition-colors duration-500 hover:text-white">
              <Play className="h-4 w-4" strokeWidth={1.25} />
              View Demo
            </button>
          </Reveal>

          <Reveal delay={0.4}>
            <p className="mt-6 text-[12px] text-white/35">
              No credit card required · Free plan available · Setup in 2 minutes
            </p>
          </Reveal>
        </section>

        {/* 3. Stats Bar */}
        <Reveal>
          <section className="grid grid-cols-2 gap-6 border-y border-white/[0.06] py-12 md:grid-cols-4">
            {[
              { value: "50,000+", label: "Active Creators" },
              { value: "12M+", label: "Posts Managed" },
              { value: "99%", label: "Uptime SLA" },
              { value: "4.9★", label: "Average Rating" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-medium tracking-tight md:text-4xl" style={HEADING}>
                  {s.value}
                </div>
                <div className="mt-1 text-[12px] text-white/40">{s.label}</div>
              </div>
            ))}
          </section>
        </Reveal>

        {/* 4. Features — Asymmetrical Bento */}
        <section id="features" className="py-24 md:py-32">
          <Reveal className="text-center">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
              Capabilities
            </span>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl" style={HEADING}>
              Everything you need to grow
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-4 md:auto-rows-[9.5rem] md:grid-cols-12">
            <Reveal className="md:col-span-8 md:row-span-2">
              <DoubleBezel className="h-full" highlight>
                <div className="flex h-full flex-col justify-between p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                      <Sparkles className="h-4 w-4 text-white/80" strokeWidth={1.25} />
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                      AI Script Writer
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium tracking-tight text-white/90 md:text-2xl">
                      Generate high-converting scripts tailored to your voice
                    </h3>
                    <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/45">
                      Feed a topic and tone. Get a structured, edit-ready script that already
                      sounds like you.
                    </p>
                  </div>
                </div>
              </DoubleBezel>
            </Reveal>

            <Reveal delay={0.06} className="md:col-span-4">
              <FeatureBentoCard
                icon={BarChart3}
                tag="Analytics"
                title="Cross-Platform Analytics"
                desc="Compare YouTube, TikTok, and IG performance in one dashboard."
              />
            </Reveal>
            <Reveal delay={0.1} className="md:col-span-4">
              <FeatureBentoCard
                icon={Calendar}
                tag="Scheduling"
                title="Smart Scheduling"
                desc="AI recommends the perfect time to post."
              />
            </Reveal>

            <Reveal delay={0.14} className="md:col-span-4">
              <FeatureBentoCard
                icon={Layers}
                tag="Series"
                title="Series Planning"
                desc="Structure courses and long-form series with intelligent automation."
              />
            </Reveal>
            <Reveal delay={0.18} className="md:col-span-4">
              <FeatureBentoCard
                icon={Share2}
                tag="Publishing"
                title="Cross-Platform Publishing"
                desc="Publish once to Shorts and Reels simultaneously."
              />
            </Reveal>
            <Reveal delay={0.22} className="md:col-span-4">
              <FeatureBentoCard
                icon={Scissors}
                tag="Clipping"
                title="Clip Cut Tool"
                desc="AI finds the best moments and cuts ready-to-post clips."
              />
            </Reveal>
          </div>
        </section>

        {/* 5. How It Works */}
        <section className="border-t border-white/[0.06] py-24 md:py-32">
          <div className="flex flex-col items-center justify-between gap-16 md:flex-row md:items-start">
            <Step
              num="1"
              icon={Plug}
              title="Connect your platforms"
              desc="Link your YouTube, TikTok, and Instagram accounts in seconds."
            />
            <div className="hidden h-px flex-grow border-t border-dashed border-indigo-400/25 md:mt-8 md:block" />
            <Step
              num="2"
              icon={Sparkles}
              title="Create with AI assistance"
              desc="Draft scripts and plan episodes with our intelligent co-pilot."
            />
            <div className="hidden h-px flex-grow border-t border-dashed border-indigo-400/25 md:mt-8 md:block" />
            <Step
              num="3"
              icon={Rocket}
              title="Publish and grow"
              desc="Schedule posts and track your progress with real-time data."
            />
          </div>
        </section>

        {/* 6. Testimonials */}
        <section className="py-24 md:py-32">
          <Reveal className="text-center">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl" style={HEADING}>
              Loved by creators worldwide
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Reveal>
              <TestimonialCard
                quote="CreatorCMS completely changed how I manage my content. I went from 10K to 100K subscribers in 6 months."
                author="Sarah K."
                role="Tech Creator"
                subscribers="142K subscribers"
                color="bg-pink-500"
              />
            </Reveal>
            <Reveal delay={0.08}>
              <TestimonialCard
                quote="The AI script writer saves me 5 hours every week. It's like having a writing assistant that knows my voice."
                author="Marcus T."
                role="Educator"
                subscribers="89K subscribers"
                color="bg-blue-500"
              />
            </Reveal>
            <Reveal delay={0.16}>
              <TestimonialCard
                quote="Finally a tool that understands creators. The analytics alone are worth it."
                author="Priya M."
                role="Lifestyle Creator"
                subscribers="234K subscribers"
                color="bg-amber-500"
              />
            </Reveal>
          </div>
        </section>

        {/* 7. Pricing */}
        <section id="pricing" className="border-t border-white/[0.06] py-24 md:py-32">
          <Reveal className="text-center">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl" style={HEADING}>
              Simple, transparent pricing
            </h2>

            <div className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-5 py-2 text-[13px] font-medium transition-all duration-500 ${
                  billingCycle === "monthly" ? "bg-white text-black" : "text-white/50 hover:text-white/80"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`rounded-full px-5 py-2 text-[13px] font-medium transition-all duration-500 ${
                  billingCycle === "annual" ? "bg-white text-black" : "text-white/50 hover:text-white/80"
                }`}
              >
                Annual{" "}
                <span className="ml-1 rounded bg-indigo-400/20 px-1.5 py-0.5 text-[10px] text-indigo-300">
                  -20%
                </span>
              </button>
            </div>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
            <Reveal>
              <PricingCard
                name="Free"
                price="0"
                features={["3 platforms", "10 posts/month", "Basic analytics"]}
                cta={<PillLink href="/login" variant="outline">Get Started</PillLink>}
              />
            </Reveal>

            <Reveal delay={0.08}>
              <PricingCard
                name="Creator Pro ⭐"
                price={billingCycle === "monthly" ? "29" : "23"}
                popular
                features={["Unlimited everything", "Full AI suite", "Advanced analytics", "Smart scheduling"]}
                cta={<PillLink href="/login" variant="primary">Start Free Trial</PillLink>}
              />
            </Reveal>

            <Reveal delay={0.16}>
              <PricingCard
                name="Team"
                price={billingCycle === "monthly" ? "79" : "63"}
                features={["Everything in Pro", "5 team members", "Custom domain", "Priority support"]}
                cta={<PillLink href="/login" variant="outline">Contact Sales</PillLink>}
              />
            </Reveal>
          </div>
        </section>

        {/* 8. CTA */}
        <section className="pb-24 md:pb-32">
          <Reveal>
            <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-indigo-500/[0.08] to-transparent px-8 py-20 text-center">
              <h2 className="mx-auto max-w-lg text-3xl font-medium tracking-tight md:text-5xl" style={HEADING}>
                Ready to grow your audience?
              </h2>
              <p className="mt-5 text-[15px] text-white/50">
                Join 50,000+ creators already using CreatorCMS
              </p>

              <div className="mt-10 flex justify-center">
                <PillLink href="/login" variant="primary" className="px-1.5 text-[15px]">
                  Start Creating Now
                </PillLink>
              </div>

              <div className="mt-12 flex flex-col items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="avatar-circle bg-indigo-500">SK</div>
                  <div className="avatar-circle bg-purple-500">MT</div>
                  <div className="avatar-circle bg-pink-500">PM</div>
                  <div className="avatar-circle bg-blue-500">AJ</div>
                  <div className="avatar-circle bg-emerald-500">LR</div>
                </div>
                <span className="text-[12px] text-white/40">Join 50,000+ creators</span>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 9. Footer */}
        <footer className="border-t border-white/[0.06] pb-10 pt-16">
          <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-neutral-900 ring-1 ring-white/10">
                  <img src="/logo.png" alt="CreatorCMS Logo" className="h-full w-full object-cover" />
                </div>
                <span className="text-[15px] font-semibold" style={HEADING}>
                  CreatorCMS
                </span>
              </div>
              <p className="mb-6 text-[13px] leading-relaxed text-white/40">
                The premium content management platform built specifically for modern video
                creators.
              </p>
              <div className="flex gap-3">
                <div className="h-8 w-8 cursor-pointer rounded-full border border-white/10 bg-white/5 transition-colors hover:border-white/30" />
                <div className="h-8 w-8 cursor-pointer rounded-full border border-white/10 bg-white/5 transition-colors hover:border-white/30" />
                <div className="h-8 w-8 cursor-pointer rounded-full border border-white/10 bg-white/5 transition-colors hover:border-white/30" />
              </div>
            </div>

            <FooterCol
              title="Product"
              links={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Analytics", href: "/dashboard" },
                { label: "Scheduler", href: "/dashboard" },
                { label: "Series Planner", href: "/dashboard" },
                { label: "Media Library", href: "/dashboard" },
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { label: "About", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Careers", href: "#" },
                { label: "Press", href: "#" },
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                { label: "Privacy", href: "#" },
                { label: "Terms", href: "#" },
                { label: "Cookies", href: "#" },
              ]}
            />
          </div>

          <div className="mt-16 border-t border-white/[0.06] pt-8 text-center text-[12px] text-white/30">
            © 2026 CreatorCMS. Built for creators.
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureBentoCard({ icon: Icon, tag, title, desc }) {
  return (
    <DoubleBezel className="h-full">
      <div className="flex h-full flex-col justify-between p-6">
        <div className="flex items-center justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
            <Icon className="h-4 w-4 text-white/70" strokeWidth={1.25} />
          </span>
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">{tag}</span>
        </div>
        <div>
          <h3 className="text-[15px] font-medium tracking-tight text-white/90">{title}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-white/45">{desc}</p>
        </div>
      </div>
    </DoubleBezel>
  );
}

function Step({ num, icon: Icon, title, desc }) {
  return (
    <div className="flex max-w-[240px] flex-col items-center text-center">
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_0_30px_-8px_rgba(99,102,241,0.5)]">
          <Icon className="h-6 w-6 text-white" strokeWidth={1.25} />
        </div>
        <div
          className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-bold text-indigo-600"
          style={HEADING}
        >
          {num}
        </div>
      </div>
      <h3 className="font-medium tracking-tight" style={HEADING}>
        {title}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-white/45">{desc}</p>
    </div>
  );
}

function TestimonialCard({ quote, author, role, subscribers, color }) {
  return (
    <DoubleBezel className="h-full">
      <div className="flex h-full flex-col p-6">
        <div className="mb-5 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={1} />
          ))}
        </div>
        <p className="flex-grow text-[15px] italic leading-relaxed text-white/85">&ldquo;{quote}&rdquo;</p>
        <div className="mt-6 flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold text-white ${color}`}
          >
            {author[0]}
          </div>
          <div>
            <div className="text-[13px] font-medium">{author}</div>
            <div className="text-[11px] text-white/40">
              {role} · {subscribers}
            </div>
          </div>
        </div>
      </div>
    </DoubleBezel>
  );
}

function PricingCard({ name, price, features, cta, popular }) {
  return (
    <DoubleBezel className="h-full" highlight={popular}>
      <div className="relative flex h-full flex-col p-7">
        {popular && (
          <div
            className="absolute -top-3 right-6 rounded-full bg-indigo-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
            style={HEADING}
          >
            Most Popular
          </div>
        )}
        <h3 className="text-[15px] font-medium text-white/80">{name}</h3>
        <div className="mb-6 mt-2 text-3xl font-medium tracking-tight" style={HEADING}>
          ${price}
          <span className="text-base font-normal text-white/40">/mo</span>
        </div>
        <ul className="mb-8 flex-grow space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-[13px] text-white/65">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
                <Check className="h-3 w-3 text-emerald-400" strokeWidth={2} />
              </span>
              {f}
            </li>
          ))}
        </ul>
        {cta}
      </div>
    </DoubleBezel>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="mb-5 text-[13px] font-medium" style={HEADING}>
        {title}
      </h4>
      <ul className="space-y-3 text-[13px] text-white/45">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
