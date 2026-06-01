"use client";

import { useEffect } from "react";
import { track } from "@/lib/client/track";

export default function ProductViewTracker({
  productId,
  category,
  price,
}: {
  productId: string;
  category: string;
  price: number;
}) {
  useEffect(() => {
    track(
      "product_view",
      { product_id: productId, category, price, brand: "UNIQLO-style" },
      `/product/${productId}`,
    );
  }, [productId, category, price]);
  return null;
}

