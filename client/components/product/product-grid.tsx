"use client";

import React, { useEffect, useState } from "react";
import ProductCard, { Product } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/client/products/list/`); 
        if (!res.ok) throw new Error("FAILED TO LOAD PRODUCTS");
        
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.results || [];
        setProducts(items);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (error) {
    return (
      <div className="w-full text-center py-12 text-sm text-destructive font-mono uppercase">
        ERROR: {error}
      </div>
    );
  }

  return (
    <div className="w-full bg-background px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="space-y-3 w-full">
                <Skeleton className="aspect-square w-full rounded-none" />
                <Skeleton className="h-4 w-1/4 rounded-none" />
                <Skeleton className="h-4 w-3/4 rounded-none" />
                <Skeleton className="h-3 w-1/2 rounded-none" />
              </div>
            ))
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {!isLoading && products.length === 0 && (
        <div className="w-full text-center py-12 text-sm text-muted-foreground uppercase tracking-tight font-mono">
          NO PRODUCTS AVAILABLE IN THE CATALOGUE.
        </div>
      )}
    </div>
  );
}