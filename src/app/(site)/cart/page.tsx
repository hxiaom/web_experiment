import CartClient from "@/components/CartClient";

export default function CartPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs tracking-widest text-zinc-500">CART</div>
        <h1 className="mt-2 text-2xl font-semibold">购物车</h1>
      </div>
      <CartClient />
    </div>
  );
}

