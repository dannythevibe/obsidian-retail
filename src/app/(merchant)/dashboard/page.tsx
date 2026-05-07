import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/merchant/product-card";
import { formatNaira } from "@/lib/utils";
import Link from "next/link";
import { Plus, ArrowUpRight, Package, ShoppingBag, TrendingUp, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, handle, store_name, is_live")
    .eq("user_id", user!.id)
    .single();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("merchant_id", merchant!.id)
    .order("position", { ascending: true });

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("merchant_id", merchant!.id)
    .order("created_at", { ascending: false })
    .limit(5);

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
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1208]">{merchant!.store_name}</h1>
          <p className="text-sm mt-0.5">
            {merchant!.is_live
              ? <span className="text-[#2D6A4F] font-medium">● Live</span>
              : <span className="text-[#B45309] font-medium">● Not live</span>}
            <span className="text-[#B0A89E] ml-2">obsidianretail.com/store/{merchant!.handle}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/store/${merchant!.handle}`} target="_blank"
            className="flex items-center gap-1.5 text-xs font-medium text-[#7A6E62] border border-[#E8E0D4] bg-white rounded-xl px-3 py-2 hover:border-[#1A1208] transition-colors">
            View shop <ArrowUpRight size={12} />
          </a>
          <Link href="/ingest"
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#1A1208] rounded-xl px-3 py-2 hover:bg-[#2D2010] transition-colors">
            <Plus size={12} /> Import
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(({ label, value, sub, icon: Icon, accent }) => (
          <div key={label} className={`rounded-2xl p-5 flex flex-col gap-3 ${accent ? "bg-[#1A1208]" : "bg-white border border-[#E8E0D4]"}`}>
            <div className="flex items-center justify-between">
              <p className={`text-xs font-medium ${accent ? "text-[#B0A89E]" : "text-[#7A6E62]"}`}>{label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent ? "bg-white/10" : "bg-[#F5F0E8]"}`}>
                <Icon size={14} className={accent ? "text-[#C4973A]" : "text-[#7A6E62]"} />
              </div>
            </div>
            <div>
              <p className={`text-2xl font-bold tracking-tight ${accent ? "text-white" : "text-[#1A1208]"}`}>{value}</p>
              <p className={`text-xs mt-0.5 ${accent ? "text-[#7A6E62]" : "text-[#B0A89E]"}`}>{sub}</p>
            </div>
          </div>
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
