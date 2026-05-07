import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, type WebhookPayload } from "@/lib/payaza/client";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-payaza-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: WebhookPayload = JSON.parse(rawBody);
  
  if (!payload || !payload.data) {
    console.error("[Webhook] Invalid payload structure:", payload);
    return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
  }

  if (payload.event !== "transaction.successful") {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();
  const payazaRef = payload.data.transaction_reference;
  const orderRef = payload.data.merchant_reference;

  if (!payazaRef || !orderRef) {
    console.error("[Webhook] Missing references in payload");
    return NextResponse.json({ error: "Missing references" }, { status: 400 });
  }

  // Idempotency check — never process the same transaction twice
  const { data: existing } = await supabase
    .from("payaza_transactions")
    .select("id")
    .eq("payaza_ref", payazaRef)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Find the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, merchant_id, product_id, amount")
    .eq("reference", orderRef)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Update order to paid
  await supabase
    .from("orders")
    .update({
      status: "paid",
      paid_at: payload.data.payment_date,
    })
    .eq("id", order.id);

  // Increment product sales count
  if (order.product_id) {
    await supabase.rpc("increment_sales", { product_id: order.product_id });
  }

  // Record the transaction for audit trail
  await supabase.from("payaza_transactions").insert({
    order_id: order.id,
    merchant_id: order.merchant_id,
    payaza_ref: payazaRef,
    amount: payload.data.amount,
    status: payload.data.status,
    raw_payload: payload as unknown as Record<string, unknown>,
  });

  return NextResponse.json({ received: true });
}
