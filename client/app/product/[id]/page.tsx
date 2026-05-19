"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Minus, Plus, ChevronLeft } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

import { Product } from "@/components/product/product-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_URL = API_URL.replace("/api/v1", "");

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const res = await fetch(`${API_URL}/client/products/${id}/`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("PRODUCT NOT FOUND");
          throw new Error("ERROR LOADING PRODUCT DATA");
        }
        const data = await res.json();
        setProduct(data);
      } catch (err: any) {
        toast.error(err.message);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProductData();
  }, [id, router]);

  const handleQuantityChange = (type: "increment" | "decrement") => {
    setQuantity((prev) => {
      if (type === "decrement") return prev > 1 ? prev - 1 : 1;
      return prev + 1;
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    setIsAdding(true);
    try {
      const res = await apiFetch("/client/cart/", {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          size_id: selectedSize, 
          quantity: quantity,
        }),
      });

      if (res.ok) {
        toast.success("Product added to cart");
        router.refresh(); 
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.size_id) {
          toast.error(errorData.size_id[0]);
        } else if (errorData.product_id) {
          toast.error(errorData.product_id[0]);
        } else {
          toast.error("Failed to add product. Session may have expired.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error occurred");
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) return null;

  const imageUrl = product.photo
    ? (product.photo.startsWith("http") ? product.photo : `${BACKEND_URL}${product.photo}`)
    : "/placeholder.png";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-tight mb-8 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> BACK
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          <div className="md:col-span-7 bg-muted aspect-square relative w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-w-md) 100vw, 60vw"
              className="object-cover object-center"
            />
          </div>

          <div className="md:col-span-5 flex flex-col justify-start space-y-8 pt-2">
            
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight uppercase border-b pb-4">
                {product.name}
              </h1>
              <p className="text-2xl font-bold tracking-tight pt-2 font-mono">
                {Number(product.price).toLocaleString("en-US")} KZT
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider">Choose size</span>
              </div>
              
              {product.sizes.length === 0 ? (
                <p className="text-sm text-muted-foreground italic uppercase tracking-tight">No sizes available for this product.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => setSelectedSize(size.id)}
                        className={`h-12 text-sm font-medium transition-all uppercase border rounded-none cursor-pointer ${
                          isSelected
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background border-input text-foreground hover:border-foreground"
                        }`}
                      >
                        {size.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <span className="text-sm font-bold uppercase tracking-wider block">Quantity</span>
              <div className="inline-flex items-center border border-input h-12 bg-background">
                <button
                  type="button"
                  onClick={() => handleQuantityChange("decrement")}
                  className="w-12 h-full flex items-center justify-center hover:bg-muted transition-colors border-r border-input cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 text-center font-semibold text-sm select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange("increment")}
                  className="w-12 h-full flex items-center justify-center hover:bg-muted transition-colors border-l border-input cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding || product.sizes.length === 0}
                className="w-full h-14 bg-foreground text-background font-bold uppercase tracking-widest text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none rounded-none cursor-pointer"
              >
                {isAdding ? "ADDING..." : "ADD TO CART"}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Skeleton className="h-5 w-20 rounded-none" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          <Skeleton className="md:col-span-7 aspect-square w-full rounded-none" />
          <div className="md:col-span-5 space-y-8 pt-2">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-none" />
              <Skeleton className="h-6 w-1/3 rounded-none" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/4 rounded-none" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-12 w-full rounded-none" />
                <Skeleton className="h-12 w-full rounded-none" />
                <Skeleton className="h-12 w-full rounded-none" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/4 rounded-none" />
              <Skeleton className="h-12 w-32 rounded-none" />
            </div>
            <Skeleton className="h-14 w-full rounded-none" />
          </div>
        </div>
      </div>
    </div>
  );
}