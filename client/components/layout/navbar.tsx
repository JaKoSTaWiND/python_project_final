"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, LogIn } from "lucide-react";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Логика фильтрации/поиска товаров на витрине
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background text-foreground backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* ЛЕВАЯ ЧАСТЬ: Логотип OMS */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="font-mono text-3xl font-black tracking-tighter transition-opacity hover:opacity-80 font-size-30"
          >
            OMS
          </Link>
        </div>

        {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ: Поле ввода (Поиск) */}
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
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </form>
        </div>

        {/* СПРАВА: Корзина и Кнопка Login */}
        <div className="flex items-center gap-4">
          {/* Иконка корзины */}
          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            {/* Опциональный бейдж количества товаров (пока захардкожен) */}
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground">
              0
            </span>
          </Link>

          {/* Кнопка Login */}
          <button
            onClick={() => console.log("Open login modal/page")}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            Login
          </button>
        </div>

      </div>
    </header>
  );
}