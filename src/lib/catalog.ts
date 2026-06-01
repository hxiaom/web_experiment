export type CategorySlug =
  | "all-casual-outerwear"
  | "casual-jackets"
  | "hooded-jackets"
  | "blazers"
  | "uv-protection"
  | "windproof-outerwear"
  | "shirt-jackets"
  | "collaboration-series"
  | "knit-outerwear"
  | "blocktech-series"
  | "unisex";

export const CATEGORIES: Array<{ slug: CategorySlug; name: string }> = [
  { slug: "all-casual-outerwear", name: "全部休闲外套" },
  { slug: "casual-jackets", name: "休闲茄克" },
  { slug: "hooded-jackets", name: "连帽外套" },
  { slug: "blazers", name: "西装外套" },
  { slug: "uv-protection", name: "防晒外套" },
  { slug: "windproof-outerwear", name: "防风夹克" },
  { slug: "shirt-jackets", name: "衬衫式茄克" },
  { slug: "collaboration-series", name: "合作系列" },
  { slug: "knit-outerwear", name: "针织外套" },
  { slug: "blocktech-series", name: "BLOCKTECH系列" },
  { slug: "unisex", name: "男女同款" },
];

export function getCategoryName(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}
