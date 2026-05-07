"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatNaira } from "@/lib/utils";
import { Copy, Check, Clock } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  category: string | null;
  image_url: string | null;
  in_stock: boolean;
  is_best_seller: boolean;
  sales_count: number;
  reviews: { id: string; body: string }[];
}

interface Merchant {
  id: string;
  handle: string;
  store_name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
}

interface CheckoutData {
  orderId: string;
  reference: string;
  amount: number;
  accountNumber: string;
  bankName: string;
  accountName: string;
  expiresAt: string;
}

interface StorefrontClientProps {
  merchant: Merchant;
  products: Product[];
}

export function StorefrontClient({ merchant, products }: StorefrontClientProps) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const bestSellers = products.filter((p) => p.is_best_seller && p.in_stock);
  const allProducts = products;

  async function handleBuy(product: Product) {
    setSelected(product);
    setCheckout(null);
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selected.id,
        customerName,
        customerPhone,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast(data.error ?? "Something went wrong", "error");
      return;
    }

    setCheckout(data);
  }

  function copyAccount() {
    if (!checkout) return;
    navigator.clipboard.writeText(checkout.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Account number copied", "success");
  }

  function formatExpiry(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    const mins = Math.max(0, Math.floor(diff / 60000));
    const secs = Math.max(0, Math.floor((diff % 60000) / 1000));
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Store header */}
      <header className="bg-white border-b border-[#E8E0D4] px-4 py-5 text-center">
        <h1 className="text-xl font-bold text-[#1A1208]">{merchant.store_name}</h1>
        {merchant.description && (
          <p className="text-sm text-[#7A6E62] mt-1">{merchant.description}</p>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-10">
        {/* Best sellers */}
        {bestSellers.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-bold text-[#7A6E62] uppercase tracking-widest mb-4">Best Sellers</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} onBuy={handleBuy} compact />
              ))}
            </div>
          </section>
        )}

        {/* All products */}
        <section>
          <h2 className="text-xs font-bold text-[#7A6E62] uppercase tracking-widest mb-4">All Products</h2>
          <div className="grid grid-cols-2 gap-3">
            {allProducts.map((p) => (
              <ProductCard key={p.id} product={p} onBuy={handleBuy} />
            ))}
          </div>
        </section>
      </main>

      {/* Product drawer */}
      {selected && !checkout && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Product image */}
            <div className="aspect-square bg-[#F5F0E8] relative">
              {selected.image_url && (
                <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover" />
              )}
              {selected.is_best_seller && (
                <Badge variant="bestseller" className="absolute top-4 left-4">Best Seller</Badge>
              )}
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold text-[#1A1208]">{selected.name}</h3>
                <div className="text-right shrink-0">
                  {selected.sale_price ? (
                    <>
                      <p className="text-xl font-bold text-[#C4973A]">{formatNaira(selected.sale_price)}</p>
                      <p className="text-sm text-[#B0A89E] line-through">{formatNaira(selected.price)}</p>
                    </>
                  ) : (
                    <p className="text-xl font-bold text-[#1A1208]">{formatNaira(selected.price)}</p>
                  )}
                </div>
              </div>

              {selected.description && (
                <p className="text-sm text-[#7A6E62] mt-2">{selected.description}</p>
              )}

              {/* Reviews */}
              {selected.reviews.length > 0 && (
                <div className="mt-4 bg-[#F5F0E8] rounded-xl p-4 flex flex-col gap-2">
                  {selected.reviews.slice(0, 3).map((r) => (
                    <p key={r.id} className="text-xs text-[#1A1208]">"{r.body}"</p>
                  ))}
                </div>
              )}

              {selected.in_stock ? (
                <form onSubmit={handleCheckout} className="flex flex-col gap-3 mt-5">
                  <Input label="Your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                  <Input label="Phone number" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                  <Button type="submit" loading={loading} className="w-full h-12 mt-1">
                    Buy now — {formatNaira(selected.sale_price ?? selected.price)}
                  </Button>
                </form>
              ) : (
                <div className="mt-5 bg-[#F5F0E8] rounded-xl p-4 text-center">
                  <p className="text-sm text-[#7A6E62]">This item is currently out of stock</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment instructions */}
      {checkout && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full max-w-lg p-6">
            <div className="text-center mb-6">
              <p className="text-xs text-[#7A6E62] font-medium uppercase tracking-widest">Payment details</p>
              <p className="text-3xl font-bold text-[#1A1208] mt-2">{formatNaira(checkout.amount)}</p>
            </div>

            <div className="bg-[#F5F0E8] rounded-2xl p-5 flex flex-col gap-4 mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#7A6E62]">Bank</p>
                  <p className="text-sm font-semibold text-[#1A1208]">{checkout.bankName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#7A6E62]">Account name</p>
                  <p className="text-sm font-semibold text-[#1A1208]">{checkout.accountName}</p>
                </div>
              </div>

              <div className="border-t border-[#E8E0D4]" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#7A6E62]">Account number</p>
                  <p className="text-2xl font-bold text-[#1A1208] tracking-widest">{checkout.accountNumber}</p>
                </div>
                <button
                  onClick={copyAccount}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#C4973A] hover:text-[#A97E2A]"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-[#B45309] mb-5">
              <Clock size={12} />
              <span>Expires in {formatExpiry(checkout.expiresAt)}</span>
            </div>

            <p className="text-xs text-center text-[#7A6E62]">
              Transfer exactly {formatNaira(checkout.amount)} to the account above. Your order will be confirmed automatically.
            </p>

            <Button
              variant="secondary"
              onClick={() => { setCheckout(null); setSelected(null); }}
              className="w-full mt-4 h-11"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  onBuy,
  compact,
}: {
  product: Product;
  onBuy: (p: Product) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E8E0D4] overflow-hidden flex flex-col ${compact ? "w-44 shrink-0 snap-start" : ""}`}
    >
      <div className="relative">
        <div className={`bg-[#F5F0E8] ${compact ? "aspect-square" : "aspect-[4/3]"}`}>
          {product.image_url && (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          )}
        </div>
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <Badge variant="outofstock">Out of stock</Badge>
          </div>
        )}
        {product.is_best_seller && product.in_stock && (
          <Badge variant="bestseller" className="absolute top-2 left-2 text-[10px]">Best Seller</Badge>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-xs font-semibold text-[#1A1208] line-clamp-2">{product.name}</p>
        <div className="mt-auto">
          {product.sale_price ? (
            <div>
              <p className="text-sm font-bold text-[#C4973A]">{formatNaira(product.sale_price)}</p>
              <p className="text-xs text-[#B0A89E] line-through">{formatNaira(product.price)}</p>
            </div>
          ) : (
            <p className="text-sm font-bold text-[#1A1208]">{formatNaira(product.price)}</p>
          )}
          <Button
            size="sm"
            variant={product.in_stock ? "primary" : "secondary"}
            disabled={!product.in_stock}
            onClick={() => onBuy(product)}
            className="w-full mt-2 h-9 text-xs"
          >
            {product.in_stock ? "Buy now" : "Out of stock"}
          </Button>
        </div>
      </div>
    </div>
  );
}
