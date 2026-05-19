"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Loader2, CreditCard } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_URL = API_URL.replace("/api/v1", "");

interface CartProduct {
  id: number;
  name: string;
  price: string;
  photo: string | null;
}

interface CartSize {
  id: number;
  name: string;
}

interface CartItem {
  id: number;
  product: CartProduct;
  size: CartSize;
  quantity: number;
}

interface CartData {
  id: number;
  items: CartItem[];
  total_cart_price: number;
  total_items_count: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const res = await apiFetch("/client/cart/");
        if (res.ok) {
          const data = await res.json();
          if (data.items.length === 0) {
            toast.error("Your cart is empty");
            router.push("/");
            return;
          }
          setCart(data);
        }
      } catch (err) {
        console.error("Failed to fetch cart:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartData();
  }, [router]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !city || !address || !postalCode) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiFetch("/client/orders/create/", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          city: city,
          address: address,
          postal_code: postalCode,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.checkout_url) {
        toast.success("Redirecting to payment page...");
        window.location.href = data.checkout_url;
      } else {
        if (data.detail) {
          toast.error(data.detail);
        } else if (typeof data === "object") {
          const firstKey = Object.keys(data)[0];
          const errorMsg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
          toast.error(`${firstKey.toUpperCase()}: ${errorMsg}`);
        } else {
          toast.error("Failed to create order. Please try again later.");
        }
      }
    } catch (err) {
      console.error("Checkout submission error:", err);
      toast.error("Network error while processing your order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        </div>
      </div>
    );
  }

  if (!cart) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-tight mb-8 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> BACK TO CART
        </button>

        <h1 className="text-3xl font-extrabold tracking-tighter uppercase mb-10 border-b pb-4">
          Checkout
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 border border-input bg-background p-6 rounded-none space-y-6">
            <h2 className="text-xl font-extrabold uppercase tracking-tight border-b pb-3">
              Shipping Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-12 px-4 text-sm bg-background border border-input rounded-none focus:outline-none focus:border-foreground transition-colors uppercase font-medium"
                  placeholder="John"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-12 px-4 text-sm bg-background border border-input rounded-none focus:outline-none focus:border-foreground transition-colors uppercase font-medium"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-12 px-4 text-sm bg-background border border-input rounded-none focus:outline-none focus:border-foreground transition-colors uppercase font-medium"
                  placeholder="ASTANA"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Postal Code *</label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full h-12 px-4 text-sm bg-background border border-input rounded-none focus:outline-none focus:border-foreground transition-colors font-mono"
                  placeholder="123456"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Address *</label>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-4 text-sm bg-background border border-input rounded-none focus:outline-none focus:border-foreground transition-colors uppercase font-medium resize-none"
                placeholder="Street, Building, Apartment"
              />
            </div>
          </div>

          <div className="lg:col-span-4 border border-input bg-background p-6 rounded-none space-y-6">
            <h2 className="text-xl font-extrabold uppercase tracking-tight border-b pb-3">
              Order Summary
            </h2>

            <div className="text-sm space-y-4">
              <div className="flex justify-between text-muted-foreground uppercase font-medium">
                <span>Items ({cart.total_items_count})</span>
                <span className="text-foreground font-bold">{cart.total_cart_price.toLocaleString("en-US")} KZT</span>
              </div>
              
              <div className="border-t pt-4 flex justify-between text-base font-black text-foreground uppercase">
                <span>Total</span>
                <span className="text-xl tracking-tight">{cart.total_cart_price.toLocaleString("en-US")} KZT</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 flex items-center justify-center gap-2 rounded-none bg-foreground text-background font-bold uppercase tracking-widest text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Place Order</span>
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}