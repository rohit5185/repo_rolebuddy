import type { ReactNode } from "react";
import Image from "next/image";
import { InstallButton } from "@/components/InstallPrompt";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden rb-app-bg p-3 text-[#1b1b24] sm:p-6">
      {/* Blobs are provided by rb-app-bg — add extra auth-specific accent */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-[45vw] w-[45vw] rounded-full bg-white/20 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-[40vw] w-[40vw] rounded-full bg-[rgba(59,42,225,0.15)] blur-[80px]" />

      <section className="relative z-10 w-full max-w-lg">
        {/* Brand mark */}
        <div className="mb-5 text-center sm:mb-7">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(59,42,225,0.20)]">
            <Image
              src="/logo.png"
              alt="RoleBuddy"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <p className="font-headline text-xl font-black tracking-tight text-white drop-shadow-sm">RoleBuddy</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 mt-0.5">Peer Accountability Platform</p>
        </div>

        {/* Card */}
        <div className="relative space-y-5 overflow-hidden rounded-2xl border border-white/30 bg-white/85 p-5 shadow-[0_24px_64px_rgba(59,42,225,0.18)] backdrop-blur-2xl sm:space-y-6 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[rgba(59,42,225,0.06)] blur-3xl" />
          {children}
        </div>

        {/* Install app button — shown when installable */}
        <div className="mt-4 flex items-center justify-center">
          <InstallButton
            className="flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/30 transition-all"
          />
        </div>

        {/* Footer links */}
        <div className="mt-3 text-center">
          <p className="flex items-center justify-center gap-4 text-[9px] font-medium uppercase tracking-widest text-white/60">
            <span>Privacy</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span>Terms</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span>RoleBuddy v1.0</span>
          </p>
        </div>
      </section>
    </main>
  );
}
