"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Полная синхронизация интерфейсов с бэкендом и админкой
export interface Size {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  price: string; // В DRF DecimalField улетает как string
  sizes: Size[];
  photo: string | null; // Поле называется photo!
  is_active: boolean;
}

interface ProductCardProps {
  product: Product;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_URL = API_URL.replace("/api/v1", "");

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlist, setIsWishlist] = useState(false);

  // Безопасная сборка ссылки. Если бэкенд отдал полный путь (http://...), берем его. 
  // Если относительный (/api/media/...) или null — обрабатываем без падения приложения.
  const imageUrl = product.photo
    ? (product.photo.startsWith("http") ? product.photo : `${BACKEND_URL}${product.photo}`)
    : "/placeholder.png";

  return (
    <div className="group relative flex flex-col w-full bg-background font-sans">

      {/* Изображение товара */}
      <Link href={`/product/${product.id}`} className="relative aspect-square w-full overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-w-7xl) 25vw, (max-w-md) 50vw, 100vw"
          priority={false}
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* Описание товара */}
      <div className="flex flex-col pt-3 pb-2 px-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {Number(product.price).toLocaleString()} KZT
          </span>
        </div>

        <Link href={`/product/${product.id}`} className="hover:underline">
          <h3 className="text-sm font-medium tracking-tight text-foreground uppercase truncate">
            {product.name}
          </h3>
        </Link>
        
        {/* Вывод доступных размеров на карточке как у Adidas */}
        <p className="text-xs text-muted-foreground truncate">
          {product.sizes.length > 0 
            ? `Sizes: ${product.sizes.map(s => s.name).join(", ")}` 
            : "No sizes"}
        </p>
      </div>
    </div>
  );
}