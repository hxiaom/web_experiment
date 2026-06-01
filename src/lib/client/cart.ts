import type { Product } from "@/lib/products";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  variant?: { color?: string; size?: string };
};

const KEY = "cart_v1";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.id === "string" && typeof i.qty === "number")
      .map((i) => ({
        id: i.id,
        name: typeof i.name === "string" ? i.name : i.id,
        price: typeof i.price === "number" ? i.price : 0,
        qty: Math.max(1, Math.floor(i.qty)),
        variant: i.variant && typeof i.variant === "object" ? i.variant : undefined,
      }));
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty * i.price, 0);
}

export function addToCart(product: Product, qty: number, variant?: CartItem["variant"]): CartItem[] {
  const items = readCart();
  const idx = items.findIndex((i) => i.id === product.id && JSON.stringify(i.variant ?? {}) === JSON.stringify(variant ?? {}));
  if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + qty };
  else items.push({ id: product.id, name: product.name, price: product.price, qty, variant });
  writeCart(items);
  return items;
}

export function updateQty(id: string, qty: number, variant?: CartItem["variant"]): CartItem[] {
  const items = readCart();
  const next = items
    .map((i) => {
      const same =
        i.id === id && JSON.stringify(i.variant ?? {}) === JSON.stringify(variant ?? {});
      return same ? { ...i, qty: Math.max(1, Math.floor(qty)) } : i;
    })
    .filter(Boolean) as CartItem[];
  writeCart(next);
  return next;
}

export function removeFromCart(id: string, variant?: CartItem["variant"]): CartItem[] {
  const items = readCart();
  const next = items.filter(
    (i) => !(i.id === id && JSON.stringify(i.variant ?? {}) === JSON.stringify(variant ?? {})),
  );
  writeCart(next);
  return next;
}

