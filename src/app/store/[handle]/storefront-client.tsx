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
  const [customerAddress, setCustomerAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [showTicket, setShowTicket] = useState(false);

  // ... exists ...

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
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
    } catch (err) {
      setLoading(false);
      setError("Network error. Please check your connection.");
    }
  }

  // ... exists ...

  function resetCheckout() {
    setCheckout(null);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setCartOpen(false);
    setShowTicket(false);
  }

  // ... exists ...

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Announcement bar ... */}
      
      {/* ... header, hero, products ... */}

      {/* ── CHECKOUT FORM ── */}
      {checkoutOpen && !checkout && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCheckoutOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-t-3xl lg:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#7A6E62]">Full name *</label>
                  <input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Amara Johnson"
                    className="w-full border border-[#E8E0D4] rounded-xl px-4 py-3 text-sm text-[#1A1208] focus:outline-none focus:border-[#C4973A] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#7A6E62]">Phone *</label>
                  <input
                    required
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full border border-[#E8E0D4] rounded-xl px-4 py-3 text-sm text-[#1A1208] focus:outline-none focus:border-[#C4973A] transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#7A6E62]">Email (optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full border border-[#E8E0D4] rounded-xl px-4 py-3 text-sm text-[#1A1208] focus:outline-none focus:border-[#C4973A] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#7A6E62]">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Enter your full street address, city and state"
                  className="w-full border border-[#E8E0D4] rounded-xl px-4 py-3 text-sm text-[#1A1208] resize-none focus:outline-none focus:border-[#C4973A] transition-colors"
                />
              </div>

              {error && (
                <div className="flex gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-xs border border-red-100">
                  <X size={14} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A1208] text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-[#2D2010] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#1A1208]/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Payaza Account...
                  </span>
                ) : (
                  <>Complete Payment — {formatNaira(cartTotal)}</>
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
          <div className="relative bg-white w-full max-w-md rounded-t-3xl lg:rounded-2xl p-6 shadow-2xl overflow-hidden">
            
            {showTicket ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setShowTicket(false)} className="text-[#7A6E62] hover:text-[#1A1208] flex items-center gap-1 text-sm font-medium">
                    ← Back
                  </button>
                  <h3 className="text-sm font-bold text-[#1A1208] uppercase tracking-widest">Order Ticket</h3>
                  <div className="w-10" />
                </div>

                <div className="bg-[#FAF7F2] border-2 border-dashed border-[#E8E0D4] p-6 rounded-2xl relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full border border-[#E8E0D4]" />
                  <div className="text-center mb-6">
                    <p className="text-[10px] font-bold text-[#C4973A] uppercase tracking-widest mb-1">{merchant.store_name}</p>
                    <p className="text-xs text-[#7A6E62]">{new Date().toLocaleDateString()}</p>
                    <p className="text-xl font-bold text-[#1A1208] mt-2">#{checkout.reference.split("-").pop()}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between text-xs">
                        <span className="text-[#7A6E62]">{item.quantity}x {item.product.name}</span>
                        <span className="font-bold text-[#1A1208]">{formatNaira((item.product.sale_price ?? item.product.price) * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="h-px bg-[#E8E0D4] border-t border-dashed" />
                    <div className="flex justify-between text-sm font-bold">
                      <span>Total</span>
                      <span>{formatNaira(checkout.amount)}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#7A6E62] space-y-1">
                    <p><strong>Customer:</strong> {customerName}</p>
                    <p><strong>Phone:</strong> {customerPhone}</p>
                    <p className="line-clamp-2"><strong>Address:</strong> {customerAddress}</p>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-[#E8E0D4] text-center">
                    <div className="w-full aspect-[4/1] bg-white border border-[#E8E0D4] rounded-lg flex items-center justify-center">
                      <span className="text-[10px] font-mono text-[#B0A89E] uppercase tracking-[0.5em]">{checkout.reference}</span>
                    </div>
                    <p className="text-[9px] text-[#B0A89E] mt-3 italic">Keep this ticket as proof of order. Your items will be shipped after payment verification.</p>
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="w-full mt-6 bg-[#1A1208] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#2D2010] transition-colors"
                >
                  Download / Print Ticket
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={24} className="text-[#065F46]" />
                  </div>
                  <p className="text-xs text-[#7A6E62] font-medium uppercase tracking-widest">Pay via Bank Transfer</p>
                  <p className="text-4xl font-bold text-[#1A1208] mt-1">{formatNaira(checkout.amount)}</p>
                </div>

                <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#E8E0D4] flex flex-col gap-4 mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#7A6E62] uppercase font-bold tracking-wider">Bank Name</p>
                      <p className="text-sm font-bold text-[#1A1208]">{checkout.bankName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#7A6E62] uppercase font-bold tracking-wider">Account Name</p>
                      <p className="text-sm font-bold text-[#1A1208] line-clamp-1">{checkout.accountName}</p>
                    </div>
                  </div>
                  <div className="h-px bg-[#E8E0D4]" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#7A6E62] uppercase font-bold tracking-wider mb-1">Account Number</p>
                      <p className="text-3xl font-bold text-[#1A1208] tracking-widest">{checkout.accountNumber}</p>
                    </div>
                    <button
                      onClick={copyAccount}
                      className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${copied ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#1A1208] text-white shadow-md shadow-[#1A1208]/20"}`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2 text-xs text-[#B45309] font-bold bg-orange-50 px-3 py-2 rounded-lg">
                    <Clock size={14} />
                    <span>Expires in {timeLeft}</span>
                  </div>
                  <button onClick={() => setShowTicket(true)} className="text-xs font-bold text-[#C4973A] hover:underline flex items-center gap-1">
                    View Order Ticket →
                  </button>
                </div>

                <p className="text-xs text-center text-[#7A6E62] mb-6 leading-relaxed">
                  Please transfer exactly <strong>{formatNaira(checkout.amount)}</strong>. Your order will be processed as soon as we receive your payment.
                </p>

                <button
                  onClick={resetCheckout}
                  className="w-full bg-[#1A1208] text-white py-4 rounded-xl text-sm font-bold hover:bg-[#2D2010] transition-all shadow-xl shadow-[#1A1208]/20"
                >
                  I have made the transfer
                </button>
              </div>
            )}
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
