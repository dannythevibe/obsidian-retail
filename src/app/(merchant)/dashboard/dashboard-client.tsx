"use client";

import { motion } from "framer-motion";
import { ProductCard } from "@/components/merchant/product-card";
import { formatNaira } from "@/lib/utils";
import Link from "next/link";
import { Plus, ArrowUpRight, Package, ShoppingBag, TrendingUp, Clock } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number | null;
  category?: string | null;
  image_url?: string | null;
  in_stock: boolean;
  approved: boolean;
  sales_count: number;
  ai_confidence?: number | null;
  position?: number;
}

interface Order {
  id: string;
  customer_name: string | null;
  reference: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Merchant {
  id: string;
  handle: string;
  store_name: string;
  is_live: boolean;
}

interface DashboardClientProps {
  merchant: Merchant;
  products: Product[];
  orders: Order[];
}

export function DashboardClient({ merchant, products, orders }: DashboardClientProps) {
  const approved = products?.filter((p) => p.approved) ?? [];
  const pending  = products?.filter((p) => !p.approved) ?? [];
  const paidOrders = orders?.filter((o) => o.status === "paid") ?? [];
  const totalRevenue = paidOrders.reduce((s, o) => s + o.amount, 0);
  const pendingRevenue = orders?.filter((o) => o.status === "pending").reduce((s, o) => s + o.amount, 0) ?? 0;
  const bestSeller = [...approved].sort((a, b) => b.sales_count - a.sales_count)[0];

  const metrics = [
    { label: "Total products",    value: approved.length,         sub: `${pending.length} pending review`, icon: Package,     accent: false },
    { label: "Revenue earned",    value: formatNaira(totalRevenue), sub: `${paidOrders.length} paid orders`,  icon: TrendingUp,  accent: true  },
    { label: "Pending payments",  value: formatNaira(pendingRevenue), sub: "Awaiting transfer",               icon: Clock,       accent: false },
    { label: "Total orders",      value: orders?.length ?? 0,     sub: "All time",                            icon: ShoppingBag, accent: false },
  ];

  return (
    <div className="flex flex-col gap-8 pb-20">

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-black text-[#1A1208] tracking-tighter uppercase">{merchant.store_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {merchant.is_live ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-[#2D6A4F] uppercase tracking-widest bg-[#D1FAE5] px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#2D6A4F] rounded-full animate-pulse" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-[#B45309] uppercase tracking-widest bg-[#FEF3C7] px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#B45309] rounded-full" /> Offline
              </span>
            )}
            <span className="text-[10px] font-bold text-[#B0A89E] uppercase tracking-widest">obsidianretail.com/store/{merchant.handle}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href={`/store/${merchant.handle}`} target="_blank"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#7A6E62] border border-[#E8E0D4] bg-white rounded-2xl px-5 py-3.5 hover:border-[#1A1208] transition-all shadow-sm hover:shadow-md">
            View Shop <ArrowUpRight size={14} />
          </a>
          <Link href="/ingest"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-[#1A1208] rounded-2xl px-5 py-3.5 hover:bg-black transition-all shadow-xl shadow-[#1A1208]/20 group">
            <Plus size={14} className="group-hover:rotate-90 transition-transform" /> Import Products
          </Link>
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, sub, icon: Icon, accent }, idx) => (
          <motion.div 
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`rounded-[2.5rem] p-8 flex flex-col gap-6 transition-all duration-500 hover:scale-[1.02] ${accent ? "bg-[#1A1208] shadow-2xl shadow-[#1A1208]/30" : "bg-white border border-[#E8E0D4] shadow-sm hover:shadow-premium"}`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accent ? "bg-white/10" : "bg-[#F5F0E8]"}`}>
                <Icon size={20} className={accent ? "text-[#C4973A]" : "text-[#7A6E62]"} />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${accent ? "text-[#B0A89E]" : "text-[#7A6E62]"}`}>{label}</p>
            </div>
            <div>
              <p className={`text-3xl font-black tracking-tighter ${accent ? "text-white" : "text-[#1A1208]"}`}>{value}</p>
              <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${accent ? "text-[#7A6E62]" : "text-[#B0A89E]"}`}>{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">

        {/* Sales bar chart — CSS only */}
        <div className="lg:col-span-2 bg-white border border-[#E8E0D4] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-[#1A1208]">Product performance</h2>
            <span className="text-xs text-[#B0A89E]">By sales count</span>
          </div>
          {approved.length === 0 ? (
            <div className="h-32 flex items-center justify-center">
              <p className="text-sm text-[#B0A89E]">No products live yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...approved].sort((a, b) => b.sales_count - a.sales_count).slice(0, 5).map((p) => {
                const max = Math.max(...approved.map((x) => x.sales_count), 1);
                const pct = Math.round((p.sales_count / max) * 100);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <p className="text-xs text-[#7A6E62] w-28 truncate shrink-0">{p.name}</p>
                    <div className="flex-1 h-2 bg-[#F5F0E8] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C4973A] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-[#1A1208] w-6 text-right shrink-0">{p.sales_count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Best seller spotlight */}
        <div className="bg-[#1A1208] rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white">Best seller</h2>
          {bestSeller ? (
            <>
              <div className="aspect-video rounded-xl bg-white/10 overflow-hidden">
                {bestSeller.image_url && (
                  <img src={bestSeller.image_url} alt="" className="w-full h-full object-cover opacity-90" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white truncate">{bestSeller.name}</p>
                <p className="text-lg font-bold text-[#C4973A] mt-0.5">{formatNaira(bestSeller.price)}</p>
                <p className="text-xs text-[#7A6E62] mt-1">{bestSeller.sales_count} sold · {bestSeller.category}</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-[#7A6E62]">No sales yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      {orders && orders.length > 0 && (
        <div className="bg-white border border-[#E8E0D4] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F0E8]">
            <h2 className="text-sm font-semibold text-[#1A1208]">Recent orders</h2>
            <Link href="/orders" className="text-xs text-[#C4973A] font-medium">View all</Link>
          </div>
          <div className="divide-y divide-[#F5F0E8]">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-[#1A1208]">{o.customer_name ?? "Customer"}</p>
                  <p className="text-xs text-[#B0A89E]">{o.reference}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1A1208]">{formatNaira(o.amount)}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    o.status === "paid" ? "bg-[#D1FAE5] text-[#065F46]" :
                    o.status === "fulfilled" ? "bg-[#DBEAFE] text-[#1E40AF]" :
                    "bg-[#FEF3C7] text-[#B45309]"
                  }`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending approval */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-[#1A1208]">Needs your approval</h2>
            <span className="bg-[#FEF3C7] text-[#B45309] text-xs font-semibold px-2 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {pending.map((p) => <ProductCard key={p.id} product={p} pending />)}
          </div>
        </div>
      )}

      {/* Live products */}
      {approved.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#1A1208] mb-3">Live products</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {approved.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {approved.length === 0 && pending.length === 0 && (
        <div className="bg-[#F5F0E8] rounded-2xl p-10 text-center">
          <p className="text-sm text-[#7A6E62]">No products yet.</p>
          <Link href="/ingest" className="mt-4 inline-flex items-center gap-2 bg-[#1A1208] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#2D2010] transition-colors">
            <Plus size={14} /> Import your first products
          </Link>
        </div>
      )}
    </div>
  );
}
