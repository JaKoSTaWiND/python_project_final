"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ShoppingBag } from "lucide-react";
import Navbar from "@/components/layout/navbar";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center max-w-[600px] mx-auto px-4 text-center space-y-6">
        <CheckCircle className="w-16 h-16 text-emerald-500 animate-in fade-in zoom-in duration-300" />
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            Payment Successful!
          </h1>
          <p className="text-sm text-muted-foreground uppercase font-mono">
            Order #{orderId || "N/A"} successfully completed and submitted for processing.
          </p>
        </div>

        <div className="pt-4 border-t w-full max-w-xs gap-4 flex flex-col">
          <button
            onClick={() => router.push("/")}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-none bg-foreground text-background font-bold uppercase tracking-widest text-xs transition-opacity hover:opacity-90 shadow-sm cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </button>
        </div>
      </main>
    </div>
  );
}