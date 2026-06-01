import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import ProductCard from "@/components/ProductCard";
import { DIRECTORY_BY_LINE, getDefaultGenderForLine, parseHomeLine } from "@/lib/home-directory";
import { parseGenderFilter, searchProducts } from "@/lib/products";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const gender = parseGenderFilter(typeof resolvedSearchParams.gender === "string" ? resolvedSearchParams.gender : undefined);
  const inferredLine = typeof resolvedSearchParams.line === "string" ? resolvedSearchParams.line : gender;
  const line = parseHomeLine(inferredLine);
  const config = DIRECTORY_BY_LINE[line];
  const browseGender = getDefaultGenderForLine(line);
  const matchedProducts = config.supported ? searchProducts({ gender: browseGender }) : searchProducts({});
  const featuredProducts = matchedProducts.slice(0, 12);
  const primaryHero = matchedProducts.find((product) => product.image_url) ?? matchedProducts[0];
  const secondaryHero =
    matchedProducts.find((product) => product.id !== primaryHero.id && product.image_url) ?? matchedProducts[1] ?? primaryHero;

  return (
    <div className="space-y-10">
      <HomeHero currentLine={line} primary={primaryHero} secondary={secondaryHero} />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-black/10 bg-white p-6">
          <div className="text-xs font-medium tracking-[0.28em] text-zinc-500">DATASET</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">{matchedProducts.length}</div>
          <div className="mt-2 text-sm leading-6 text-zinc-600">
            {config.supported ? `${config.label}视图当前只展示该类线下的真实休闲外套样本。` : "当前实验站已接入 105 件男装、女装与男女同款休闲外套。"}
          </div>
        </div>

        <div className="rounded-[28px] border border-black/10 bg-white p-6">
          <div className="text-xs font-medium tracking-[0.28em] text-zinc-500">STRUCTURE</div>
          <div className="mt-3 text-xl font-semibold tracking-tight text-zinc-950">顶部下拉目录</div>
          <div className="mt-2 text-sm leading-6 text-zinc-600">
            目录入口已经收进顶部的女装、男装、童装和婴幼儿装下拉菜单里，首页本体只保留大图主视觉和商品流。
          </div>
        </div>

        <div className="rounded-[28px] border border-black/10 bg-white p-6">
          <div className="text-xs font-medium tracking-[0.28em] text-zinc-500">ENTRY</div>
          <div className="mt-3 text-xl font-semibold tracking-tight text-zinc-950">继续浏览商品</div>
          <div className="mt-2 text-sm leading-6 text-zinc-600">现在可以从顶部菜单定位分类，也可以直接往下浏览真实商品图、价格和详情页。</div>
          <Link
            href={config.supported ? `/search?q=&gender=${config.gender}` : "/search?q="}
            className="mt-4 inline-flex rounded-full border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-50"
          >
            进入搜索页
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-medium tracking-[0.32em] text-zinc-500">FEATURED PRODUCTS</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
              {config.supported ? `${config.label}精选外套` : "当前已接入的热门外套"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {config.supported ? "目录结构已经和类线视图联动，下面的商品流也会跟随当前类线切换。" : "童装与婴幼儿装目录暂未接入数据，所以这里先保留目前已同步的热门外套。"}
            </p>
          </div>
          <Link
            href={config.supported ? `/category/all-casual-outerwear?gender=${config.gender}` : "/category/all-casual-outerwear"}
            className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            查看全部外套
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
