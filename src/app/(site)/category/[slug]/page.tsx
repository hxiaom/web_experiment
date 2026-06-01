import { notFound } from "next/navigation";
import { CATEGORIES, getCategoryName } from "@/lib/catalog";
import { parseGenderFilter, searchProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import CategoryFilters from "@/components/CategoryFilters";
import GenderFilterTabs from "@/components/GenderFilterTabs";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  if (!CATEGORIES.some((c) => c.slug === slug)) notFound();

  const gender = parseGenderFilter(typeof resolvedSearchParams.gender === "string" ? resolvedSearchParams.gender : undefined);
  const color = typeof resolvedSearchParams.color === "string" ? resolvedSearchParams.color : undefined;
  const size = typeof resolvedSearchParams.size === "string" ? resolvedSearchParams.size : undefined;
  const minPrice =
    typeof resolvedSearchParams.minPrice === "string" ? Number(resolvedSearchParams.minPrice) : undefined;
  const maxPrice =
    typeof resolvedSearchParams.maxPrice === "string" ? Number(resolvedSearchParams.maxPrice) : undefined;

  const products = searchProducts({ category: slug, gender, color, size, minPrice, maxPrice });
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs tracking-widest text-zinc-500">CATEGORY</div>
          <h1 className="mt-2 text-2xl font-semibold">{getCategoryName(slug)}</h1>
          <div className="mt-1 text-sm text-zinc-600">{products.length} 件</div>
        </div>
      </div>

      <GenderFilterTabs current={gender} />

      <CategoryFilters />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
