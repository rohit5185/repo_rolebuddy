"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { getProfile, login, signup, sendOtp, verifyOtp } from "./auth.api";
import { subscribeToNotifications } from "@/features/notifications/notifications.api";
import { validateEmail, validatePassword } from "./auth.validators";

type Mode = "login" | "signup";
type AuthTab = "password" | "otp";
type OtpStep = "enter_email" | "enter_code";

type AuthFormProps = {
  mode: Mode;
};

type FieldErrors = {
  email?: string;
  password?: string;
  otp?: string;
  form?: string;
};

// ── Dot-Pulse Loader ─────────────────────────────────────────────────────────

function DotPulse() {
  return (
    <span className="rb-dot-pulse" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}

// ── OTP 6-digit input ─────────────────────────────────────────────────────────

function OtpBoxInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, "").slice(0, 6).split("");

  function handleChange(index: number, rawValue: string) {
    // Strip non-digits, take only last char typed
    const cleaned = rawValue.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    const next = newDigits.join("").slice(0, 6);
    onChange(next);
    if (cleaned && index < 5) {
      setTimeout(() => inputsRef.current[index + 1]?.focus(), 0);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Clear current
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      } else if (index > 0) {
        // Move to previous and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputsRef.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, 5);
      setTimeout(() => inputsRef.current[focusIndex]?.focus(), 0);
    }
    e.preventDefault();
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          value={digits[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          className={`rb-otp-input${digits[i] ? " filled" : ""}`}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ── Privacy/Terms Modal ───────────────────────────────────────────────────────

function PolicyModal({ type, onClose }: { type: "privacy" | "terms"; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-[rgba(199,196,217,0.5)] bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-lg font-black text-[#1b1b24]">
            {type === "privacy" ? "Privacy Policy" : "Terms of Service"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4f3fb] text-[#777588] hover:bg-[#eae8f7]"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3 text-sm text-[#464556] leading-6">
          {type === "privacy" ? (
            <>
              <p><strong>Data we collect:</strong> Your email address, onboarding responses (role, experience, goals), and daily check-in activity.</p>
              <p><strong>How we use it:</strong> To match you with accountability partners, track your preparation streaks, and deliver the core RoleBuddy experience.</p>
              <p><strong>We never sell your data.</strong> We do not share your personal information with third parties for advertising purposes.</p>
              <p><strong>Anonymous display names:</strong> You interact with partners using generated display names — your email is never exposed to other users.</p>
              <p><strong>Data deletion:</strong> You may request account deletion at any time by contacting support. All your data will be removed within 30 days.</p>
              <p className="text-[11px] text-[#777588]">Last updated: May 2026 · RoleBuddy v1.0</p>
            </>
          ) : (
            <>
              <p><strong>Use of service:</strong> RoleBuddy is a peer accountability platform for job preparation. You agree to use it in good faith and not to harass, spam, or misuse any feature.</p>
              <p><strong>Account responsibility:</strong> You are responsible for maintaining the security of your account credentials.</p>
              <p><strong>Content:</strong> Messages and check-ins you submit remain your property. By submitting, you grant RoleBuddy the right to display them within your paired conversations.</p>
              <p><strong>Termination:</strong> We reserve the right to suspend accounts that violate community trust, including abuse of the exchange or interview systems.</p>
              <p><strong>No guarantees:</strong> RoleBuddy does not guarantee job placement or interview success. Results depend on your consistent effort.</p>
              <p className="text-[11px] text-[#777588]">Last updated: May 2026 · RoleBuddy v1.0</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main AuthForm ─────────────────────────────────────────────────────────────

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("enter_email");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [policy, setPolicy] = useState<"privacy" | "terms" | null>(null);

  const content = useMemo(() => {
    if (mode === "signup") {
      return {
        title: "Create Account",
        subtitle: "Join RoleBuddy and start your accountability journey.",
        submitLabel: "Get Started",
        switchText: "Already have an account?",
        switchAction: "Sign in",
        switchHref: "/login"
      };
    }
    return {
      title: "Welcome Back",
      subtitle: "Sign in to continue your preparation streak.",
      submitLabel: "Sign In",
      switchText: "Don't have an account?",
      switchAction: "Sign up free",
      switchHref: "/signup"
    };
  }, [mode]);

  async function afterAuth() {
    // Request push notification permission right after auth — industry standard
    // moment to ask (user just showed intent). Fire-and-forget: doesn't block nav.
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      Notification.permission === "default"
    ) {
      void subscribeToNotifications().catch(() => {});
    }
    try {
      const profileResponse = await getProfile();
      const nextPath = profileResponse.data.user.onboardingCompleted ? "/dashboard" : "/onboarding";
      router.push(nextPath);
    } catch {
      router.push("/onboarding");
    }
    router.refresh();
  }

  // ── Password submit ─────────────────────────────────────────────────────────

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }

    setLoading(true);
    setErrors({});
    try {
      await (mode === "signup"
        ? signup({ email, password })
        : login({ email, password }));
      await afterAuth();
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // ── OTP submit — send ───────────────────────────────────────────────────────

  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailError = validateEmail(otpEmail);
    if (emailError) { setErrors({ email: emailError }); return; }

    setLoading(true);
    setErrors({});
    try {
      await sendOtp(otpEmail);
      setOtpStep("enter_code");
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Failed to send OTP." });
    } finally {
      setLoading(false);
    }
  }

  // ── OTP submit — verify ─────────────────────────────────────────────────────

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otpCode.length !== 6) { setErrors({ otp: "Enter all 6 digits." }); return; }

    setLoading(true);
    setErrors({});
    try {
      await verifyOtp(otpEmail, otpCode);
      await afterAuth();
    } catch (error) {
      setErrors({ otp: error instanceof Error ? error.message : "Invalid or expired OTP." });
    } finally {
      setLoading(false);
    }
  }

  // ── Google redirect ─────────────────────────────────────────────────────────

  function handleGoogleSignIn() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";
    window.location.href = `${apiBase}/auth/google`;
  }

  return (
    <>
      {policy && <PolicyModal type={policy} onClose={() => setPolicy(null)} />}

      <header className="relative space-y-1">
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-[#1b1b24] sm:text-3xl">{content.title}</h1>
        <p className="font-body text-xs text-[#464556] opacity-80 sm:text-sm">{content.subtitle}</p>
      </header>

      {/* Auth method tabs */}
      <div className="flex rounded-xl border border-[rgba(199,196,217,0.5)] bg-[#f4f3fb] p-1">
        <button
          type="button"
          onClick={() => { setTab("password"); setErrors({}); }}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
            tab === "password"
              ? "bg-white text-[#3b2ae1] shadow-sm"
              : "text-[#464556] hover:text-[#1b1b24]"
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => { setTab("otp"); setErrors({}); setOtpStep("enter_email"); }}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
            tab === "otp"
              ? "bg-white text-[#3b2ae1] shadow-sm"
              : "text-[#464556] hover:text-[#1b1b24]"
          }`}
        >
          OTP Login
        </button>
      </div>

      {/* ── Password tab ── */}
      {tab === "password" && (
        <div className="space-y-4 sm:space-y-5">
          <form className="space-y-4 sm:space-y-5" onSubmit={handlePasswordSubmit} noValidate>
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <p className="pt-1 text-xs text-[#ba1a1a]">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex items-end justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-[10px] font-bold text-[#3b2ae1] hover:opacity-70"
                    onClick={() => { setTab("otp"); setErrors({}); setOtpStep("enter_email"); }}
                  >
                    Use OTP instead
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && <p className="pt-1 text-xs text-[#ba1a1a]">{errors.password}</p>}
            </div>

            {errors.form && <p className="text-sm text-[#ba1a1a]">{errors.form}</p>}

            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-[#3b2ae1] font-label text-sm font-bold text-white shadow-[0_4px_16px_rgba(59,42,225,0.25)] transition-all hover:bg-[#2d1fc7] hover:scale-[1.01] sm:h-14 disabled:opacity-70"
              disabled={loading}
            >
              {loading ? <DotPulse /> : content.submitLabel}
            </Button>
          </form>

          <div className="flex items-center gap-4 py-1">
            <div className="h-[1px] flex-1 bg-[#c7c4d9]/35" />
            <span className="font-label text-[9px] font-bold uppercase tracking-[0.2em] text-[#c7c4d9]">or</span>
            <div className="h-[1px] flex-1 bg-[#c7c4d9]/35" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[rgba(199,196,217,0.7)] bg-white text-sm font-semibold text-[#1b1b24] transition-colors hover:bg-[#f9f8fe] sm:h-14"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      )}

      {/* ── OTP tab ── */}
      {tab === "otp" && (
        <div className="space-y-4">
          {otpStep === "enter_email" ? (
            <form className="space-y-4" onSubmit={handleSendOtp} noValidate>
              <div className="space-y-1">
                <Label htmlFor="otp-email">Email Address</Label>
                <Input
                  id="otp-email"
                  type="email"
                  placeholder="name@example.com"
                  value={otpEmail}
                  onChange={(e) => { setOtpEmail(e.target.value); setErrors({}); }}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && <p className="pt-1 text-xs text-[#ba1a1a]">{errors.email}</p>}
              </div>
              <p className="text-xs text-[#777588]">
                We&apos;ll send a 6-digit code to your email. No password needed.
              </p>
              {errors.form && <p className="text-sm text-[#ba1a1a]">{errors.form}</p>}
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#3b2ae1] font-label text-sm font-bold text-white shadow-[0_4px_16px_rgba(59,42,225,0.25)] transition-all hover:bg-[#2d1fc7] disabled:opacity-70"
                disabled={loading}
              >
                {loading ? <DotPulse /> : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleVerifyOtp} noValidate>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#1b1b24]">Enter the 6-digit code</p>
                <p className="text-xs text-[#777588] mt-1">Sent to <strong>{otpEmail}</strong> · valid for 10 min</p>
              </div>
              <OtpBoxInput value={otpCode} onChange={(v) => { setOtpCode(v); setErrors({}); }} />
              {errors.otp && <p className="text-center text-xs text-[#ba1a1a]">{errors.otp}</p>}
              {errors.form && <p className="text-center text-sm text-[#ba1a1a]">{errors.form}</p>}
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#3b2ae1] font-label text-sm font-bold text-white shadow-[0_4px_16px_rgba(59,42,225,0.25)] transition-all hover:bg-[#2d1fc7] disabled:opacity-70"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? <DotPulse /> : "Verify & Sign In"}
              </Button>
              <button
                type="button"
                onClick={() => { setOtpStep("enter_email"); setOtpCode(""); setErrors({}); }}
                className="w-full text-center text-xs text-[#777588] hover:text-[#3b2ae1]"
              >
                ← Change email or resend
              </button>
            </form>
          )}
        </div>
      )}

      <footer className="pt-1 text-center">
        <p className="font-body text-xs text-[#464556]">
          {content.switchText}
          <Link href={content.switchHref} className="ml-1 font-bold text-[#3b2ae1] hover:underline">
            {content.switchAction}
          </Link>
        </p>
        <p className="mt-2 text-[9px] text-[#aaa]">
          By continuing, you agree to our{" "}
          <button type="button" onClick={() => setPolicy("terms")} className="underline hover:text-[#3b2ae1]">Terms</button>
          {" "}and{" "}
          <button type="button" onClick={() => setPolicy("privacy")} className="underline hover:text-[#3b2ae1]">Privacy Policy</button>.
        </p>
      </footer>
    </>
  );
}
