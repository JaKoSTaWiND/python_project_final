"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface Size {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  price: string;
  sizes: Size[];
  photo: string | null;
  is_active: boolean;
}

interface ProductCardProps {
  product: Product;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_URL = API_URL.replace("/api/v1", "");

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlist, setIsWishlist] = useState(false);

  const imageUrl = product.photo
    ? (product.photo.startsWith("http") ? product.photo : `${BACKEND_URL}${product.photo}`)
    : "/placeholder.png";

  return (
    <div className="group relative flex flex-col w-full bg-background font-sans">
      <Link href={`/product/${product.id}`} className="relative aspect-square w-full overflow-hidden bg-muted cursor-pointer">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-w-7xl) 25vw, (max-w-md) 50vw, 100vw"
          priority={false}
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-col pt-3 pb-2 px-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground font-mono">
            {Number(product.price).toLocaleString("en-US")} KZT
          </span>
        </div>

        <Link href={`/product/${product.id}`} className="hover:underline cursor-pointer">
          <h3 className="text-sm font-medium tracking-tight text-foreground uppercase truncate">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-xs text-muted-foreground truncate uppercase tracking-tight">
          {product.sizes.length > 0 
            ? `Sizes: ${product.sizes.map(s => s.name).join(", ")}` 
            : "No sizes"}
        </p>
      </div>
    </div>
  );
}