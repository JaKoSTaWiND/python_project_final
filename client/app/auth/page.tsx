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

  // Шаг 1: Проверка Email
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

      if (!res.ok) throw new Error(data.error || "Ошибка проверки почты");

      // Точная подгонка под твой бэкенд: "exists" или "new"
      if (data.account_status === "exists") {
        setStep("LOGIN_PASSWORD");
      } else if (data.account_status === "new") {
        toast.info("Код подтверждения сгенерирован");
        setStep("OTP");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Шаг 2: Проверка OTP
  const handleOtpVerify = async (code: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/client/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Твой сериализатор VerifyOPTSerializer ждет ключ 'otp_code'
        body: JSON.stringify({ email, otp_code: code }),
      });
      const data = await res.json();

      // Твой бэкенд возвращает 'opt_status' при ошибке (заметь опечатку "opt_status" в твоей вьюхе)
      if (!res.ok) throw new Error(data.opt_status || data.error || "Неверный код");

      toast.success("Почта подтверждена");
      setStep("REGISTER_PASSWORD");
    } catch (err: any) {
      toast.error(err.message);
      setOtpCode(""); 
    } finally {
      setIsLoading(false);
    }
  };

// Шаг 3: Регистрация (Создание пароля)
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/client/auth/registrtation/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ТЕПЕРЬ ОТПРАВЛЯЕМ ОБА ПОЛЯ ПАРОЛЯ:
        body: JSON.stringify({ 
          email, 
          password, 
          password_confirm: confirmPassword 
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Парсим ошибку, если она пришла массивом полей от Django (как на скриншоте)
        const errorMsg = data.password_confirm?.[0] || data.error || "Ошибка регистрации";
        throw new Error(errorMsg);
      }

      // Твой бэкенд отдает токены внутри объекта 'tokens'
      if (data.tokens?.access) {
        localStorage.setItem("accessToken", data.tokens.access);
        localStorage.setItem("refreshToken", data.tokens.refresh);
      }

      toast.success("Регистрация успешна!");
      router.push("/"); // Редирект на главную
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Шаг 4: Логин
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

      if (!res.ok) throw new Error(data.error || "Неверный пароль");

      if (data.tokens?.access) {
        localStorage.setItem("accessToken", data.tokens.access);
        localStorage.setItem("refreshToken", data.tokens.refresh);
      }

      toast.success("С возвращением!");
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
            {step === "EMAIL" && "Войти в OMS"}
            {step === "OTP" && "Подтверждение почты"}
            {step === "REGISTER_PASSWORD" && "Придумайте пароль"}
            {step === "LOGIN_PASSWORD" && "Введите пароль"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "EMAIL" && "Введите email для входа или регистрации"}
            {step === "OTP" && `Код сгенерирован для ${email}`}
            {step === "REGISTER_PASSWORD" && "Установите надежный пароль"}
            {step === "LOGIN_PASSWORD" && "Введите пароль от вашего аккаунта"}
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
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Продолжить"}
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
                Проверка...
              </div>
            )}

            <button
              onClick={() => setStep("EMAIL")}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Изменить почту
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
                placeholder="Новый пароль"
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
                placeholder="Повторите пароль"
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Регистрация..." : "Завершить регистрацию"}
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
                placeholder="Ваш пароль"
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Вход..." : "Войти"}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("EMAIL")}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Назад к вводу почты
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}