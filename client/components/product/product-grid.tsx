"use client";

import React, { useEffect, useState } from "react";
import ProductCard, { Product } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";

// Динамически получаем URL из env докера. Если переменной нет, откатываемся на дефолт.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Делаем запрос, используя системную переменную окружения
        const res = await fetch(`${API_URL}/client/products/list/`); 
        if (!res.ok) throw new Error("Не удалось загрузить товары");
        
        const data = await res.json();
        
        // DRF возвращает либо чистый массив, либо объект с ключом results при пагинации
        const items = Array.isArray(data) ? data : data.results || [];
        setProducts(items);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []); // Опечатка "Middleton" успешно удалена отсюда

  if (error) {
    return (
      <div className="w-full text-center py-12 text-sm text-destructive font-medium">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="w-full bg-background px-4 sm:px-6 lg:px-8 py-8">
      {/* Сетка карточек */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="space-y-3 w-full">
                <Skeleton className="aspect-square w-full rounded-none" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {!isLoading && products.length === 0 && (
        <div className="w-full text-center py-12 text-sm text-muted-foreground">
          Нет доступных товаров в каталоге.
        </div>
      )}
    </div>
  );
}