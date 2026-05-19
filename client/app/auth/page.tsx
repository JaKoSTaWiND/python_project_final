"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type AuthStep = "EMAIL" | "OTP" | "REGISTER_PASSWORD" | "LOGIN_PASSWORD";

const BACKEND_URL = "http://localhost:8000";

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("EMAIL");
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/client/auth/email-check/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Email verification error");

      if (data.account_status === "exists") {
        setStep("LOGIN_PASSWORD");
      } else if (data.account_status === "new") {
        toast.info("Confirmation code generated");
        setStep("OTP");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (code: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/client/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: code }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.opt_status || data.error || "Invalid code");

      toast.success("Email accepted");
      setStep("REGISTER_PASSWORD");
    } catch (err: any) {
      toast.error(err.message);
      setOtpCode(""); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords are not equal");
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/client/auth/registrtation/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          password_confirm: confirmPassword 
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.password_confirm?.[0] || data.error || "Error";
        throw new Error(errorMsg);
      }

      if (data.tokens?.access) {
        localStorage.setItem("access_token", data.tokens.access);
        localStorage.setItem("refresh_token", data.tokens.refresh);
      }

      toast.success("Success registration");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/client/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Invalid password");

      if (data.tokens?.access) {
        localStorage.setItem("accessToken", data.tokens.access);
        localStorage.setItem("refreshToken", data.tokens.refresh);
      }

      router.push("/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-md border border-input p-8 bg-background shadow-sm">
        
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            {step === "EMAIL" && "Enter OMS"}
            {step === "OTP" && "Email confirmation"}
            {step === "REGISTER_PASSWORD" && "Create a password"}
            {step === "LOGIN_PASSWORD" && "Enter your password"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "EMAIL" && "Enter your email to log in or register"}
            {step === "OTP" && `Code generated for ${email}`}
            {step === "REGISTER_PASSWORD" && "Set a strong password"}
            {step === "LOGIN_PASSWORD" && "Enter your account password"}
          </p>
        </div>

        {step === "EMAIL" && (
          <form onSubmit={handleEmailCheck} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}

        {step === "OTP" && (
          <div className="flex flex-col items-center space-y-6">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={(value) => {
                setOtpCode(value);
                if (value.length === 6) handleOtpVerify(value);
              }}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Check...
              </div>
            )}

            <button
              onClick={() => setStep("EMAIL")}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Change email
            </button>
          </div>
        )}

        {step === "REGISTER_PASSWORD" && (
          <form onSubmit={handleRegistration} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Registration..." : "Sign Up"}
            </button>
          </form>
        )}

        {step === "LOGIN_PASSWORD" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Entering..." : "Enter"}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("EMAIL")}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Back to entering email
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}