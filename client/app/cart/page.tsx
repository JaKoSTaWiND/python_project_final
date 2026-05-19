"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2, Minus, Plus, ChevronLeft, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { apiFetch } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_URL = API_URL.replace("/api/v1", "");

interface CartProduct {
  id: number;
  sku: string;
  name: string;
  price: string;
  photo: string | null;
  is_active: boolean;
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
  item_total_price: number;
}

interface CartData {
  id: number;
  items: CartItem[];
  total_cart_price: number;
  total_items_count: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const fetchCart = async () => {
    try {
      const res = await apiFetch("/client/cart/");
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = async (item: CartItem, newQuantity: number) => {
    setIsUpdating(item.id);
    try {
      const res = await apiFetch("/client/cart/", {
        method: "POST",
        body: JSON.stringify({
          product_id: item.product.id,
          size_id: item.size.id,
          quantity: newQuantity,
        }),
      });

      if (res.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error("Failed to update quantity:", err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      const res = await apiFetch("/client/cart/", {
        method: "DELETE",
        body: JSON.stringify({ cart_item_id: itemId }),
      });

      if (res.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error("Failed to remove item:", err);
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
        <Navbar />
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-mono text-2xl font-bold tracking-tight mb-6 uppercase">Your cart is empty</h1>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 font-mono text-sm border border-foreground bg-foreground text-background px-6 py-3 hover:bg-background hover:text-foreground transition-colors rounded-none uppercase font-bold cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> Go to Homepage
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-tight mb-8"
        >
          <ChevronLeft className="w-4 h-4" /> BACK
        </button>

        <h1 className="text-3xl font-extrabold tracking-tighter uppercase mb-10 border-b pb-4">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-4">
            {cart.items.map((item) => {
              const imageUrl = item.product.photo
                ? (item.product.photo.startsWith("http") ? item.product.photo : `${BACKEND_URL}${item.product.photo}`)
                : "/placeholder.png";

              return (
                <div
                  key={item.id}
                  className="flex gap-4 border border-input bg-background p-4 relative rounded-none transition-colors"
                >
                  <div className="relative h-24 w-24 flex-shrink-0 border border-border bg-muted overflow-hidden rounded-none aspect-square">
                    <Image
                      src={imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover object-center"
                      sizes="96px"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-bold text-base text-foreground leading-tight uppercase">
                          {item.product.name}
                        </h3>
                        <p className="font-bold text-base whitespace-nowrap">
                          {parseFloat(item.product.price).toLocaleString("en-US")} KZT
                        </p>
                      </div>
                      
                      <div className="font-mono text-xs text-muted-foreground space-y-0.5 uppercase">
                        <p>Size: <span className="text-foreground font-bold">{item.size.name}</span></p>
                        <p>SKU: {item.product.sku}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="inline-flex items-center border border-input h-8 bg-background">
                        <button
                          type="button"
                          disabled={isUpdating === item.id || item.quantity <= 1}
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          className="w-8 h-full flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors border-r border-input cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        
                        <span className="w-10 text-center text-sm font-semibold select-none">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          disabled={isUpdating === item.id}
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          className="w-8 h-full flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors border-l border-input cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors uppercase px-2 py-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                  
                  {isUpdating === item.id && (
                    <div className="absolute inset-0 bg-background/40 flex items-center justify-center z-10 animate-fade-in" />
                  )}
                </div>
              );
            })}
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
              type="button"
              onClick={() => router.push("/orders")}
              className="w-full h-14 flex items-center justify-center rounded-none bg-foreground text-background font-bold uppercase tracking-widest text-sm transition-opacity hover:opacity-90 shadow-sm cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}