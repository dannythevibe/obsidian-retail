import { NextRequest, NextResponse } from "next/server";
import { createVirtualAccount } from "@/lib/payaza/client";
import { createServiceClient } from "@/lib/supabase/server";
import { generateOrderRef } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  const { productId, customerName, customerPhone, customerEmail } =
    await req.json();

  if (!productId || !customerName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, name, price, in_stock, merchant_id, merchants(handle)")
    .eq("id", productId)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.in_stock) {
    return NextResponse.json({ error: "Product is out of stock" }, { status: 409 });
  }

  const merchant = product.merchants as unknown as { handle: string };
  const reference = generateOrderRef(merchant.handle);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  // Create Payaza virtual account
  const virtualAccount = await createVirtualAccount({
    amount: product.price,
    reference,
    customerName,
    customerEmail,
    customerPhone,
    expiryMinutes: 30,
  });

  // Persist order
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      merchant_id: product.merchant_id,
      product_id: product.id,
      reference,
      customer_name: customerName,
      customer_phone: customerPhone ?? null,
      customer_email: customerEmail ?? null,
      amount: product.price,
      status: "pending",
      payaza_account_no: virtualAccount.account_number,
      payaza_bank_name: virtualAccount.bank_name,
      payaza_account_ref: virtualAccount.reference,
      expires_at: expiresAt,
    })
    .select("id, reference")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    reference: order.reference,
    amount: product.price,
    accountNumber: virtualAccount.account_number,
    bankName: virtualAccount.bank_name,
    accountName: virtualAccount.account_name,
    expiresAt,
  });
}
