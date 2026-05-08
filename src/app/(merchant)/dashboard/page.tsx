import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

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

  return (
    <DashboardClient 
      merchant={merchant as any} 
      products={products ?? []} 
      orders={orders ?? []} 
    />
  );
}
