"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Compass,
  MessageSquareText,
  User,
  LogOut,
  LoaderCircle,
  Flame,
} from "lucide-react";
import Image from "next/image";

import { logout } from "@/features/profile";
import { NotificationBell } from "./NotificationBell";

type AppLayoutProps = {
  children: React.ReactNode;
  /** Optional: streak count to show in header */
  streakCount?: number | null;
  /** Optional: user's role label */
  userRole?: string | null;
};

// ── Navigation config ─────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Discover", href: "/discovery", icon: Compass },
  { label: "Chat", href: "/chat", icon: MessageSquareText },
  { label: "Profile", href: "/profile", icon: User },
] as const;

// Desktop nav excludes Profile (it's in the dropdown)
const DESKTOP_NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Discovery", href: "/discovery", icon: Compass },
  { label: "Chat", href: "/chat", icon: MessageSquareText },
] as const;

// ── AppLayout ──────────────────────────────────────────────────────────────────

export function AppLayout({ children, streakCount, userRole }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="rb-app-bg text-[#1b1b24] flex flex-col">

      {/* ─────────────────────────────────────────────────────────────────────
          DESKTOP HEADER  (visible on md+, hidden on mobile)
          ───────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/55 backdrop-blur-xl hidden md:block">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">

          {/* Wordmark */}
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 group"
            aria-label="Go to dashboard"
          >
            <div className="h-7 w-7 overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
              <Image src="/icons/icon-192.png" alt="RoleBuddy" width={28} height={28} className="h-full w-full object-cover" priority />
            </div>
            <span className="font-headline text-[15px] font-black tracking-tight text-[#1b1b24]">
              RoleBuddy
            </span>
          </button>

          {/* Nav Links — desktop */}
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {DESKTOP_NAV_LINKS.map(({ label, href, icon: Icon }) => (
              <button
                key={href}
                type="button"
                onClick={() => router.push(href)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  isActive(href)
                    ? "bg-[rgba(59,42,225,0.08)] text-[#3b2ae1]"
                    : "text-[#777588] hover:bg-[#f4f3fb] hover:text-[#1b1b24]"
                }`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Streak badge */}
            {typeof streakCount === "number" && streakCount > 0 && (
              <div className="flex items-center gap-1 rounded-full border border-[rgba(199,196,217,0.55)] bg-[#f9f8fe] px-2.5 py-1 text-[11px] font-bold text-[#1b1b24]">
                <Flame className="h-3 w-3 text-orange-500" />
                {streakCount}
              </div>
            )}

            {/* Role chip */}
            {userRole && (
              <div className="hidden rounded-full border border-[rgba(199,196,217,0.55)] bg-[#f9f8fe] px-2.5 py-1 text-[11px] font-medium text-[#777588] lg:block truncate max-w-[140px]">
                {userRole}
              </div>
            )}

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="app-header-profile-btn"
                type="button"
                aria-label="Profile menu"
                aria-expanded={dropdownOpen}
                onClick={() => setDropdownOpen((p) => !p)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(199,196,217,0.55)] bg-[rgba(59,42,225,0.08)] text-[#3b2ae1] transition-all hover:bg-[#3b2ae1] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b2ae1]"
              >
                <User className="h-4 w-4" />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 z-50 min-w-[168px] rounded-xl border border-[rgba(199,196,217,0.55)] bg-white py-1 shadow-[0_2px_12px_rgba(59,42,225,0.06),0_1px_3px_rgba(0,0,0,0.04)]"
                  >
                    <button
                      id="app-header-profile-link"
                      type="button"
                      onClick={() => { setDropdownOpen(false); router.push("/profile"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#1b1b24] hover:bg-[#f9f8fe] transition-colors"
                    >
                      <User className="h-4 w-4 text-[#3b2ae1]" />
                      Profile
                    </button>
                    <div className="mx-3 my-1 border-t border-[rgba(199,196,217,0.55)]" />
                    <button
                      id="app-header-logout-btn"
                      type="button"
                      onClick={() => { setDropdownOpen(false); void handleLogout(); }}
                      disabled={isLoggingOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#b54b36] hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {isLoggingOut ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────
          MOBILE HEADER  (visible on < md, compact app-style)
          ───────────────────────────────────────────────────────────────────── */}
      <header
        className="
          sticky top-0 z-50
          flex items-center justify-between
          h-[52px] px-4
          border-b border-white/60
          bg-white/70 backdrop-blur-xl
          md:hidden
        "
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Left: Brand */}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2"
          aria-label="Go to dashboard"
        >
          <div className="h-7 w-7 overflow-hidden rounded-lg shadow-sm">
            <Image src="/icons/icon-192.png" alt="RoleBuddy" width={28} height={28} className="h-full w-full object-cover" priority />
          </div>
          <span className="font-headline text-[15px] font-black tracking-tight text-[#1b1b24]">
            RoleBuddy
          </span>
        </button>

        {/* Right: Streak + Profile */}
        <div className="flex items-center gap-2">
          {typeof streakCount === "number" && streakCount > 0 && (
            <div className="flex items-center gap-1 rounded-full border border-[rgba(199,196,217,0.55)] bg-[#f9f8fe] px-2 py-0.5 text-[11px] font-bold text-[#1b1b24]">
              <Flame className="h-3 w-3 text-orange-500" />
              {streakCount}
            </div>
          )}

          {/* Mobile: dropdown for profile/logout */}
          <NotificationBell />
          <div className="relative" ref={dropdownRef}>
            <button
              id="app-mobile-profile-btn"
              type="button"
              aria-label="Profile menu"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((p) => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(199,196,217,0.55)] bg-[rgba(59,42,225,0.08)] text-[#3b2ae1] transition-all active:bg-[#3b2ae1] active:text-white"
            >
              <User className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-50 min-w-[168px] rounded-xl border border-[rgba(199,196,217,0.55)] bg-white py-1 shadow-[0_4px_20px_rgba(59,42,225,0.10),0_1px_3px_rgba(0,0,0,0.04)]"
                >
                  <button
                    id="app-mobile-profile-link"
                    type="button"
                    onClick={() => { setDropdownOpen(false); router.push("/profile"); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#1b1b24] hover:bg-[#f9f8fe] transition-colors"
                  >
                    <User className="h-4 w-4 text-[#3b2ae1]" />
                    Profile
                  </button>
                  <div className="mx-3 my-1 border-t border-[rgba(199,196,217,0.55)]" />
                  <button
                    id="app-mobile-logout-btn"
                    type="button"
                    onClick={() => { setDropdownOpen(false); void handleLogout(); }}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#b54b36] hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────
          PAGE CONTENT
          ───────────────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ─────────────────────────────────────────────────────────────────────
          MOBILE FLOATING BOTTOM NAV  (md:hidden)
          ───────────────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Bottom navigation"
        className="rb-floating-nav md:hidden"
      >
        {NAV_LINKS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <button
              key={href}
              type="button"
              onClick={() => router.push(href)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`rb-floating-nav-item${active ? " active" : ""}`}
            >
              {active && (
                <motion.div
                  layoutId="floating-nav-active"
                  className="absolute inset-0 rounded-full bg-[rgba(59,42,225,0.10)]"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  aria-hidden
                />
              )}
              <Icon
                className="rb-nav-icon relative z-10"
                strokeWidth={active ? 2.3 : 1.8}
                aria-hidden
              />
              <span className="rb-nav-label relative z-10">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer so page content isn't hidden behind the floating nav on mobile */}
      <div className="h-[calc(88px+env(safe-area-inset-bottom,0px))] md:hidden" aria-hidden />
    </div>
  );
}
