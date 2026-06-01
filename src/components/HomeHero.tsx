import Link from "next/link";
import { DIRECTORY_BY_LINE, type HomeLine } from "@/lib/home-directory";
import type { Product } from "@/lib/products";
import ProductImage from "@/components/ProductImage";

const HERO_THEME: Record<HomeLine, { shell: string; panel: string; accent: string }> = {
  women: {
    shell: "bg-[linear-gradient(135deg,#f5efe7_0%,#ede4d7_100%)]",
    panel: "bg-[linear-gradient(180deg,#fffdfa_0%,#f2e7da_100%)]",
    accent: "text-[#8b5e3c]",
  },
  men: {
    shell: "bg-[linear-gradient(135deg,#edf1f4_0%,#dfe6eb_100%)]",
    panel: "bg-[linear-gradient(180deg,#fbfdff_0%,#dfe8ee_100%)]",
    accent: "text-[#3a5568]",
  },
  kids: {
    shell: "bg-[linear-gradient(135deg,#f6f2df_0%,#efe5bc_100%)]",
    panel: "bg-[linear-gradient(180deg,#fffef8_0%,#f1e8c7_100%)]",
    accent: "text-[#857132]",
  },
  baby: {
    shell: "bg-[linear-gradient(135deg,#f8efe6_0%,#f2dfcf_100%)]",
    panel: "bg-[linear-gradient(180deg,#fffdfa_0%,#f4e4d6_100%)]",
    accent: "text-[#93674b]",
  },
};

function formatPrice(price: number): string {
  return `￥${price}`;
}

export default function HomeHero({
  currentLine,
  primary,
  secondary,
}: {
  currentLine: HomeLine;
  primary: Product;
  secondary: Product;
}) {
  const config = DIRECTORY_BY_LINE[currentLine];
  const theme = HERO_THEME[currentLine];

  return (
    <section className={`overflow-hidden rounded-[40px] border border-black/10 shadow-[0_24px_70px_rgba(24,24,27,0.08)] ${theme.shell}`}>
      <div className="grid min-h-[70vh] lg:grid-cols-[1.05fr_0.95fr]">
        <div className={`relative overflow-hidden p-8 md:p-12 ${theme.panel}`}>
          <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(255,255,255,0))]" />
          <div className="absolute -right-20 top-10 text-[clamp(88px,18vw,220px)] font-semibold tracking-[-0.08em] text-white/70">
            {config.label}
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className={`text-xs font-medium tracking-[0.34em] ${theme.accent}`}>UNIQLO HERO ENTRY</div>
              <div className="mt-6 max-w-lg text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
                {config.supported ? `${config.label}外套主视觉` : `${config.label}目录预览`}
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
              <div className="order-2 space-y-4 lg:order-1">
                <div className="inline-flex rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-medium tracking-[0.22em] text-zinc-700">
                  {config.supported ? "真实商品数据联动" : "目录结构预留"}
                </div>
                <div>
                  <div className="text-3xl font-semibold tracking-tight text-[#e60012] md:text-5xl">{formatPrice(primary.price)}</div>
                  <div className="mt-3 max-w-sm text-lg font-medium leading-tight text-zinc-950">{primary.name}</div>
                  <div className="mt-3 text-sm leading-6 text-zinc-600">
                    {config.supported
                      ? "第一屏用当前类线里的真实商品主图做大幅视觉，分类入口收进顶部下拉菜单，往下继续就是商品流。"
                      : "当前类线暂未接入真实商品，所以主视觉先沿用已同步的热门外套作为展示。"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/product/${primary.id}`}
                    className="inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
                  >
                    查看主推商品
                  </Link>
                  <Link
                    href={config.supported ? `/category/all-casual-outerwear?gender=${config.gender}` : "/category/all-casual-outerwear"}
                    className="inline-flex rounded-full border border-zinc-300 bg-white/80 px-5 py-3 text-sm font-medium text-zinc-800"
                  >
                    浏览全部外套
                  </Link>
                </div>
              </div>

              <div className="order-1 flex min-h-[280px] items-end justify-center lg:order-2 lg:min-h-[420px]">
                <ProductImage
                  key={`hero-primary-${primary.id}`}
                  name={primary.name}
                  localImage={primary.local_image}
                  imageUrl={primary.image_url ?? secondary.image_url}
                  width={900}
                  height={900}
                  priority
                  className="h-[280px] w-auto object-contain drop-shadow-[0_30px_40px_rgba(24,24,27,0.18)] md:h-[420px] lg:h-[500px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0))]" />
          <div className="absolute inset-x-10 top-10 flex items-center justify-between">
            <div className="rounded-full border border-white/60 bg-white/30 px-4 py-2 text-xs font-medium tracking-[0.24em] text-zinc-700 backdrop-blur">
              {config.label}
            </div>
            <div className="rounded-full border border-white/60 bg-white/30 px-4 py-2 text-xs font-medium tracking-[0.22em] text-zinc-700 backdrop-blur">
              LOOK 02
            </div>
          </div>

          <div className="absolute inset-x-8 bottom-8 top-24 rounded-[32px] bg-white/28 backdrop-blur-[2px]" />
          <div className="relative z-10 flex h-full items-end justify-center px-8 pb-8">
            <ProductImage
              key={`hero-secondary-${secondary.id}`}
              name={secondary.name}
              localImage={secondary.local_image}
              imageUrl={secondary.image_url ?? primary.image_url}
              width={900}
              height={900}
              priority
              className="h-[560px] w-auto object-contain drop-shadow-[0_30px_40px_rgba(24,24,27,0.18)]"
            />
          </div>

          <div className="absolute bottom-10 left-10 right-10 rounded-[28px] border border-white/70 bg-white/72 p-5 backdrop-blur">
            <div className="text-sm font-medium tracking-[0.24em] text-zinc-500">SECONDARY PRODUCT</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{secondary.name}</div>
            <div className="mt-2 flex items-center justify-between text-sm text-zinc-600">
              <span>{config.supported ? "当前类线推荐" : "实验站热门商品"}</span>
              <span className="text-lg font-semibold text-zinc-950">{formatPrice(secondary.price)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
