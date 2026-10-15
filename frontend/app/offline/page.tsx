import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're Offline — RoleBuddy",
  description: "No internet connection. RoleBuddy needs a connection to sync your progress."
};

export default function OfflinePage() {
  return (
    <main className="flex h-[100dvh] flex-col items-center justify-center gap-6 bg-[#f9f8fe] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(59,42,225,0.14)]">
        <Image src="/logo.png" alt="RoleBuddy" width={64} height={64} className="object-contain" priority />
      </div>
      <div className="max-w-xs space-y-2">
        <h1 className="font-headline text-2xl font-black text-[#1b1b24]">You&apos;re offline</h1>
        <p className="text-sm leading-6 text-[#464556]">
          RoleBuddy needs a connection to sync your streak and partner data. Check your internet and try again.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-xl bg-[#3b2ae1] px-6 text-sm font-bold text-white shadow-[0_4px_16px_rgba(59,42,225,0.22)] transition hover:bg-[#2d1fc7]"
      >
        Retry
      </Link>
    </main>
  );
}
