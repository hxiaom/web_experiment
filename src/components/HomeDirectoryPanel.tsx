import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import SearchBox from "@/components/SearchBox";
import { type HomeLine, DIRECTORY_BY_LINE } from "@/lib/home-directory";
import { type GenderFilter, type Product, searchProducts } from "@/lib/products";
import type { CategorySlug } from "@/lib/catalog";

function getPreviewProduct(category: CategorySlug | undefined, gender: GenderFilter): Product | undefined {
  if (!category) return undefined;
  const fromLine = searchProducts({ category, gender }).find((product) => product.local_image || product.image_url);
  if (fromLine) return fromLine;
  return searchProducts({ category }).find((product) => product.local_image || product.image_url);
}

function getCategoryHref(category: CategorySlug | undefined, gender: GenderFilter): string {
  if (!category) return "#";
  if (gender === "all") return `/category/${category}`;
  return `/category/${category}?gender=${gender}`;
}

function DirectoryVisual({
  product,
  label,
  accent,
}: {
  product?: Product;
  label: string;
  accent?: string;
}) {
  if (product) {
    return (
      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-[#f4f0e7]">
        <ProductImage
          key={`home-directory-${product.id}`}
          name={label}
          localImage={product.local_image}
          imageUrl={product.image_url}
          width={96}
          height={96}
          className="h-16 w-16 object-contain"
        />
      </div>
    );
  }

  return (
    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-zinc-900 text-sm font-semibold tracking-[0.2em] text-white">
      {accent ?? label.slice(0, 2)}
    </div>
  );
}

export default function HomeDirectoryPanel({ currentLine }: { currentLine: HomeLine }) {
  const config = DIRECTORY_BY_LINE[currentLine];

  return (
    <section
      id="directory"
      className="overflow-hidden rounded-[36px] border border-black/10 bg-[linear-gradient(180deg,#fffdf8_0%,#f6f1e7_100%)] shadow-[0_20px_70px_rgba(24,24,27,0.06)]"
    >
      <div className="p-6 md:p-8 lg:p-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-medium tracking-[0.36em] text-zinc-500">{config.eyebrow}</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 md:text-[2.4rem]">{config.label}目录</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 md:text-base">{config.description}</p>
            </div>

            {config.supported ? (
              <div className="flex w-full flex-col gap-3 lg:max-w-3xl lg:flex-row lg:items-center">
                <SearchBox
                  initialQuery=""
                  gender={config.gender}
                  className="flex w-full gap-3"
                  inputClassName="h-14 flex-1 rounded-full border border-zinc-300 bg-white px-5 text-base outline-none focus:border-zinc-500"
                  buttonClassName="h-14 shrink-0 rounded-full border border-zinc-900 bg-zinc-900 px-6 text-sm font-medium text-white"
                  buttonLabel="搜索目录"
                />
                <Link
                  href={config.gender === "all" ? "/search?q=" : `/search?q=&gender=${config.gender}`}
                  className="inline-flex h-14 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  客服
                </Link>
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white/80 px-6 py-4 text-sm leading-6 text-zinc-600">
                当前实验站只接入了男装、女装和男女同款的真实休闲外套数据，童装与婴幼儿装目录先保留结构。
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {config.items.map((item) => {
              const href = getCategoryHref(item.slug, config.gender);
              const product = getPreviewProduct(item.slug, config.gender);
              const content = (
                <div className="group flex min-h-[112px] items-center gap-4 rounded-[28px] border border-black/8 bg-white/90 px-5 py-4 shadow-[0_14px_30px_rgba(24,24,27,0.04)] transition hover:-translate-y-0.5 hover:border-black/15 hover:bg-white">
                  <DirectoryVisual product={product} label={item.title} accent={item.accent} />
                  <div className="min-w-0">
                    <div className="text-lg font-medium tracking-tight text-zinc-950">{item.title}</div>
                    <div className="mt-1 text-sm text-zinc-500">{item.subtitle}</div>
                  </div>
                </div>
              );

              if (!item.slug || !config.supported) {
                return (
                  <div key={`${currentLine}-${item.title}`} className="opacity-80">
                    {content}
                  </div>
                );
              }

              return (
                <Link key={`${currentLine}-${item.slug}`} href={href}>
                  {content}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 border-t border-black/8 pt-4 text-xs leading-5 text-zinc-500 md:flex-row md:items-center md:justify-between">
            <div>目录卡片图片取自当前实验站同步的优衣库中国站真实商品主图。</div>
            <div>{config.supported ? "点击目录即可进入对应分类页" : "童装和婴幼儿装目录已预留，等待后续数据接入"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
