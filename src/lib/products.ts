import productsJson from "@/data/products.json";
import type { CategorySlug } from "./catalog";

export type Product = {
  id: string;
  name: string;
  category: CategorySlug;
  categories?: CategorySlug[];
  local_image?: string;
  image_url?: string;
  gender_line: "MEN" | "WOMEN" | "KIDS" | "UNISEX";
  colors: string[];
  sizes: string[];
  price: number;
  tags: string[];
  description: string;
};

export type GenderFilter = "all" | "men" | "women";

const PRODUCTS = productsJson as Product[];
const BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

export function getAllProducts(): Product[] {
  return PRODUCTS;
}

export function getProductById(id: string): Product | null {
  return BY_ID.get(id) ?? null;
}

export function getGenderLineName(genderLine: Product["gender_line"]): string {
  switch (genderLine) {
    case "MEN":
      return "男装";
    case "WOMEN":
      return "女装";
    case "KIDS":
      return "童装";
    case "UNISEX":
      return "男女同款";
  }
}

export function getProductImageSrc(product: Pick<Product, "local_image" | "image_url">): string | undefined {
  return product.local_image || product.image_url;
}

export function parseGenderFilter(value: string | undefined): GenderFilter {
  if (value === "men" || value === "women") return value;
  return "all";
}

export function searchProducts(params: {
  q?: string;
  category?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  gender?: GenderFilter;
}): Product[] {
  const q = (params.q ?? "").trim().toLowerCase();
  return PRODUCTS.filter((p) => {
    if (params.category) {
      const categories = p.categories ?? [p.category];
      if (!categories.includes(params.category as CategorySlug)) return false;
    }
    if (params.gender === "men" && p.gender_line !== "MEN") return false;
    if (params.gender === "women" && p.gender_line !== "WOMEN") return false;
    if (params.color && !p.colors.includes(params.color)) return false;
    if (params.size && !p.sizes.includes(params.size)) return false;
    if (typeof params.minPrice === "number" && p.price < params.minPrice) return false;
    if (typeof params.maxPrice === "number" && p.price > params.maxPrice) return false;
    if (!q) return true;
    const hay = `${p.name} ${p.description} ${p.tags.join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}
