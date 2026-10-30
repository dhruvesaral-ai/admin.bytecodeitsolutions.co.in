"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step 1: Phone number, Step 2: OTP
  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ username: string; role?: { name: string } } | null>(null);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check URL query parameters for redirect errors (e.g. ?error=unauthorized)
  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      setError("Access Restricted: You must be an authorized staff member to access the administration dashboard.");
    }
  }, [searchParams]);

  // Check if already authenticated on initial load
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data?.user && data.user.role?.slug !== "student") {
            setCurrentUser(data.user);
          }
        }
      } catch {
        // Not logged in or session check failed
      } finally {
        setCheckingSession(false);
      }
    }
    void checkAuth();
  }, []);

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanNumber = mobile.replace(/[^0-9]/g, "");
    if (!cleanNumber || cleanNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanNumber,
          callingFrom: "admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setStep(2);
      setResendCooldown(30);
      setSuccessMsg(`OTP sent successfully to +91 ${cleanNumber.slice(-10)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send OTP";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: mobile.replace(/[^0-9]/g, ""),
          otp: cleanOtp,
          callingFrom: "admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      setSuccessMsg("Verification successful! Opening dashboard…");
      setTimeout(() => {
        router.push("/manage");
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: mobile.replace(/[^0-9]/g, ""),
          retrytype: "text",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setResendCooldown(30);
      setSuccessMsg("A new OTP has been sent via SMS.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend OTP";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Logout if user wants to switch account
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setCurrentUser(null);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950 sm:px-6">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-md shadow-indigo-500/20">
            <span className="text-xl font-black text-white">B</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Bytecode IT Solutions
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Staff Admin Portal
          </p>
        </div>

        {/* Already Logged In Card */}
        {!checkingSession && currentUser ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/80">
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                  {currentUser.username.slice(-2)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {currentUser.username}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  {currentUser.role?.name || "Staff Member"} · Active Session
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => router.push("/manage")}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Continue to Dashboard →
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full rounded-xl border border-zinc-200 py-2.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Sign in with another account
              </button>
            </div>
          </div>
        ) : (
          /* Main 2-Step Authentication Form */
          <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {/* Step Indicators */}
            <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    step === 1
                      ? "bg-indigo-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {step === 1 ? "1" : "✓"}
                </span>
                <span
                  className={`text-xs font-medium ${
                    step === 1 ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"
                  }`}
                >
                  Mobile Number
                </span>
              </div>

              <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-700" />

              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    step === 2
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                  }`}
                >
                  2
                </span>
                <span
                  className={`text-xs font-medium ${
                    step === 2 ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"
                  }`}
                >
                  Verify OTP
                </span>
              </div>
            </div>

            {/* Error & Success Feedback Banners */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                {successMsg}
              </div>
            )}

            {/* STEP 1: MOBILE NUMBER FORM */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label
                    htmlFor="mobile-input"
                    className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Registered Staff Phone
                  </label>
                  <div className="relative mt-1.5 flex rounded-xl border border-zinc-200 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950">
                    <span className="inline-flex items-center border-r border-zinc-200 px-3 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                      +91
                    </span>
                    <input
                      id="mobile-input"
                      type="tel"
                      required
                      autoFocus
                      maxLength={10}
                      placeholder="98765 43210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Only authorized staff accounts can receive admin login codes.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:bg-indigo-400"
                >
                  {loading ? "Checking & Sending…" : "Send Verification OTP →"}
                </button>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION FORM */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="otp-input"
                      className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                    >
                      Enter Security Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Change number
                    </button>
                  </div>

                  <div className="mt-1.5">
                    <input
                      id="otp-input"
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      placeholder="• • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-center text-lg font-mono tracking-widest text-zinc-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:bg-indigo-400"
                >
                  {loading ? "Verifying…" : "Verify & Open Dashboard →"}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={() => void handleResendOtp()}
                    className="text-xs font-medium text-zinc-600 transition hover:text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-200 dark:disabled:text-zinc-600"
                  >
                    {resendCooldown > 0
                      ? `Resend OTP in ${resendCooldown}s`
                      : "Didn't receive code? Resend SMS"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Security Notice */}
        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Bytecode IT Solutions Admin System · Protected by Multi-Factor Session Auth
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />}>
      <LoginContent />
    </Suspense>
  );
}
