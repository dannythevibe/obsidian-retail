"use client";

import { useState, useEffect, useCallback } from "react";
import { formatNaira } from "@/lib/utils";
import {
  ShoppingBag, X, Plus, Minus, Copy, Check, Clock,
  Search, Star, Truck, RotateCcw, Headphones, CreditCard, ChevronRight,
} from "lucide-react";

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
  variants?: string[] | null;
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

interface CartItem {
  product: Product;
  quantity: number;
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

const TRUST_BADGES = [
  { icon: Truck,       label: "Free Delivery",    sub: "On orders above ₦50,000" },
  { icon: RotateCcw,   label: "Easy Returns",      sub: "Within 7 days" },
  { icon: Headphones,  label: "Online Support",    sub: "24 hours a day" },
  { icon: CreditCard,  label: "Secure Payment",    sub: "Powered by Payaza" },
];

function Stars({ count = 0 }: { count: number }) {
  const rating = count > 0 ? 4.5 : 4.0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={10}
          className={i <= Math.floor(rating) ? "fill-[#C4973A] text-[#C4973A]" : "fill-[#E8E0D4] text-[#E8E0D4]"}
        />
      ))}
      <span className="text-[10px] text-[#7A6E62] ml-1">({count})</span>
    </div>
  );
}

export function StorefrontClient({ merchant, products }: { merchant: Merchant; products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Checkout state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + (i.product.sale_price ?? i.product.price) * i.quantity, 0);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];
  const heroProduct = products.find((p) => p.is_best_seller && p.image_url) ?? products.find((p) => p.image_url);
  const featuredProducts = [...products].filter((p) => p.in_stock).slice(0, 8);

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  // Countdown timer
  useEffect(() => {
    if (!checkout) return;
    const tick = () => {
      const diff = new Date(checkout.expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkout]);

  function addToCart(product: Product, qty = 1) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { product, quantity: qty }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => i.product.id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        customerName,
        customerPhone,
        customerEmail,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setCheckout(data);
    setCheckoutOpen(false);
  }

  function copyAccount() {
    if (!checkout) return;
    navigator.clipboard.writeText(checkout.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function resetCheckout() {
    setCheckout(null);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCartOpen(false);
  }

  const initials = merchant.store_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Announcement bar */}
      <div className="bg-[#1A1208] text-white text-center py-2 text-xs font-medium tracking-wide">
        Free shipping on all orders above ₦50,000 &nbsp;·&nbsp; Powered by Payaza
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            {merchant.logo_url ? (
              <img src={merchant.logo_url} alt={merchant.store_name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#C4973A] flex items-center justify-center text-white text-sm font-bold">{initials}</div>
            )}
            <span className="text-sm font-bold text-[#1A1208] tracking-tight">{merchant.store_name}</span>
          </div>

          {/* Category nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm text-[#7A6E62] ml-4">
            <button onClick={() => setActiveCategory(null)} className={`hover:text-[#1A1208] transition-colors ${!activeCategory ? "text-[#1A1208] font-semibold" : ""}`}>
              All Products
            </button>
            {categories.slice(0, 4).map((c) => (
              <button key={c} onClick={() => setActiveCategory(c === activeCategory ? null : c)}
                className={`hover:text-[#1A1208] transition-colors capitalize ${activeCategory === c ? "text-[#1A1208] font-semibold" : ""}`}>
                {c}
              </button>
            ))}
          </nav>

          {/* Search */}
          <div className="flex-1 hidden lg:flex justify-center">
            <div className="relative w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A89E]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#E8E0D4] bg-[#FAF7F2] focus:outline-none focus:border-[#C4973A] transition-colors"
              />
            </div>
          </div>

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative ml-auto flex items-center gap-2 bg-[#1A1208] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#2D2010] transition-colors"
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#C4973A] rounded-full text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0 -z-10">
          <img src="/hero_bg.png" alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-[#FAF7F2]/70" />
        </div>
        <div className="max-w-6xl mx-auto px-4 lg:px-8 flex items-center min-h-[420px] lg:min-h-[500px]">
          <div className="flex-1 py-12 lg:py-16 z-10 relative">
            <p className="text-xs font-semibold text-[#C4973A] uppercase tracking-widest mb-3">New Collection</p>
            <h1 className="text-4xl lg:text-6xl font-bold text-[#1A1208] leading-tight max-w-lg">
              {merchant.store_name}
            </h1>
            <p className="text-base text-[#7A6E62] mt-4 max-w-sm leading-relaxed">
              {merchant.description ?? "Discover our curated collection of premium products, crafted for you."}
            </p>
            <button
              onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-8 inline-flex items-center gap-2 bg-[#1A1208] text-white px-7 py-3.5 rounded-xl text-sm font-semibold hover:bg-[#2D2010] transition-colors"
            >
              Shop Now <ChevronRight size={16} />
            </button>
          </div>

          {/* Hero product image */}
          {heroProduct?.image_url && (
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[45%]">
              <img
                src={heroProduct.image_url}
                alt={heroProduct.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/90 via-[#FAF7F2]/40 to-transparent" />
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#1A1208]">Our Featured Products</h2>
          {merchant.description && (
            <p className="text-sm text-[#7A6E62] mt-2">{merchant.description}</p>
          )}
        </div>

        {/* Mobile search */}
        <div className="lg:hidden mb-6 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A89E]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#E8E0D4] focus:outline-none focus:border-[#C4973A] transition-colors"
          />
        </div>

        {/* Category pills (mobile) */}
        {categories.length > 0 && (
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!activeCategory ? "bg-[#1A1208] text-white border-[#1A1208]" : "bg-white text-[#7A6E62] border-[#E8E0D4]"}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c === activeCategory ? null : c)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${activeCategory === c ? "bg-[#1A1208] text-white border-[#1A1208]" : "bg-white text-[#7A6E62] border-[#E8E0D4]"}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#B0A89E]">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={() => setSelected(product)}
                onAddToCart={(p) => { addToCart(p); setCartOpen(true); }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Promo banners */}
      {products.length >= 2 && (
        <section className="max-w-6xl mx-auto px-4 lg:px-8 pb-16">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* New Collection */}
            <div className="relative bg-[#F5F0E8] rounded-2xl overflow-hidden h-52 flex items-center">
              <div className="relative z-10 p-8">
                <p className="text-xs font-semibold text-[#C4973A] uppercase tracking-widest">New Collection</p>
                <h3 className="text-xl font-bold text-[#1A1208] mt-1 leading-snug">
                  {products[0]?.name ?? "Latest Arrivals"}
                </h3>
                <button
                  onClick={() => setSelected(products[0])}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A1208] underline underline-offset-2"
                >
                  Explore More <ChevronRight size={14} />
                </button>
              </div>
              {products[0]?.image_url && (
                <div className="absolute right-0 top-0 bottom-0 w-1/2">
                  <img src={products[0].image_url} alt="" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F5F0E8] via-transparent to-transparent" />
                </div>
              )}
            </div>

            {/* Sale banner */}
            <div className="relative bg-[#1A1208] rounded-2xl overflow-hidden h-52 flex items-center">
              <div className="relative z-10 p-8">
                <p className="text-3xl font-bold text-[#C4973A]">
                  {products.some((p) => p.sale_price) ? "Sale On!" : "Best Sellers"}
                </p>
                <p className="text-sm text-[#B0A89E] mt-1 max-w-xs">
                  {products.some((p) => p.sale_price)
                    ? "Shop discounted products before they're gone."
                    : "Our most-loved products, picked for you."}
                </p>
                <button
                  onClick={() => setActiveCategory(null)}
                  className="mt-4 inline-flex items-center gap-2 bg-white text-[#1A1208] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#FAF7F2] transition-colors"
                >
                  Shop Now
                </button>
              </div>
              {products[1]?.image_url && (
                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30">
                  <img src={products[1].image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Trust badges */}
      <section className="border-t border-[#F5F0E8] bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl border border-[#E8E0D4] flex items-center justify-center">
                  <Icon size={22} className="text-[#1A1208]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1208]">{label}</p>
                  <p className="text-xs text-[#7A6E62] mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      {products.some((p) => p.reviews.length > 0) && (
        <section className="bg-[#FAF7F2] py-16">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-[#1A1208] mb-10">What customers say</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              {products
                .filter((p) => p.reviews.length > 0)
                .slice(0, 3)
                .map((p) => (
                  <div key={p.id} className="bg-white rounded-2xl p-6 text-left shadow-sm border border-[#E8E0D4]">
                    <Stars count={p.reviews.length} />
                    <p className="text-sm text-[#1A1208] mt-3 leading-relaxed">
                      "{p.reviews[0].body}"
                    </p>
                    <p className="text-xs text-[#7A6E62] mt-3 font-medium">— Verified buyer · {p.name}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#1A1208] text-white py-8">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {merchant.logo_url ? (
              <img src={merchant.logo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#C4973A] flex items-center justify-center text-xs font-bold">{initials}</div>
            )}
            <span className="text-sm font-bold">{merchant.store_name}</span>
          </div>
          <p className="text-xs text-[#7A6E62]">Powered by Obsidian Retail · Payments by Payaza</p>
        </div>
      </footer>

      {/* ── CART DRAWER ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F0E8]">
              <h2 className="text-base font-bold text-[#1A1208]">Your Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="text-[#7A6E62] hover:text-[#1A1208]">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center pt-20 gap-3">
                  <ShoppingBag size={40} className="text-[#E8E0D4]" strokeWidth={1} />
                  <p className="text-sm text-[#7A6E62]">Your cart is empty</p>
                  <button onClick={() => setCartOpen(false)} className="text-xs font-semibold text-[#C4973A] underline">
                    Continue shopping
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cart.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-3 items-start">
                      <div className="w-16 h-16 rounded-xl bg-[#F5F0E8] overflow-hidden shrink-0">
                        {product.image_url && (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1A1208] line-clamp-1">{product.name}</p>
                        <p className="text-sm font-bold text-[#C4973A] mt-0.5">{formatNaira(product.sale_price ?? product.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQty(product.id, -1)}
                            className="w-7 h-7 rounded-lg border border-[#E8E0D4] flex items-center justify-center hover:bg-[#F5F0E8]"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
                          <button
                            onClick={() => updateQty(product.id, 1)}
                            className="w-7 h-7 rounded-lg border border-[#E8E0D4] flex items-center justify-center hover:bg-[#F5F0E8]"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(product.id)} className="text-[#B0A89E] hover:text-[#1A1208] mt-0.5">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-5 py-5 border-t border-[#F5F0E8]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[#7A6E62]">Subtotal</p>
                  <p className="text-lg font-bold text-[#1A1208]">{formatNaira(cartTotal)}</p>
                </div>
                <button
                  onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                  className="w-full bg-[#1A1208] text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-[#2D2010] transition-colors"
                >
                  Checkout — {formatNaira(cartTotal)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PRODUCT DETAIL MODAL ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl lg:rounded-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-[#7A6E62] hover:text-[#1A1208]"
            >
              <X size={16} />
            </button>

            {selected.image_url && (
              <div className="aspect-square bg-[#F5F0E8] relative">
                <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover" />
                {selected.sale_price && (
                  <div className="absolute top-4 left-4 bg-[#C4973A] text-white text-xs font-bold px-2 py-1 rounded-lg">
                    SALE
                  </div>
                )}
              </div>
            )}

            <div className="p-6">
              {selected.category && (
                <p className="text-xs font-semibold text-[#C4973A] uppercase tracking-widest mb-1">{selected.category}</p>
              )}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold text-[#1A1208] flex-1">{selected.name}</h3>
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

              <Stars count={selected.reviews.length} />

              {selected.description && (
                <p className="text-sm text-[#7A6E62] mt-3 leading-relaxed">{selected.description}</p>
              )}

              {selected.variants && selected.variants.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-[#1A1208] mb-2">Options</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.variants.map((v) => (
                      <span key={v} className="text-xs border border-[#E8E0D4] rounded-lg px-3 py-1 text-[#7A6E62]">{v}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.reviews.length > 0 && (
                <div className="mt-4 bg-[#F5F0E8] rounded-xl p-4 flex flex-col gap-2">
                  {selected.reviews.slice(0, 2).map((r) => (
                    <p key={r.id} className="text-xs text-[#1A1208] italic">"{r.body}"</p>
                  ))}
                </div>
              )}

              {selected.in_stock ? (
                <button
                  onClick={() => { addToCart(selected); setSelected(null); setCartOpen(true); }}
                  className="w-full mt-5 bg-[#1A1208] text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-[#2D2010] transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} /> Add to Cart — {formatNaira(selected.sale_price ?? selected.price)}
                </button>
              ) : (
                <div className="mt-5 bg-[#F5F0E8] rounded-xl p-4 text-center">
                  <p className="text-sm text-[#7A6E62]">Out of stock</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CHECKOUT FORM ── */}
      {checkoutOpen && !checkout && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCheckoutOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-t-3xl lg:rounded-2xl p-6">
            <button
              onClick={() => setCheckoutOpen(false)}
              className="absolute top-4 right-4 text-[#7A6E62] hover:text-[#1A1208]"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-[#1A1208] mb-1">Complete your order</h2>
            <p className="text-sm text-[#7A6E62] mb-5">
              {cartCount} item{cartCount !== 1 ? "s" : ""} · Total: <strong className="text-[#1A1208]">{formatNaira(cartTotal)}</strong>
            </p>

            <form onSubmit={handleCheckout} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#7A6E62]">Full name *</label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Amara Johnson"
                  className="w-full border border-[#E8E0D4] rounded-xl px-4 py-3 text-sm text-[#1A1208] placeholder:text-[#B0A89E] focus:outline-none focus:border-[#C4973A] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#7A6E62]">Phone number *</label>
                <input
                  required
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08012345678"
                  className="w-full border border-[#E8E0D4] rounded-xl px-4 py-3 text-sm text-[#1A1208] placeholder:text-[#B0A89E] focus:outline-none focus:border-[#C4973A] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#7A6E62]">Email (optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full border border-[#E8E0D4] rounded-xl px-4 py-3 text-sm text-[#1A1208] placeholder:text-[#B0A89E] focus:outline-none focus:border-[#C4973A] transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A1208] text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-[#2D2010] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating payment...
                  </span>
                ) : (
                  <>Pay {formatNaira(cartTotal)}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── PAYMENT SCREEN ── */}
      {checkout && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white w-full max-w-md rounded-t-3xl lg:rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={24} className="text-[#065F46]" />
              </div>
              <p className="text-xs text-[#7A6E62] font-medium uppercase tracking-widest">Transfer to pay</p>
              <p className="text-4xl font-bold text-[#1A1208] mt-1">{formatNaira(checkout.amount)}</p>
            </div>

            <div className="bg-[#F5F0E8] rounded-2xl p-5 flex flex-col gap-4 mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#7A6E62]">Bank</p>
                  <p className="text-sm font-bold text-[#1A1208]">{checkout.bankName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#7A6E62]">Account name</p>
                  <p className="text-sm font-bold text-[#1A1208]">{checkout.accountName}</p>
                </div>
              </div>
              <div className="h-px bg-[#E8E0D4]" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#7A6E62] mb-0.5">Account number</p>
                  <p className="text-3xl font-bold text-[#1A1208] tracking-widest">{checkout.accountNumber}</p>
                </div>
                <button
                  onClick={copyAccount}
                  className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${copied ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#1A1208] text-white hover:bg-[#2D2010]"}`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {timeLeft && timeLeft !== "Expired" && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-[#B45309] font-medium mb-4">
                <Clock size={14} />
                <span>Expires in {timeLeft}</span>
              </div>
            )}

            <p className="text-xs text-center text-[#7A6E62] mb-4">
              Transfer exactly <strong>{formatNaira(checkout.amount)}</strong> to this account.
              Your order will be confirmed automatically once payment is received.
            </p>

            <p className="text-[10px] text-center text-[#B0A89E] mb-4">Ref: {checkout.reference}</p>

            <button
              onClick={resetCheckout}
              className="w-full border border-[#E8E0D4] text-[#7A6E62] py-3 rounded-xl text-sm font-medium hover:bg-[#F5F0E8] transition-colors"
            >
              Done — I've sent the payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  onView,
  onAddToCart,
}: {
  product: Product;
  onView: () => void;
  onAddToCart: (p: Product) => void;
}) {
  const displayPrice = product.sale_price ?? product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  return (
    <div className="group cursor-pointer" onClick={onView}>
      <div className="relative bg-[#F5F0E8] rounded-2xl overflow-hidden aspect-square mb-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#B0A89E]">
            <ShoppingBag size={32} strokeWidth={1} />
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-[#C4973A] text-white text-[10px] font-bold px-2 py-1 rounded-lg">
            -{discountPct}%
          </div>
        )}
        {product.is_best_seller && (
          <div className="absolute top-2 right-2 bg-[#1A1208] text-white text-[10px] font-bold px-2 py-1 rounded-lg">
            ★ Best
          </div>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-[#7A6E62] bg-white px-3 py-1 rounded-full border border-[#E8E0D4]">
              Out of stock
            </span>
          </div>
        )}
        {/* Quick add button */}
        {product.in_stock && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className="absolute bottom-2 right-2 w-8 h-8 bg-[#1A1208] text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <div className="px-1">
        <p className="text-xs font-semibold text-[#1A1208] line-clamp-2 mb-1 leading-snug">{product.name}</p>
        <Stars count={product.reviews.length} />
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-sm font-bold text-[#1A1208]">{formatNaira(displayPrice)}</p>
          {hasDiscount && (
            <p className="text-xs text-[#B0A89E] line-through">{formatNaira(product.price)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
