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
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#f4f0e7]">
        <ProductImage
          key={`header-directory-${product.id}`}
          name={label}
          localImage={product.local_image}
          imageUrl={product.image_url}
          width={80}
          height={80}
          className="h-14 w-14 object-contain"
        />
      </div>
    );
  }

  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-zinc-900 text-xs font-semibold tracking-[0.2em] text-white">
      {accent ?? label.slice(0, 2)}
    </div>
  );
}

export default function HeaderDirectoryMenu({
  line,
  onNavigate,
}: {
  line: HomeLine;
  onNavigate?: () => void;
}) {
  const config = DIRECTORY_BY_LINE[line];

  return (
    <div className="rounded-b-[36px] border-x border-b border-black/10 bg-white shadow-[0_28px_50px_rgba(24,24,27,0.12)]">
      <div className="mx-auto grid max-w-[1360px] gap-8 px-6 py-8 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium tracking-[0.32em] text-zinc-500">{config.eyebrow}</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">{config.label}目录</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{config.description}</p>
          </div>

          {config.supported ? (
            <SearchBox
              initialQuery=""
              gender={config.gender}
              className="flex flex-col gap-3"
              inputClassName="h-12 rounded-full border border-zinc-300 bg-white px-5 text-sm outline-none focus:border-zinc-500"
              buttonClassName="h-12 rounded-full bg-zinc-950 px-5 text-sm font-medium text-white"
              buttonLabel="搜索目录"
            />
          ) : (
            <div className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-4 text-sm leading-6 text-zinc-600">
              当前实验站还没有接入这条类线的真实商品数据，先保留目录结构。
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {config.items.map((item) => {
            const href = getCategoryHref(item.slug, config.gender);
            const product = getPreviewProduct(item.slug, config.gender);
            const card = (
              <div className="group flex min-h-[102px] items-center gap-4 rounded-[28px] border border-black/8 bg-[#fbfaf7] px-5 py-4 transition hover:-translate-y-0.5 hover:border-black/15 hover:bg-white">
                <DirectoryVisual product={product} label={item.title} accent={item.accent} />
                <div className="min-w-0">
                  <div className="text-base font-medium tracking-tight text-zinc-950">{item.title}</div>
                  <div className="mt-1 text-sm text-zinc-500">{item.subtitle}</div>
                </div>
              </div>
            );

            if (!item.slug || !config.supported) {
              return (
                <div key={`${line}-${item.title}`} className="opacity-80">
                  {card}
                </div>
              );
            }

            return (
              <Link key={`${line}-${item.slug}`} href={href} onClick={onNavigate}>
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
