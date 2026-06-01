import ProductCard from "@/components/ProductCard";
import GenderFilterTabs from "@/components/GenderFilterTabs";
import SearchBox from "@/components/SearchBox";
import SearchSubmitTracker from "@/components/SearchSubmitTracker";
import { parseGenderFilter, searchProducts } from "@/lib/products";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const gender = parseGenderFilter(typeof resolvedSearchParams.gender === "string" ? resolvedSearchParams.gender : undefined);
  const products = searchProducts({ q, gender });
  return (
    <div className="space-y-6">
      <SearchSubmitTracker query={q} resultsCount={products.length} />
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs tracking-widest text-zinc-500">SEARCH</div>
          <h1 className="mt-2 text-2xl font-semibold">搜索</h1>
          <div className="mt-1 text-sm text-zinc-600">“{q || "（空）"}” · {products.length} 件</div>
        </div>
        <SearchBox initialQuery={q} gender={gender} />
      </div>

      <GenderFilterTabs current={gender} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p, idx) => (
          <ProductCard key={p.id} product={p} searchMeta={q ? { query: q, rank: idx + 1 } : undefined} />
        ))}
      </div>
    </div>
  );
}
