"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      
      const response = await fetch(`${apiUrl}/admin/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Неверный email или пароль");
      }

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Ошибка соединения с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-foreground">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-sm text-card-foreground">
        
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-wider text-primary">OMS</h1>
          <p className="text-muted-foreground text-sm mt-2">Панель управления персоналом</p>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Поле Email */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@gmail.com"
              className="w-full px-4 py-3 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors text-sm"
            />
          </div>

          {/* Поле Пароль */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors text-sm"
            />
          </div>

          {/* Кнопка */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-medium rounded-md text-sm transition-opacity cursor-pointer disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? "Авторизация..." : "Войти в систему"}
          </button>
        </form>

      </div>
    </div>
  );
}