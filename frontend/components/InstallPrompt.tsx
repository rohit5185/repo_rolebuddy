"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

type Platform = "android" | "ios" | "other";

type InstallContextValue = {
  canInstall: boolean;
  isStandalone: boolean;
  platform: Platform;
  isInstalling: boolean;
  install: () => Promise<void>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent;
  if (/iP(hone|ad|od)/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

// ── Context ───────────────────────────────────────────────────────────────────

const InstallContext = createContext<InstallContextValue>({
  canInstall: false,
  isStandalone: false,
  platform: "other",
  isInstalling: false,
  install: async () => {}
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function PWAInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("other");
  const [standalone, setStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    setStandalone(checkIsStandalone());
    setPlatform(detectPlatform());

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore SW registration failures so the app still works without PWA support.
      });
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
    } catch {
      /* silent */
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  const canInstall = !standalone && (platform === "ios" || Boolean(deferredPrompt));

  return (
    <InstallContext.Provider value={{ canInstall, isStandalone: standalone, platform, isInstalling, install }}>
      {children}
    </InstallContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useInstallPrompt() {
  return useContext(InstallContext);
}

// ── Inline Install Button — shown only when app is installable ────────────────
//
// Hides automatically when:
//   • App is already installed (standalone mode)
//   • Browser hasn't fired beforeinstallprompt yet
//
// On click:
//   • Android / Desktop Chrome → fires native install prompt directly
//   • iOS Safari → shows share guide (programmatic install not possible on iOS)

export function InstallButton({ className }: { className?: string }) {
  const { canInstall, platform, isInstalling, install } = useInstallPrompt();
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Only show when the browser says the app can be installed
  if (!canInstall) return null;

  if (platform === "ios") {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIosGuide(true)}
          className={className ?? "flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white"}
        >
          <Download className="h-3.5 w-3.5" />
          Install App
        </button>

        {showIosGuide && (
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center p-4"
            onClick={() => setShowIosGuide(false)}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div
              className="relative z-10 w-full max-w-sm rounded-2xl border border-white/30 bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-xl shadow shrink-0">
                  <Image src="/icons/icon-192.png" alt="RoleBuddy" width={40} height={40} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-[#1b1b24]">Install RoleBuddy</p>
                  <p className="text-xs text-[#777588]">Add to Home Screen</p>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-[#464556]">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3b2ae1] text-[10px] font-bold text-white mt-0.5">1</span>
                  Tap the <Share className="mx-1 inline h-4 w-4 text-[#3b2ae1] relative -top-0.5" /> Share button in Safari
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3b2ae1] text-[10px] font-bold text-white mt-0.5">2</span>
                  Scroll down and tap <strong className="text-[#1b1b24]">&ldquo;Add to Home Screen&rdquo;</strong>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3b2ae1] text-[10px] font-bold text-white mt-0.5">3</span>
                  Tap <strong className="text-[#1b1b24]">&ldquo;Add&rdquo;</strong> — done!
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="mt-4 w-full rounded-xl border border-[rgba(199,196,217,0.55)] py-2.5 text-sm font-semibold text-[#777588] hover:bg-[#f4f3fb]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Android / Desktop — fire native install prompt directly on click
  return (
    <button
      type="button"
      id="pwa-install-btn"
      onClick={() => void install()}
      disabled={isInstalling}
      className={className ?? "flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white disabled:opacity-50"}
    >
      <Download className="h-3.5 w-3.5" />
      {isInstalling ? "Installing…" : "Install App"}
    </button>
  );
}

// ── Legacy export (no longer renders a popup — kept for any remaining imports) ──

export function InstallPrompt() {
  return null;
}
