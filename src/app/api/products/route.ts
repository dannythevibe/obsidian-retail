import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!merchant) {
    return new Response("Merchant not found", { status: 404 });
  }

  const body = await req.json();
  const { name, price, category, image_url, approved } = body;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      merchant_id: merchant.id,
      name,
      price,
      category: category || "Uncategorized",
      image_url: image_url || null,
      approved: approved ?? false,
      in_stock: true,
      sales_count: 0,
      position: 0 // Will be handled by DB or set to 0
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(product);
}
