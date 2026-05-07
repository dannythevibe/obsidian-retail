import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, products(name, image_url)")
    .eq("merchant_id", merchant!.id)
    .order("created_at", { ascending: false });

  const statusVariant = (s: string) => {
    if (s === "paid" || s === "fulfilled") return "paid";
    if (s === "pending") return "pending";
    return "failed";
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#1A1208]">Orders</h1>

      {!orders?.length ? (
        <div className="bg-[#F5F0E8] rounded-2xl p-10 text-center">
          <p className="text-sm text-[#7A6E62]">No orders yet. Share your shop link to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => {
            const product = order.products as unknown as { name: string; image_url: string } | null;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-[#E8E0D4] p-4 flex items-center gap-4">
                {/* Product image */}
                <div className="w-12 h-12 rounded-xl bg-[#F5F0E8] shrink-0 overflow-hidden">
                  {product?.image_url && (
                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1208] truncate">
                    {product?.name ?? "Product"}
                  </p>
                  <p className="text-xs text-[#7A6E62] mt-0.5">
                    {order.customer_name ?? "Anonymous"} · {order.reference}
                  </p>
                </div>

                {/* Amount + status */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-sm font-bold text-[#1A1208]">{formatNaira(order.amount)}</span>
                  <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
