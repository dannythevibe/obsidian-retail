import { NextRequest, NextResponse } from "next/server";
import { parseProductFromImage } from "@/lib/ai/catalog-parser";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

  const formData = await req.formData();
  const caption = (formData.get("text") as string) ?? "";
  const files = formData.getAll("media").filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No images received" }, { status: 400 });
  }

  const processedProducts = await Promise.all(
    files.map(async (file) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "image/jpeg";

        const parsed = await parseProductFromImage({
          imageBase64: base64,
          mimeType,
          caption,
          source: "whatsapp",
        });

        // Upload image
        const fileName = `${merchant.id}/wa-${Date.now()}-${Math.random().toString(36).slice(2)}.${mimeType.split("/")[1]}`;
        await supabase.storage
          .from("product-images")
          .upload(fileName, file, { contentType: mimeType });

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        const { data: product } = await supabase
          .from("products")
          .insert({
            merchant_id: merchant.id,
            name: parsed.name,
            description: parsed.description,
            price: parsed.price,
            category: parsed.category,
            image_url: publicUrl,
            in_stock: parsed.in_stock,
            source: "whatsapp",
            ai_confidence: parsed.ai_confidence,
            approved: false,
          })
          .select("id, name, price, category, image_url")
          .single();

        return product;
      } catch (err) {
        console.error("Error processing image:", err);
        return null;
      }
    })
  );

  const successfulProducts = processedProducts.filter(Boolean);

  return NextResponse.json({ 
    products: successfulProducts,
    count: successfulProducts.length,
    total: files.length
  });
}
