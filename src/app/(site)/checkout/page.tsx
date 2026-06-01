import CheckoutClient from "@/components/CheckoutClient";

export default function CheckoutPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs tracking-widest text-zinc-500">CHECKOUT</div>
        <h1 className="mt-2 text-2xl font-semibold">结算</h1>
        <p className="mt-2 text-sm text-zinc-600">该页面为模拟结算：不接真实支付。</p>
      </div>
      <CheckoutClient />
    </div>
  );
}

