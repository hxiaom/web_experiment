import type { CategorySlug } from "./catalog";
import type { GenderFilter } from "./products";

export type HomeLine = "women" | "men" | "kids" | "baby";

type DirectoryItem = {
  slug?: CategorySlug;
  title: string;
  subtitle: string;
  accent?: string;
};

type DirectoryLineConfig = {
  label: string;
  description: string;
  eyebrow: string;
  supported: boolean;
  gender: GenderFilter;
  items: DirectoryItem[];
};

export const HOME_LINES: Array<{ value: HomeLine; label: string }> = [
  { value: "women", label: "女装" },
  { value: "men", label: "男装" },
  { value: "kids", label: "童装" },
  { value: "baby", label: "婴幼儿装" },
];

export const DIRECTORY_BY_LINE: Record<HomeLine, DirectoryLineConfig> = {
  women: {
    label: "女装",
    description: "聚焦女装休闲外套目录，保持优衣库官网那种一眼能扫完的入口结构。",
    eyebrow: "WOMEN DIRECTORY",
    supported: true,
    gender: "women",
    items: [
      { slug: "all-casual-outerwear", title: "外套", subtitle: "全部休闲外套" },
      { slug: "casual-jackets", title: "休闲茄克", subtitle: "轻便通勤" },
      { slug: "hooded-jackets", title: "连帽外套", subtitle: "日常层搭" },
      { slug: "knit-outerwear", title: "针织外套", subtitle: "柔软开衫" },
      { slug: "shirt-jackets", title: "衬衫式茄克", subtitle: "利落叠穿" },
      { slug: "blazers", title: "西装外套", subtitle: "都市通勤" },
      { slug: "uv-protection", title: "防晒系列", subtitle: "轻薄防护", accent: "UV" },
      { slug: "collaboration-series", title: "特别合作系列", subtitle: "合作企划", accent: "COLLAB" },
    ],
  },
  men: {
    label: "男装",
    description: "以男装休闲外套为主，按照官方目录的浏览习惯组织成清晰入口。",
    eyebrow: "MEN DIRECTORY",
    supported: true,
    gender: "men",
    items: [
      { slug: "all-casual-outerwear", title: "外套", subtitle: "全部休闲外套" },
      { slug: "casual-jackets", title: "休闲茄克", subtitle: "工装休闲" },
      { slug: "hooded-jackets", title: "连帽外套", subtitle: "轻松出行" },
      { slug: "windproof-outerwear", title: "防风系列", subtitle: "功能外套", accent: "WIND" },
      { slug: "shirt-jackets", title: "衬衫式茄克", subtitle: "层次穿搭" },
      { slug: "blocktech-series", title: "BLOCKTECH系列", subtitle: "机能防护", accent: "BT" },
      { slug: "collaboration-series", title: "特别合作系列", subtitle: "联名企划", accent: "COLLAB" },
      { slug: "unisex", title: "男女同款", subtitle: "共享版型" },
    ],
  },
  kids: {
    label: "童装",
    description: "目录结构已预留，当前实验站还没有接入童装真实商品数据。",
    eyebrow: "KIDS DIRECTORY",
    supported: false,
    gender: "all",
    items: [
      { title: "童装外套", subtitle: "敬请期待" },
      { title: "校园通勤", subtitle: "即将开放" },
      { title: "功能系列", subtitle: "即将开放" },
      { title: "季节精选", subtitle: "即将开放" },
    ],
  },
  baby: {
    label: "婴幼儿装",
    description: "目录结构已预留，当前实验站还没有接入婴幼儿装真实商品数据。",
    eyebrow: "BABY DIRECTORY",
    supported: false,
    gender: "all",
    items: [
      { title: "婴幼儿外套", subtitle: "敬请期待" },
      { title: "轻暖系列", subtitle: "即将开放" },
      { title: "居家出行", subtitle: "即将开放" },
      { title: "季节精选", subtitle: "即将开放" },
    ],
  },
};

export function parseHomeLine(value: string | undefined): HomeLine {
  if (value === "women" || value === "men" || value === "kids" || value === "baby") return value;
  return "women";
}

export function getDefaultGenderForLine(line: HomeLine): GenderFilter {
  return DIRECTORY_BY_LINE[line].gender;
}

export function getHomeHref(line: HomeLine): string {
  const params = new URLSearchParams();
  params.set("line", line);
  const gender = getDefaultGenderForLine(line);
  if (gender !== "all") params.set("gender", gender);
  return `/?${params.toString()}`;
}
