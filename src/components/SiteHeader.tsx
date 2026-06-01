"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HeaderDirectoryMenu from "@/components/HeaderDirectoryMenu";
import { HOME_LINES, getHomeHref, parseHomeLine, type HomeLine } from "@/lib/home-directory";
import { parseGenderFilter } from "@/lib/products";

function LogoMark() {
  return (
    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-sm bg-[#e60012] text-[13px] font-black leading-[0.92] tracking-tight text-white">
      <span>UNI</span>
      <span>QLO</span>
    </div>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gender = parseGenderFilter(searchParams.get("gender") ?? undefined);
  const currentLine = parseHomeLine(searchParams.get("line") ?? (gender === "men" || gender === "women" ? gender : undefined));
  const searchHref = pathname === "/" ? (gender === "all" ? "/search?q=" : `/search?q=&gender=${gender}`) : "/search?q=";
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [openMenu, setOpenMenu] = useState<{ line: HomeLine; routeKey: string } | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const openLine = openMenu?.routeKey === routeKey ? openMenu.line : null;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 bg-white/95 backdrop-blur">
      <div className="border-b border-black/10">
        <div className="mx-auto flex w-full max-w-[1360px] items-center gap-3 px-4 py-4 md:px-6">
          <Link href={getHomeHref(currentLine)} className="flex items-center gap-3">
            <LogoMark />
            <div className="hidden md:block">
              <div className="text-[11px] font-medium tracking-[0.32em] text-zinc-500">UNIQLO DIRECTORY LAB</div>
              <div className="text-sm font-medium text-zinc-900">优衣库目录实验页</div>
            </div>
          </Link>

          <nav className="mx-auto hidden items-center gap-8 text-lg font-medium md:flex">
            {HOME_LINES.map((item) => {
              const highlighted = item.value === (openLine ?? currentLine);
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setOpenMenu((prev) =>
                      prev?.routeKey === routeKey && prev.line === item.value ? null : { line: item.value, routeKey },
                    )
                  }
                  className={`border-b-2 px-1 pb-4 pt-2 transition ${
                    highlighted ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-950"
                  }`}
                  aria-expanded={openLine === item.value}
                  aria-controls={`directory-menu-${item.value}`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 text-sm">
            <Link href={searchHref} className="rounded-full border border-zinc-300 px-4 py-2 hover:bg-zinc-50">
              搜索
            </Link>
            <Link href="/cart" className="rounded-full border border-zinc-300 px-4 py-2 hover:bg-zinc-50">
              购物车
            </Link>
          </div>
        </div>

        <div className="border-t border-black/5 md:hidden">
          <div className="mx-auto flex w-full max-w-[1360px] items-center gap-2 overflow-x-auto px-4 py-3">
            {HOME_LINES.map((item) => {
              const active = item.value === currentLine;
              return (
                <Link
                  key={item.value}
                  href={getHomeHref(item.value)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                    active ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {openLine ? (
        <div id={`directory-menu-${openLine}`} className="hidden md:block">
          <HeaderDirectoryMenu line={openLine} onNavigate={() => setOpenMenu(null)} />
        </div>
      ) : null}
    </header>
  );
}
