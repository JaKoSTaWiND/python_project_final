"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, LogIn, User, LogOut } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { apiFetch } from "@/lib/api";

interface UserInfo {
  id: number;
  email: string;
  username: string;
}

export default function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Проверяем авторизацию при загрузке страницы
  useEffect(() => {
    const checkAuth = async () => {
      // ИСПРАВЛЕНО: Читаем ровно тот camelCase ключ, который лежит в твоем браузере
      const token = localStorage.getItem("accessToken"); 
      
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        // ИСПРАВЛЕНО: Добавлен префикс /client/, чтобы путь совпал с Django urls.py
        const res = await apiFetch("/client/users/me/");
        
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          console.error("Бэкенд отклонил токен, статус:", res.status);
          setUser(null);
        }
      } catch (err) {
        console.error("Ошибка при проверке профиля:", err);
        setUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  const handleLogout = () => {
    // ИСПРАВЛЕНО: Очищаем именно те camelCase ключи, которые создавала AuthPage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background text-foreground backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* ЛЕВАЯ ЧАСТЬ: Логотип OMS */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="font-mono text-3xl font-black tracking-tighter transition-opacity hover:opacity-80"
          >
            OMS
          </Link>
        </div>

        {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ: Поиск */}
        <div className="flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="search"
              placeholder="Search products, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-none border border-input bg-background py-2 pl-9 pr-4 text-sm focus-visible:outline-none focus-visible:border-foreground"
            />
          </form>
        </div>

        {/* СПРАВА: Корзина и Динамический блок авторизации */}
        <div className="flex items-center gap-4">
          
          {/* Иконка корзины */}
          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-none border border-input bg-background hover:bg-accent transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
          </Link>

          {/* ДИНАМИЧЕСКИЙ БЛОК АВТОРИЗАЦИИ */}
          {isCheckingAuth ? (
            <div className="h-9 w-20 bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-none border border-input bg-background hover:bg-accent transition-colors cursor-pointer focus:outline-none">
                  <User className="h-4 w-4" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content 
                  align="end" 
                  sideOffset={8}
                  className="z-50 min-w-[160px] overflow-hidden rounded-none border border-border bg-popover p-1 text-popover-foreground shadow-md"
                >
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
                    {user.username || user.email}
                  </div>

                  <DropdownMenu.Item 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-2 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-none cursor-pointer focus:outline-none select-none"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Выйти</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <Link
              href="/auth"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-none bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 shadow-sm"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}