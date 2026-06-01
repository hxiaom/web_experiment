"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { installAutoFlush, track } from "@/lib/client/track";

function normalizeText(value: string | null | undefined, limit = 120): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, limit);
}

function describeElement(element: Element | null): Record<string, unknown> | null {
  if (!element || !(element instanceof HTMLElement)) return null;

  const text =
    normalizeText(element.getAttribute("aria-label")) ??
    normalizeText(element.innerText) ??
    normalizeText(element.textContent) ??
    normalizeText(element.getAttribute("title")) ??
    ("placeholder" in element ? normalizeText((element as HTMLInputElement).placeholder) : null);

  const classes = Array.from(element.classList).slice(0, 4);
  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || null,
    role: element.getAttribute("role"),
    text,
    classes: classes.length ? classes : null,
    href: element instanceof HTMLAnchorElement ? element.href : null,
    type: "type" in element ? (element as HTMLInputElement).type || null : null,
    name: "name" in element ? (element as HTMLInputElement).name || null : null,
    dataset: Object.fromEntries(
      Object.entries(element.dataset)
        .filter(([key]) => key.startsWith("track") || key.startsWith("test"))
        .slice(0, 8),
    ),
  };
}

function buildSelector(element: Element | null): string | null {
  if (!element || !(element instanceof HTMLElement)) return null;
  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (current && parts.length < 4) {
    let part = current.tagName.toLowerCase();
    if (current.id) {
      part += `#${current.id}`;
      parts.unshift(part);
      break;
    }
    const classNames = Array.from(current.classList).slice(0, 2);
    if (classNames.length) part += `.${classNames.join(".")}`;
    parts.unshift(part);
    current = current.parentElement;
  }

  return parts.join(" > ");
}

export default function Tracking() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const last = useRef<string | null>(null);

  useEffect(() => {
    installAutoFlush();
  }, []);

  useEffect(() => {
    const full = sp?.size ? `${pathname}?${sp.toString()}` : pathname;
    const referrer = last.current;
    last.current = full;
    track("page_view", { referrer }, full);
  }, [pathname, sp]);

  useEffect(() => {
    const full = sp?.size ? `${pathname}?${sp.toString()}` : pathname;

    function handleClick(event: MouseEvent) {
      const rawTarget = event.target instanceof Element ? event.target : null;
      const actionTarget =
        rawTarget?.closest("a, button, input, select, textarea, label, summary, [role='button'], [role='link']") ??
        rawTarget;
      if (!rawTarget) return;

      track(
        "ui_click",
        {
          x: Math.round(event.clientX),
          y: Math.round(event.clientY),
          target_selector: buildSelector(rawTarget),
          action_selector: buildSelector(actionTarget),
          target: describeElement(rawTarget),
          action: describeElement(actionTarget),
        },
        full,
      );
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [pathname, sp]);

  return null;
}
