import { notFound } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import AddToCart from "@/components/AddToCart";
import Reviews from "@/components/Reviews";
import ProductViewTracker from "@/components/ProductViewTracker";
import { getGenderLineName, getProductById } from "@/lib/products";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <ProductViewTracker productId={product.id} category={product.category} price={product.price} />
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <ProductImage key={product.id} name={product.name} localImage={product.local_image} imageUrl={product.image_url} />
      </div>

      <div className="space-y-6">
        <div>
          <div className="text-xs tracking-widest text-zinc-500">{getGenderLineName(product.gender_line)}</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{product.name}</h1>
          <div className="mt-2 text-xl font-semibold">¥{product.price}</div>
          <p className="mt-3 text-sm text-zinc-600">{product.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {product.tags.slice(0, 6).map((t) => (
              <span key={t} className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-600">
                {t}
              </span>
            ))}
          </div>
        </div>

        <AddToCart product={product} />

        <Reviews productId={product.id} />
      </div>
    </div>
  );
}
