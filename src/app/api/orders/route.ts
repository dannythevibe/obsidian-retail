import { NextRequest, NextResponse } from "next/server";
import { createVirtualAccount } from "@/lib/payaza/client";
import { createServiceClient } from "@/lib/supabase/server";
import { generateOrderRef } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();

  const { customerName, customerPhone, customerEmail } = body;

  if (!customerName) {
    return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
  }

  // ── Single product (legacy) ──────────────────────────────────────
  if (body.productId) {
    const { data: product } = await supabase
      .from("products")
      .select("id, name, price, in_stock, merchant_id, merchants(handle)")
      .eq("id", body.productId)
      .single();

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (!product.in_stock) return NextResponse.json({ error: "Product is out of stock" }, { status: 409 });

    const merchant = product.merchants as unknown as { handle: string };
    const reference = generateOrderRef(merchant.handle);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const virtualAccount = await createVirtualAccount({
      amount: product.price,
      reference,
      customerName,
      customerEmail,
      customerPhone,
      expiryMinutes: 30,
    });

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

    if (error) return NextResponse.json({ error: "Failed to create order" }, { status: 500 });

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

  // ── Cart checkout ────────────────────────────────────────────────
  const items: { productId: string; quantity: number }[] = body.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({ error: "No items in cart" }, { status: 400 });
  }

  const productIds = items.map((i) => i.productId);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, sale_price, in_stock, merchant_id, merchants(handle)")
    .in("id", productIds);

  if (!products || products.length === 0) {
    return NextResponse.json({ error: "Products not found" }, { status: 404 });
  }

  const outOfStock = products.find((p) => !p.in_stock);
  if (outOfStock) {
    return NextResponse.json({ error: `"${outOfStock.name}" is out of stock` }, { status: 409 });
  }

  // Calculate total (respecting sale prices and quantities)
  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return sum;
    const price = product.sale_price ?? product.price;
    return sum + price * item.quantity;
  }, 0);

  const firstProduct = products[0];
  const merchant = firstProduct.merchants as unknown as { handle: string };
  const reference = generateOrderRef(merchant.handle);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const virtualAccount = await createVirtualAccount({
    amount: total,
    reference,
    customerName,
    customerEmail,
    customerPhone,
    expiryMinutes: 30,
  });

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      merchant_id: firstProduct.merchant_id,
      product_id: null,
      reference,
      customer_name: customerName,
      customer_phone: customerPhone ?? null,
      customer_email: customerEmail ?? null,
      amount: total,
      status: "pending",
      payaza_account_no: virtualAccount.account_number,
      payaza_bank_name: virtualAccount.bank_name,
      payaza_account_ref: virtualAccount.reference,
      expires_at: expiresAt,
    })
    .select("id, reference")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create order" }, { status: 500 });

  return NextResponse.json({
    orderId: order.id,
    reference: order.reference,
    amount: total,
    accountNumber: virtualAccount.account_number,
    bankName: virtualAccount.bank_name,
    accountName: virtualAccount.account_name,
    expiresAt,
  });
}
