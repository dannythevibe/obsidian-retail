import { NextRequest } from "next/server";
import { parseProductFromImage } from "@/lib/ai/catalog-parser";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

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

  const formData = await req.formData();
  const files = formData.getAll("images") as File[];

  if (files.length === 0) {
    return new Response("No images provided", { status: 400 });
  }

  const capped = files.slice(0, 50);

  // Create ingestion job
  const { data: job } = await supabase
    .from("ingestion_jobs")
    .insert({
      merchant_id: merchant.id,
      source: "upload",
      total: capped.length,
      processed: 0,
      status: "processing",
    })
    .select("id")
    .single();

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "start", total: capped.length, jobId: job?.id });

      // Process in parallel batches of 10
      const BATCH_SIZE = 10;
      for (let i = 0; i < capped.length; i += BATCH_SIZE) {
        const batch = capped.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (file, batchIdx) => {
            const idx = i + batchIdx;
            try {
              const arrayBuffer = await file.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString("base64");
              const mimeType = file.type || "image/jpeg";

              const parsed = await parseProductFromImage({
                imageBase64: base64,
                mimeType,
                source: "upload",
              });

              // Upload image to Supabase storage
              const fileName = `${merchant.id}/${Date.now()}-${idx}.${mimeType.split("/")[1]}`;
              const { data: uploaded, error: uploadError } = await supabase.storage
                .from("product-images")
                .upload(fileName, file, { contentType: mimeType, upsert: false });

              if (uploadError) {
                console.error("[Upload API] Storage Upload Error:", uploadError);
                throw uploadError;
              }

              const { data: { publicUrl } } = supabase.storage
                .from("product-images")
                .getPublicUrl(fileName);

              console.log(`[Upload API] Generated Public URL: ${publicUrl}`);

              // Insert product as pending approval
              const { data: product } = await supabase
                .from("products")
                .insert({
                  merchant_id: merchant.id,
                  name: parsed.name,
                  description: parsed.description,
                  price: parsed.price,
                  sale_price: parsed.sale_price ?? null,
                  category: parsed.category,
                  image_url: publicUrl,
                  in_stock: parsed.in_stock,
                  source: "upload",
                  ai_confidence: parsed.ai_confidence,
                  approved: false,
                  position: idx,
                })
                .select("id")
                .single();

              // Update job progress
              await supabase
                .from("ingestion_jobs")
                .update({ processed: i + batchIdx + 1 })
                .eq("id", job?.id);

              send({
                type: "product",
                index: idx,
                product: {
                  id: product?.id,
                  name: parsed.name,
                  price: parsed.price,
                  category: parsed.category,
                  image_url: publicUrl,
                  in_stock: parsed.in_stock,
                  ai_confidence: parsed.ai_confidence,
                },
              });
            } catch (err) {
              send({
                type: "error",
                index: idx,
                message: err instanceof Error ? err.message : "Parse failed",
              });
            }
          })
        );
      }

      // Mark job done
      await supabase
        .from("ingestion_jobs")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", job?.id);

      send({ type: "done", total: capped.length });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
