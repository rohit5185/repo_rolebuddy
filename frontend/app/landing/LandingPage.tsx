"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Users,
  CheckCircle2,
  Flame,
  MessageSquareText,
  Search,
  ArrowRight,
  Circle,
  Target,
  Zap,
  UserCheck,
  BarChart2,
  Menu,
  X,
  Video,
  MessageSquare,
  Monitor,
  Globe,
} from "lucide-react";
import { useInstallPrompt } from "@/components/InstallPrompt";

// ── Install / PWA button ───────────────────────────────────────────────────────

function ContinueOnAppButton({ size = "hero" }: { size?: "hero" | "sm" }) {
  const { canInstall, platform, isInstalling, install, isStandalone } = useInstallPrompt();
  const [showIosGuide, setShowIosGuide] = useState(false);

  const heroClass =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-6 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(14,86,168,0.35)] transition hover:bg-sky-800 active:scale-95";
  const smClass =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(14,86,168,0.25)] transition hover:bg-sky-800 active:scale-95";
  const cls = size === "hero" ? heroClass : smClass;

  // Already running as installed PWA
  if (isStandalone) {
    return (
      <Link href="/dashboard" className={cls}>
        Open App
      </Link>
    );
  }

  const handleClick = async () => {
    // iOS Safari cannot trigger install programmatically — show guide
    if (platform === "ios") {
      setShowIosGuide(true);
      return;
    }
    // Native install prompt is ready — fire it directly
    if (canInstall) {
      await install();
      // After user accepts, take them into the app
      window.location.href = "/dashboard";
      return;
    }
    // Install prompt not yet fired by browser — nothing to do
  };

  return (
    <>
      <button type="button" onClick={handleClick} disabled={isInstalling} className={cls}>
        {isInstalling ? "Installing…" : "Continue on App"}
      </button>

      {/* iOS-only guide — Safari requires manual Add to Home Screen */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIosGuide(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl border border-white/70 bg-white/90 backdrop-blur-xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 border border-white/80 p-1.5 shadow-sm">
                <Image src="/RoleBuddy_LOGO.png" alt="RoleBuddy" width={36} height={36} className="h-full w-auto object-contain" />
              </div>
              <div>
                <p className="font-bold text-sky-950">Install RoleBuddy</p>
                <p className="text-xs text-sky-700/70">Add to your home screen</p>
              </div>
            </div>
            <ol className="space-y-3 text-sm text-sky-900/80">
              {[
                "Tap the Share button in Safari's toolbar",
                'Scroll down and tap "Add to Home Screen"',
                'Tap "Add" — done!',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-700 text-[11px] font-black text-white mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-5 w-full rounded-xl border border-white/60 bg-white/50 py-2.5 text-sm font-semibold text-sky-700 hover:bg-white/70 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Scroll-reveal ──────────────────────────────────────────────────────────────

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".rb-reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("rb-visible");
        }),
      { threshold: 0.06 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ── Glass card ─────────────────────────────────────────────────────────────────

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/70 bg-white/60 backdrop-blur-xl shadow-[0_2px_20px_rgba(14,54,100,0.07)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}

// ── Comparison data ────────────────────────────────────────────────────────────

const compareRows = [
  { feature: "Role-based peer matching", li: false, lc: false, disc: false, gd: false },
  { feature: "Daily check-ins + streak tracking", li: false, lc: false, disc: false, gd: false },
  { feature: "Accountability partner", li: false, lc: false, disc: false, gd: false },
  { feature: "Partner sees your daily status", li: false, lc: false, disc: false, gd: false },
  { feature: "Text mock interviews", li: false, lc: "partial", disc: false, gd: false },
  { feature: "Experience exchange system", li: false, lc: false, disc: false, gd: false },
];

// ── Main ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  useReveal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen font-body antialiased overflow-x-hidden" style={{
      background: "linear-gradient(135deg, #C7E6F9 0%, #8ED1F6 45%, #61C1F5 100%)",
      backgroundAttachment: "fixed",
    }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.5)}}
        @keyframes streak-pulse{0%,100%{box-shadow:0 0 0 0 rgba(14,86,168,0.3)}60%{box-shadow:0 0 0 5px transparent}}
        .rb-reveal{opacity:0;transform:translateY(20px);transition:opacity 0.55s ease,transform 0.55s ease}
        .rb-reveal.rb-visible{opacity:1;transform:none}
        .rb-reveal-d1{transition-delay:.08s}.rb-reveal-d2{transition-delay:.16s}.rb-reveal-d3{transition-delay:.24s}
        .hero-a1{opacity:0;animation:fadeUp .65s .06s forwards}
        .hero-a2{opacity:0;animation:fadeUp .7s .18s forwards}
        .hero-a3{opacity:0;animation:fadeUp .7s .32s forwards}
        .hero-a4{opacity:0;animation:fadeUp .7s .46s forwards}
        .hero-a5{opacity:0;animation:fadeUp .75s .60s forwards}
        .dot-live{width:7px;height:7px;border-radius:50%;background:#0ea5e9;animation:pulse-dot 2s ease-in-out infinite;display:inline-block;flex-shrink:0}
        .cmp-row:hover{background:rgba(255,255,255,0.25)}
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 py-3 bg-white/75 backdrop-blur-xl border-b border-white/60 shadow-[0_1px_0_rgba(255,255,255,0.5)]">
        <Link href="/" className="flex items-center gap-2.5" aria-label="RoleBuddy home">
          <Image
            src="/RoleBuddy_LOGO.png"
            alt="RoleBuddy"
            width={140}
            height={36}
            className="h-8 sm:h-9 w-auto object-contain"
            priority
          />
          <span className="hidden sm:inline rounded-full bg-sky-100/80 border border-sky-200/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-700">
            Live
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#how" className="text-sm font-semibold text-sky-800/70 hover:text-sky-950 transition-colors">How it works</a>
          <a href="#features" className="text-sm font-semibold text-sky-800/70 hover:text-sky-950 transition-colors">Features</a>
          <a href="#compare" className="text-sm font-semibold text-sky-800/70 hover:text-sky-950 transition-colors">Why RoleBuddy</a>
        </div>
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-xl border border-white/70 bg-white/50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-white/70 transition-all backdrop-blur-sm"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-bold text-white shadow-[0_4px_14px_rgba(14,86,168,0.28)] hover:bg-sky-800 transition-all"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/login"
            className="text-sm font-semibold text-sky-900 px-3 py-1.5 rounded-lg border border-white/70 bg-white/50"
          >
            Log in
          </Link>
          <button
            type="button"
            className="p-2 rounded-lg border border-white/60 bg-white/40"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4 text-sky-950" /> : <Menu className="h-4 w-4 text-sky-950" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-white/60 shadow-lg px-4 py-5 flex flex-col gap-3 md:hidden">
            <a href="#how" className="text-sm font-semibold text-sky-900 py-1" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#features" className="text-sm font-semibold text-sky-900 py-1" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#compare" className="text-sm font-semibold text-sky-900 py-1" onClick={() => setMobileMenuOpen(false)}>Why RoleBuddy</a>
            <Link
              href="/signup"
              className="mt-1 text-center rounded-xl bg-sky-700 py-2.5 text-sm font-bold text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started Free
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-36 md:pt-44 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-[1fr_auto] lg:gap-12 items-start">

            {/* Left: headline + CTAs */}
            <div>
              {/* Live badge */}
              <div className="hero-a1 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 backdrop-blur-sm px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-sky-700 mb-5">
                <span className="dot-live" />
                Now Live — Find Your Prep Partner
              </div>

              <h1 className="hero-a2 font-headline text-[clamp(30px,7vw,58px)] font-extrabold leading-[1.08] tracking-tight text-sky-950 max-w-2xl mb-4">
                Find people preparing for the{" "}
                <span className="text-sky-700">same role</span> as you.
              </h1>

              <p className="hero-a3 text-[15px] sm:text-[17px] text-sky-800/80 leading-relaxed max-w-xl mb-8">
                Get matched with a peer at your level and role. Exchange real interview experiences with builtin system, practice with peers through async chat-based, live chat-based 1:1, and live 1:1 interviews. Daily check-ins, streaks, and partner visibility keep you consistent — not just signed up.
              </p>

              {/* CTAs */}
              <div className="hero-a4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xs sm:max-w-none mb-8">
                <ContinueOnAppButton size="hero" />
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/50 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-sky-900 hover:bg-white/70 transition-all active:scale-95"
                >
                  Continue on Website
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Social proof */}
              <div className="hero-a5 flex items-center gap-3">
                <div className="flex">
                  {["A", "R", "K", "P", "S"].map((l, i) => (
                    <div
                      key={l + i}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 border-sky-200/60 bg-sky-700 text-[10px] sm:text-[11px] font-bold text-white shadow-sm"
                      style={{ marginLeft: i > 0 ? "-7px" : 0, zIndex: 5 - i }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-[12px] sm:text-[13px] text-sky-800/70">
                  <strong className="text-sky-900">200+ users</strong> already matched
                </p>
              </div>
            </div>

            {/* Right: dashboard preview */}
            <div className="hero-a5 hidden lg:block w-[340px] shrink-0">
              <GlassCard className="p-0 overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/60 bg-white/30">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                  <div className="ml-2 flex-1 rounded-md border border-white/50 bg-white/40 px-3 py-0.5 text-[10px] font-mono text-sky-700/60">
                    rolebuddy.me/dashboard
                  </div>
                </div>
                {/* Dashboard snippet */}
                <div className="p-4 flex flex-col gap-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/60 mb-1">Daily control panel</p>
                      <p className="font-headline text-sm font-black text-sky-950">Preparing for Backend Engineer</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-sky-100/80 border border-sky-200/60 px-2.5 py-1 text-[11px] font-bold text-sky-700 shrink-0">
                      <Flame className="h-3 w-3 text-orange-500" />
                      7 days
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: "Streak", value: "7" },
                      { label: "Partner", value: "Active" },
                      { label: "Goal", value: "2 hrs" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl bg-white/50 border border-white/70 px-2 py-2">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-sky-700/60 mb-1">{label}</p>
                        <p className="font-black text-sky-950 text-sm leading-none">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Partner card */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/40 p-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-700 text-white font-bold text-sm">R</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-sky-950 truncate">swift_phoenix_42</p>
                      <p className="text-[10px] text-sky-700/60">Backend Engineer · 2 YOE</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 border border-emerald-200/60 px-2 py-0.5 text-[9px] font-bold text-emerald-700 shrink-0">Matched</span>
                  </div>

                  {/* Check-in */}
                  <div className="flex items-center justify-between rounded-xl border border-white/70 bg-white/40 p-2.5 gap-2">
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4 text-sky-400" />
                      <p className="text-[11px] font-semibold text-sky-900">Today&apos;s check-in pending</p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg bg-sky-700 px-2.5 py-1.5 text-[10px] font-bold text-white"
                      style={{ animation: "streak-pulse 2.2s ease-in-out infinite" }}
                    >
                      Mark done
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>

          </div>
        </div>
      </section>

      {/* ── PROBLEM ─────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 rb-reveal">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 mb-2">The Problem</p>
            <h2 className="font-headline text-[clamp(22px,4.5vw,38px)] font-extrabold leading-[1.14] tracking-tight text-sky-950 mb-2">
              Most job prep fails before it starts.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-sky-800/70 max-w-lg leading-relaxed">
              Not because of missing content — because of isolation and inconsistency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Users,
                title: "Isolated",
                desc: "Nobody around you is preparing for the same role. No one to sync with, share progress, or get honest feedback from.",
              },
              {
                icon: BarChart2,
                title: "Inconsistent",
                desc: "Without external pressure most people drop off after 3–4 days. The habit never forms and prep restarts from zero.",
              },
              {
                icon: MessageSquareText,
                title: "No feedback loop",
                desc: "You study in silence. No one tells you what to prioritise or holds you accountable day after day.",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <GlassCard key={title} className={`rb-reveal${i > 0 ? ` rb-reveal-d${i}` : ""}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/80 border border-sky-200/60 mb-4">
                  <Icon className="h-4 w-4 text-sky-700" />
                </div>
                <h3 className="font-headline text-base font-bold text-sky-950 mb-2">{title}</h3>
                <p className="text-[13px] text-sky-800/70 leading-relaxed">{desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 rb-reveal">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 mb-2">How It Works</p>
            <h2 className="font-headline text-[clamp(22px,4.5vw,38px)] font-extrabold leading-[1.14] tracking-tight text-sky-950 mb-2">
              From sign-up to accountable in minutes.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-sky-800/70 max-w-lg leading-relaxed">
              Designed to get you matched and checking in — not just registered.
            </p>
          </div>

          {/* Steps — left border line layout */}
          <div className="relative flex flex-col gap-0">
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-sky-400/60 via-sky-300/40 to-transparent hidden sm:block" aria-hidden />
            {[
              {
                num: "1",
                icon: Target,
                title: "Set your role and goals",
                desc: "Pick your target role, experience level, daily study goal, and availability. Takes two minutes.",
              },
              {
                num: "2",
                icon: Search,
                title: "Get matched to a peer",
                desc: "The matching engine finds someone preparing for the same role and level, active within the last 24 hours.",
              },
              {
                num: "3",
                icon: CheckCircle2,
                title: "Daily check-ins in chat",
                desc: "A system prompt arrives in your shared chat every day. Mark done. Your partner sees your status and you see theirs.",
              },
              {
                num: "4",
                icon: Flame,
                title: "Build your streak",
                desc: "Consecutive done check-ins grow your streak. Breaking it feels costly — that is the point.",
              },
              {
                num: "5",
                icon: UserCheck,
                title: "Peer mock interviews",
                desc: "Run text, live online, or video mock interviews directly inside your chat — no third-party scheduling needed.",
              },
            ].map(({ num, icon: Icon, title, desc }, i) => (
              <div
                key={num}
                className={`flex items-start gap-5 pb-6 rb-reveal`}
                style={{ transitionDelay: `${i * 0.06}s` }}
              >
                <div className="relative flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/60 backdrop-blur-sm shadow-sm">
                    <Icon className="h-4 w-4 text-sky-700" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-700 text-[8px] font-black text-white">
                    {num}
                  </span>
                </div>
                <div className="pt-1.5">
                  <h3 className="font-headline text-[14px] font-bold text-sky-950 mb-1">{title}</h3>
                  <p className="text-[13px] text-sky-800/70 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 rb-reveal">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 mb-2">Features</p>
            <h2 className="font-headline text-[clamp(22px,4.5vw,38px)] font-extrabold leading-[1.14] tracking-tight text-sky-950 mb-2">
              Built to make dropping off harder than staying in.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-sky-800/70 max-w-lg leading-relaxed">
              Every mechanic exists to reinforce the accountability loop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Streak tracking — wide */}
            <GlassCard className="md:col-span-2 rb-reveal">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/80 border border-sky-200/60">
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-sky-950">Streak Tracking</h3>
                  <p className="text-[12px] text-sky-800/60">Breaking a streak feels costly. That is the point.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 28 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-6 w-6 rounded-md border ${
                      i < 21
                        ? "bg-sky-700 border-sky-800"
                        : i === 21
                        ? "bg-sky-400 border-sky-500"
                        : "bg-white/40 border-white/60"
                    }`}
                    style={i === 21 ? { animation: "streak-pulse 2s infinite" } : undefined}
                  />
                ))}
              </div>
              <p className="mt-3 text-[11px] text-sky-800/60">
                21 days done ·{" "}
                <strong className="text-sky-700">today pending</strong>
              </p>
            </GlassCard>

            {/* Smart matching */}
            <GlassCard className="rb-reveal rb-reveal-d1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/80 border border-sky-200/60">
                  <Search className="h-4 w-4 text-sky-700" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-sky-950">Smart Matching</h3>
                  <p className="text-[12px] text-sky-800/60">Closest peer first.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: "Same role + exp", pct: 98, active: true },
                  { label: "Same role", pct: 80 },
                  { label: "Same spec", pct: 62 },
                  { label: "Same domain", pct: 41 },
                ].map(({ label, pct, active }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-28 text-[11px] text-sky-800/70 shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/50 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: active ? "#0369a1" : "rgba(3,105,161,0.25)",
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-sky-700 w-7 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Daily check-in */}
            <GlassCard className="rb-reveal">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/80 border border-sky-200/60">
                  <CheckCircle2 className="h-4 w-4 text-sky-700" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-sky-950">Daily Check-in</h3>
                  <p className="text-[12px] text-sky-800/60">System prompt in chat every day.</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/60 bg-white/30 p-3 flex flex-col gap-2.5">
                <div className="rounded-lg border border-sky-200/60 bg-sky-50/70 p-3">
                  <p className="text-[10px] font-bold text-sky-700 mb-1">RoleBuddy System</p>
                  <p className="text-[12px] text-sky-900/80">Did you complete your daily prep goal today?</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-lg bg-sky-700 py-2 text-[11px] font-bold text-white"
                    style={{ animation: "streak-pulse 2s infinite" }}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-white/60 bg-white/40 py-2 text-[11px] font-semibold text-sky-800/70"
                  >
                    Not today
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Wide Domain Coverage — replaces Partner Visibility */}
            <GlassCard className="rb-reveal rb-reveal-d1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/80 border border-sky-200/60">
                  <Globe className="h-4 w-4 text-sky-700" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-sky-950">Wide Domain Coverage</h3>
                  <p className="text-[12px] text-sky-800/60">Tech, non-tech — same specific role.</p>
                </div>
              </div>
              <p className="text-[12px] text-sky-800/70 leading-relaxed mb-3">
                From technical to non-technical both type careers, RoleBuddy covers a wide range of domains and specific job roles — so you can prepare with peers who are heading toward the same role.
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  "Software Engineering",
                  "Data & AI",
                  "Product & Design",
                  "Marketing & Sales",
                  "Finance & Ops",
                ].map((label) => (
                  <div key={label} className="rounded-lg border border-sky-200/60 bg-sky-100/80 px-2.5 py-1.5 text-[11px] font-semibold text-sky-700">
                    {label}
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Anonymous names */}
            <GlassCard className="rb-reveal rb-reveal-d2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/80 border border-sky-200/60">
                  <UserCheck className="h-4 w-4 text-sky-700" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-sky-950">Anonymous Names</h3>
                  <p className="text-[12px] text-sky-800/60">Connect without sharing identity upfront.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {["swift_phoenix_42", "calm_horizon_17", "bright_nebula_88"].map((name) => (
                  <div key={name} className="flex items-center gap-2.5 rounded-lg border border-white/60 bg-white/40 px-3 py-2">
                    <div className="h-5 w-5 rounded-full bg-sky-700 flex-shrink-0" />
                    <span className="text-[11px] font-mono font-semibold text-sky-900">{name}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Experience exchange — full width */}
            <GlassCard className="md:col-span-3 rb-reveal">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 border border-sky-200/60 mt-0.5">
                  <Zap className="h-4 w-4 text-sky-700" />
                </div>
                <div>
                  <h3 className="font-headline text-base sm:text-xl font-bold text-sky-950">Experience Exchange System</h3>
                  <p className="text-[12px] sm:text-[14px] text-sky-800/60">Share role and interview insights — with mutual unlock.</p>
                </div>
              </div>
              <p className="text-[12px] sm:text-[13px] text-sky-800/70 mb-5 leading-relaxed max-w-2xl">
                Neither partner sees the other&apos;s content until both have submitted. Fair and reciprocal by design.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-700 mb-3">What you share</p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { title: "Role Experience", desc: "Role, company type, responsibilities, skills, mistakes, advice." },
                      { title: "Interview Experience", desc: "Rounds, types, difficulty, notable questions, what you'd change." },
                      { title: "Sensitive Details (mutual opt-in)", desc: "HR contact, referral pathway — unlocked only if both approve." },
                    ].map(({ title, desc }) => (
                      <div key={title} className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/40 p-3">
                        <CheckCircle2 className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[12px] font-bold text-sky-950">{title}</p>
                          <p className="text-[11px] text-sky-800/60 mt-0.5 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-700 mb-3">How the exchange works</p>
                  <div className="relative">
                    <div className="absolute left-[14px] top-5 bottom-5 w-px bg-sky-300/50" aria-hidden />
                    <div className="flex flex-col gap-2.5">
                      {[
                        { step: "1", title: "Build your template", desc: "Fill in your role or interview experience inside chat." },
                        { step: "2", title: "Send an exchange request", desc: "Propose an exchange to your matched or connected partner." },
                        { step: "3", title: "Partner fills their template", desc: "Neither side can read the other's content until both submit." },
                        { step: "4", title: "Both templates unlock together", desc: "Both become visible simultaneously — no unfair advantage." },
                      ].map(({ step, title, desc }) => (
                        <div key={step} className="flex items-start gap-3 pl-1">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-700 text-[10px] font-black text-white mt-0.5 z-10 relative">
                            {step}
                          </div>
                          <div className="rounded-xl border border-white/60 bg-white/40 p-2.5 flex-1">
                            <p className="text-[12px] font-bold text-sky-950">{title}</p>
                            <p className="text-[11px] text-sky-800/60 mt-0.5 leading-relaxed">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Peer-to-Peer Interviewing System — full width */}
            <GlassCard className="md:col-span-3 rb-reveal">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 border border-sky-200/60 mt-0.5">
                  <Video className="h-4 w-4 text-sky-700" />
                </div>
                <div>
                  <h3 className="font-headline text-base sm:text-xl font-bold text-sky-950">Peer-to-Peer Interviewing System</h3>
                  <p className="text-[12px] sm:text-[14px] text-sky-800/60">Practice real interviews with your peer — no third-party tools needed.</p>
                </div>
              </div>
              <p className="text-[12px] sm:text-[13px] text-sky-800/70 mb-5 leading-relaxed max-w-2xl">
                Send a request, your partner accepts, and the interview starts. Be the interviewer or the candidate — switch roles anytime. Supports technical, HR, and behavioural interviews with built-in or custom templates.
              </p>

              {/* 3 interview types */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {[
                  {
                    icon: MessageSquare,
                    title: "Async Text Interview",
                    badge: "Flexible",
                    desc: "Questions sent over chat, answers at your pace. No need to be online simultaneously. Great for written communication practice.",
                  },
                  {
                    icon: Monitor,
                    title: "Live Chat Interview",
                    badge: "Real-time",
                    desc: "Both online at the same time. Rapid-fire text Q&A simulating a real screener or written interview session.",
                  },
                  {
                    icon: Video,
                    title: "Live Video Interview",
                    badge: "Most Realistic",
                    desc: "Face-to-face video call inside the platform. Closest simulation to an actual interview — voice, video, real pressure.",
                  },
                ].map(({ icon: Icon, title, badge, desc }) => (
                  <div key={title} className="rounded-xl border border-white/60 bg-white/40 p-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100/80 border border-sky-200/60">
                        <Icon className="h-4 w-4 text-sky-700" />
                      </div>
                      <span className="rounded-full border border-sky-200/60 bg-sky-100/80 px-2 py-0.5 text-[9px] font-bold text-sky-700">{badge}</span>
                    </div>
                    <p className="text-[12px] font-bold text-sky-950">{title}</p>
                    <p className="text-[11px] text-sky-800/60 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              {/* Interview categories + flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-700 mb-3">Interview Categories</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: "Technical", desc: "DSA, system design, coding, domain-specific tech questions." },
                      { label: "HR", desc: "Culture fit, CTC negotiation, background & intent questions." },
                      { label: "Behavioural", desc: "STAR-format, leadership, conflict, growth stories." },
                    ].map(({ label, desc }) => (
                      <div key={label} className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/40 p-3">
                        <span className="mt-0.5 shrink-0 rounded-full border border-sky-200/60 bg-sky-100/80 px-2 py-0.5 text-[10px] font-bold text-sky-700">{label}</span>
                        <p className="text-[11px] text-sky-800/60 leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-700 mb-3">How it works</p>
                  <div className="relative">
                    <div className="absolute left-[14px] top-5 bottom-5 w-px bg-sky-300/50" aria-hidden />
                    <div className="flex flex-col gap-2.5">
                      {[
                        { step: "1", title: "Choose interview type", desc: "Pick async text, live chat, or live video." },
                        { step: "2", title: "Pick your role", desc: "Go as interviewer or candidate. Swap roles next time." },
                        { step: "3", title: "Use or build a template", desc: "Start from our built-in question sets or create your own." },
                        { step: "4", title: "Send the request", desc: "Your partner gets a request. Interview starts on accept." },
                        { step: "5", title: "Conduct & review", desc: "Interview runs inside the platform. Give feedback after." },
                      ].map(({ step, title, desc }) => (
                        <div key={step} className="flex items-start gap-3 pl-1">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-700 text-[10px] font-black text-white mt-0.5 z-10 relative">
                            {step}
                          </div>
                          <div className="rounded-xl border border-white/60 bg-white/40 p-2.5 flex-1">
                            <p className="text-[12px] font-bold text-sky-950">{title}</p>
                            <p className="text-[11px] text-sky-800/60 mt-0.5 leading-relaxed">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

          </div>
        </div>
      </section>

      {/* ── COMPARISON ───────────────────────────────────────────────────────── */}
      <section id="compare" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 rb-reveal">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 mb-2">Why RoleBuddy</p>
            <h2 className="font-headline text-[clamp(22px,4.5vw,38px)] font-extrabold leading-[1.14] tracking-tight text-sky-950 mb-2">
              Built for accountability, not content.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-sky-800/70 max-w-lg leading-relaxed">
              Other platforms give you content or community. RoleBuddy gives you a partner who keeps you showing up every day.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rb-reveal rb-reveal-d1 rounded-2xl border border-white/70 bg-white/60 backdrop-blur-xl overflow-hidden shadow-[0_2px_20px_rgba(14,54,100,0.07)]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.4fr] border-b border-white/60 bg-white/30 px-5 py-3.5">
              {["Feature", "LinkedIn", "LeetCode", "Discord", "Glassdoor", "RoleBuddy"].map((h, i) => (
                <div
                  key={h}
                  className={`text-[11px] font-black uppercase tracking-widest ${
                    i === 5 ? "text-sky-700 text-center" : i === 0 ? "text-sky-900" : "text-sky-700/50 text-center"
                  }`}
                >
                  {h}
                </div>
              ))}
            </div>
            {compareRows.map(({ feature, li, lc, disc, gd }) => (
              <div key={feature} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.4fr] px-5 py-3.5 border-b border-white/40 cmp-row transition-colors">
                <div className="text-[13px] font-semibold text-sky-900">{feature}</div>
                {([li, lc, disc, gd] as (boolean | string)[]).map((v, i) => (
                  <div key={i} className="flex justify-center">
                    {v === "partial" ? (
                      <span className="text-amber-600 text-sm font-bold">~</span>
                    ) : v ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-sky-700/50 font-semibold">—</span>
                    )}
                  </div>
                ))}
                <div className="flex justify-center"><span className="font-bold text-emerald-600">✓</span></div>
              </div>
            ))}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex flex-col gap-3 rb-reveal rb-reveal-d1">
            {compareRows.map(({ feature, li, lc, disc, gd }) => (
              <GlassCard key={feature} className="p-4">
                <p className="text-[13px] font-bold text-sky-950 mb-3">{feature}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                  {([["LinkedIn", li], ["LeetCode", lc], ["Discord", disc], ["Glassdoor", gd]] as [string, boolean | string][]).map(([name, v]) => (
                    <div key={name} className="flex items-center justify-between text-[11px]">
                      <span className="text-sky-800/70">{name}</span>
                      {v === "partial" ? (
                        <span className="text-amber-600">~</span>
                      ) : v ? (
                        <span className="text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="text-sky-700/50 font-semibold">—</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-xl border border-sky-200/60 bg-sky-50/60 px-3 py-2">
                  <span className="text-[12px] font-bold text-sky-700">RoleBuddy</span>
                  <span className="text-emerald-600 font-bold">✓</span>
                </div>
              </GlassCard>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <GlassCard className="rb-reveal text-center py-12 sm:py-16">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky-700 mb-5">
              <span className="dot-live" />
              Free to join
            </div>
            <h2 className="font-headline text-[clamp(24px,5.5vw,44px)] font-extrabold leading-[1.1] tracking-tight text-sky-950 mb-4 max-w-lg mx-auto">
              Ready to stop preparing alone?
            </h2>
            <p className="text-[14px] sm:text-[16px] text-sky-800/70 leading-relaxed mb-8 max-w-md mx-auto">
              Get matched with a peer preparing for the same role. No credit card. Just accountability.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xs sm:max-w-none mx-auto">
              <ContinueOnAppButton size="hero" />
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/50 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-sky-900 hover:bg-white/70 transition-all active:scale-95"
              >
                Continue on Website
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/40 px-4 sm:px-6 py-10 sm:py-14 bg-white/30 backdrop-blur-md">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div className="max-w-md">
              <Link href="/" className="inline-flex items-center mb-3" aria-label="RoleBuddy home">
                <Image
                  src="/RoleBuddy_LOGO.png"
                  alt="RoleBuddy logo"
                  width={150}
                  height={38}
                  className="h-8 sm:h-9 w-auto object-contain"
                />
              </Link>
              <p className="text-[12px] sm:text-[13px] text-sky-900/80 leading-relaxed mb-3">
                Role-based peer accountability for job preparation. A product owned and operated by{" "}
                <a
                  href="https://www.linkedin.com/company/runtoexe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sky-800 hover:text-sky-950 underline decoration-sky-400 underline-offset-2"
                >
                  RunToExe
                </a>
                .
              </p>
              <div className="rounded-xl border border-white/70 bg-white/50 backdrop-blur-sm p-3.5 text-[11px] sm:text-[12px] text-sky-900/75 leading-relaxed">
                <strong className="text-sky-950 block mb-1">Legal Notice:</strong>
                Warning: Copying this product, concept, workflow, or core business idea to create another platform can lead to strict legal action. All rights and legal titles are reserved under RunToExe, the parent company of RoleBuddy. RoleBuddy is owned and operated by RunToExe, and unauthorized copying, reproduction, or imitation of patented, proprietary, or protected elements is strictly prohibited.
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 sm:gap-8">
              <div>
                <p className="font-black uppercase tracking-widest text-[10px] text-sky-700 mb-3">Product</p>
                <div className="flex flex-col gap-2">
                  <a href="#how" className="text-[12px] text-sky-900/80 hover:text-sky-950 transition-colors">How it works</a>
                  <a href="#features" className="text-[12px] text-sky-900/80 hover:text-sky-950 transition-colors">Features</a>
                  <a href="#compare" className="text-[12px] text-sky-900/80 hover:text-sky-950 transition-colors">Why RoleBuddy</a>
                </div>
              </div>
              <div>
                <p className="font-black uppercase tracking-widest text-[10px] text-sky-700 mb-3">Account</p>
                <div className="flex flex-col gap-2">
                  <Link href="/signup" className="text-[12px] text-sky-900/80 hover:text-sky-950 transition-colors">Sign up free</Link>
                  <Link href="/login" className="text-[12px] text-sky-900/80 hover:text-sky-950 transition-colors">Log in</Link>
                </div>
              </div>
              <div>
                <p className="font-black uppercase tracking-widest text-[10px] text-sky-700 mb-3">Parent Company</p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://www.linkedin.com/company/runtoexe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-sky-900/80 hover:text-sky-950 transition-colors font-medium"
                  >
                    RunToExe LinkedIn
                  </a>
                  <span className="text-[12px] text-sky-700/60">Privacy Policy</span>
                  <span className="text-[12px] text-sky-700/60">Terms of Use</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/50 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] sm:text-[12px] text-sky-900/70">
              &copy; 2026 RoleBuddy. A{" "}
              <a
                href="https://www.linkedin.com/company/runtoexe"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sky-800 hover:text-sky-950 underline"
              >
                RunToExe
              </a>{" "}
              product. All rights reserved.
            </p>
            <a
              href="https://www.linkedin.com/company/runtoexe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/60 bg-white/40 px-3 py-1.5 hover:bg-white/60 transition-all"
              aria-label="RunToExe on LinkedIn"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-800/70">Operated by</span>
              <Image
                src="/rte-logo-2.png"
                alt="RunToExe logo"
                width={90}
                height={26}
                className="h-5 sm:h-6 w-auto object-contain"
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
