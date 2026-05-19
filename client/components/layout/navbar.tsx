"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, LogIn, User, LogOut, Package } from "lucide-react";
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

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken"); 
      
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const res = await apiFetch("/client/users/me/");
        
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          console.error("The backend rejected the token, status:", res.status);
          setUser(null);
        }
      } catch (err) {
        console.error("Error verifying profile:", err);
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
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background text-foreground backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center">
          <Link 
            href="/" 
            className="font-mono text-3xl font-black tracking-tighter transition-opacity hover:opacity-80"
          >
            OMS
          </Link>
        </div>

        <div className="flex items-center gap-4">
          
          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-none border border-input bg-background hover:bg-accent transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
          </Link>

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
                  className="z-50 min-w-[180px] overflow-hidden rounded-none border border-border bg-popover p-1 text-popover-foreground shadow-md"
                >
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
                    {user.username || user.email}
                  </div>

                  <DropdownMenu.Item asChild>
                    <Link
                      href="/my_orders"
                      className="flex w-full items-center gap-2 px-2 py-2 text-sm text-foreground hover:bg-accent rounded-none cursor-pointer focus:outline-none select-none transition-colors"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>My orders</span>
                    </Link>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-2 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-none cursor-pointer focus:outline-none select-none border-t border-border/40 mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
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