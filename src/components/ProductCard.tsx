"use client";

import Link from "next/link";
import ProductImage from "./ProductImage";
import { getGenderLineName, type Product } from "@/lib/products";
import { track } from "@/lib/client/track";
import { getCategoryName } from "@/lib/catalog";

export default function ProductCard({
  product,
  searchMeta,
}: {
  product: Product;
  searchMeta?: { query: string; rank: number };
}) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group rounded-2xl border border-zinc-200 bg-white p-3 hover:border-zinc-400"
      onClick={() => {
        if (searchMeta) {
          track(
            "search_result_click",
            { query: searchMeta.query, product_id: product.id, rank: searchMeta.rank },
            "/search",
          );
        }
      }}
    >
      <div className="overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
        <ProductImage key={product.id} name={product.name} localImage={product.local_image} imageUrl={product.image_url} />
      </div>
      <div className="mt-3 space-y-1">
        <div className="text-[11px] tracking-wide text-zinc-500">{getGenderLineName(product.gender_line)}</div>
        <div className="text-sm font-medium leading-5">{product.name}</div>
        <div className="text-sm font-semibold">¥{product.price}</div>
        <div className="text-xs text-zinc-500">{getCategoryName(product.category)}</div>
      </div>
    </Link>
  );
}
