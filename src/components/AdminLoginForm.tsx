"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import BrandLogo from "@/components/layout/BrandLogo";
import { ADMIN_OTP_LENGTH } from "@/lib/adminOtpConfig";

type Challenge = { email: string; expiresAt: string; resendAvailableAt: string; clockOffset: number };
type Operation = "credentials" | "verify" | "resend" | "cancel";

function readChallenge(data: Record<string, unknown>): Challenge {
  if (data.requiresOtp !== true || typeof data.email !== "string"
    || typeof data.expiresAt !== "string" || !Number.isFinite(Date.parse(data.expiresAt))
    || typeof data.resendAvailableAt !== "string" || !Number.isFinite(Date.parse(data.resendAvailableAt))
    || typeof data.serverTime !== "string" || !Number.isFinite(Date.parse(data.serverTime))) {
    throw new Error("Invalid verification response");
  }
  return {
    email: data.email, expiresAt: data.expiresAt, resendAvailableAt: data.resendAvailableAt,
    clockOffset: Date.parse(data.serverTime) - Date.now(),
  };
}

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [otp, setOtp] = useState("");
  const [operation, setOperation] = useState<Operation | null>(null);
  const [checking, setChecking] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const busy = useRef(false);
  const loading = checking || operation !== null;

  useEffect(() => {
    const controller = new AbortController();
    async function restoreChallenge() {
      try {
        const response = await fetch("/api/auth/otp", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error("Unable to restore verification");
        if (data.requiresOtp) setChallenge(readChallenge(data));
      } catch {
        if (!controller.signal.aborted) setError("Unable to check a pending verification. Please sign in again.");
      } finally {
        if (!controller.signal.aborted) { setChecking(false); setNow(Date.now()); }
      }
    }
    void restoreChallenge();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!challenge) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [challenge]);

  const secondsLeft = challenge ? Math.max(0, Math.ceil((Date.parse(challenge.expiresAt) - now - challenge.clockOffset) / 1_000)) : 0;
  const resendWait = challenge ? Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAt) - now - challenge.clockOffset) / 1_000)) : 0;

  async function perform(action: Operation) {
    if (busy.current || checking) return;
    busy.current = true;
    setError("");
    setOperation(action);
    let signedIn = false;
    try {
      const path = action === "credentials" ? "/api/auth/login"
        : action === "resend" ? "/api/auth/otp/resend" : "/api/auth/otp";
      const res = await fetch(path, {
        method: action === "cancel" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify(action === "credentials" ? { email, password } : action === "verify" ? { otp } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.restart) { setChallenge(null); setOtp(""); setPassword(""); setShowPassword(false); }
        if (action === "resend" && res.status === 429 && challenge) {
          const retryAfter = Number(res.headers.get("Retry-After"));
          if (Number.isFinite(retryAfter) && retryAfter > 0) {
            setChallenge({ ...challenge, resendAvailableAt: new Date(Date.now() + challenge.clockOffset + retryAfter * 1_000).toISOString() });
          }
        }
        setError(typeof data.error === "string" ? data.error : "Unable to sign in. Please try again.");
        return;
      }
      if (action === "cancel") {
        if (data.success !== true) throw new Error("Invalid response");
        setChallenge(null); setOtp(""); setPassword(""); setShowPassword(false);
      } else if (action === "verify") {
        if (data.success !== true) throw new Error("Invalid response");
        router.replace("/admin");
        router.refresh();
        signedIn = true;
      } else {
        setChallenge(readChallenge(data));
        setPassword("");
        setShowPassword(false);
        setOtp("");
        setNow(Date.now());
      }
    } catch {
      setError("Unable to complete the request. Please try again.");
    } finally {
      if (!signedIn) { busy.current = false; setOperation(null); }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void perform(challenge ? "verify" : "credentials");
  };

  return (
    <div className="min-h-[80dvh] sm:min-h-[80vh] flex items-center justify-center px-4 py-6 sm:py-0">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo size="lg" className="mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {challenge ? "Verify your login" : "Admin Login"}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {challenge ? "Check your email for your verification code" : "Sign in to manage your products"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-4 sm:p-8 space-y-5">
              {error && (
                <div role="alert" className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {challenge ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    We sent an {ADMIN_OTP_LENGTH}-digit code to <strong className="break-all">{challenge.email}</strong>.
                  </p>
                  <div>
                    <label htmlFor="admin-login-otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Verification code
                    </label>
                    <Input
                      id="admin-login-otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      pattern={`[0-9]{${ADMIN_OTP_LENGTH}}`}
                      minLength={ADMIN_OTP_LENGTH}
                      maxLength={ADMIN_OTP_LENGTH}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, ADMIN_OTP_LENGTH))}
                      required
                      disabled={loading || secondsLeft === 0}
                      placeholder="Enter your code"
                      aria-describedby="admin-otp-expiry"
                      className="text-center text-xl tracking-[0.25em]"
                    />
                    <p id="admin-otp-expiry" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {secondsLeft > 0 ? `Code expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}.` : "Your code has expired. Sign in again to request a new code."}
                    </p>
                  </div>
                  <Button type="submit" disabled={loading || otp.length !== ADMIN_OTP_LENGTH || secondsLeft === 0} className="w-full">
                    {operation === "verify" ? "Verifying..." : "Verify & Sign In"}
                  </Button>
                  <Button variant="outline" disabled={loading || resendWait > 0 || secondsLeft === 0} className="w-full" onClick={() => void perform("resend")}>
                    {operation === "resend" ? "Sending..." : resendWait > 0 ? `Resend code in ${resendWait}s` : "Resend code"}
                  </Button>
                  <Button variant="ghost" disabled={loading} className="w-full" onClick={() => void perform("cancel")}>
                    {operation === "cancel" ? "Please wait..." : "Back to sign in"}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="admin-login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email
                    </label>
                    <Input
                      id="admin-login-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      maxLength={254}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="admin@3difybd.com"
                      className="text-base"
                    />
                  </div>

                  <div>
                    <label htmlFor="admin-login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="admin-login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        maxLength={1024}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="••••••••"
                        className="pr-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((previous) => !previous)}
                        disabled={loading}
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {checking ? "Checking verification..." : operation === "credentials" ? "Sending code..." : "Continue"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
