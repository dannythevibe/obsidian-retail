import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { StorefrontClient } from "./storefront-client";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function StorefrontPage({ params }: PageProps) {
  const { handle } = await params;
  const supabase = createServiceClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, handle, store_name, description, logo_url, banner_url, is_live")
    .eq("handle", handle)
    .single();

  if (!merchant) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*, reviews(*)")
    .eq("merchant_id", merchant.id)
    .eq("approved", true)
    .order("is_best_seller", { ascending: false })
    .order("sales_count", { ascending: false });

  return <StorefrontClient merchant={merchant} products={products ?? []} />;
}
