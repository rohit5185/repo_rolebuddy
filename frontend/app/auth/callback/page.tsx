"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import { getProfile } from "@/features/auth/auth.api";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const next = searchParams.get("next") ?? "/dashboard";
    const googleError = searchParams.get("google_error");

    if (googleError) {
      router.replace(`/login?error=${encodeURIComponent("Google sign-in was cancelled or failed.")}`);
      return;
    }

    async function verifyAndRedirect() {
      try {
        // Mirror the token (passed in the redirect URL from the backend) to the
        // Vercel-domain cookie so the Next.js middleware can see the session.
        const token = searchParams.get("token");
        if (token) {
          // Store for mobile Bearer fallback
          try { localStorage.setItem("rb_access_token", token); } catch { /* private mode */ }
          // Mirror to Vercel HttpOnly cookie (read by middleware.ts)
          try {
            await fetch("/api/auth/set-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });
          } catch {
            // Non-fatal — Bearer header fallback still works for API calls
          }
        }
        await getProfile();
        router.replace(next);
      } catch (err) {
        console.error("Auth callback verification failed:", err);
        router.replace(`/login?error=${encodeURIComponent("Failed to verify authentication session. Please make sure cookies are enabled.")}`);
      }
    }

    void verifyAndRedirect();
  }, [router, searchParams]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <main className="flex h-[100dvh] flex-col items-center justify-center gap-5 bg-[#f9f8fe]">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(59,42,225,0.16)]">
        <Image src="/logo.png" alt="RoleBuddy" width={56} height={56} className="object-contain" priority />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="rb-dot-pulse text-[#3b2ae1]">
          <span /><span /><span />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#777588]">Signing you in…</p>
      </div>
      <Suspense>
        <AuthCallbackInner />
      </Suspense>
    </main>
  );
}
