import { NextRequest } from "next/server";
import { scrapeInstagramProfile, scrapeInstagramPosts } from "@/lib/scrapers/instagram";
import { parseProductFromImage } from "@/lib/ai/catalog-parser";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!merchant) return new Response("Merchant not found", { status: 404 });

  const { postUrls, profileUrl } = await req.json();
  const input = profileUrl || postUrls;
  if (!input || typeof input !== "string") {
    return new Response("Invalid input", { status: 400 });
  }
  const isProfile = !!profileUrl;

  const { data: job } = await supabase
    .from("ingestion_jobs")
    .insert({
      merchant_id: merchant.id,
      source: "instagram",
      source_url: isProfile ? profileUrl : postUrls?.split("\n")[0],
      status: "processing",
      total: 0,
      processed: 0,
    })
    .select("id")
    .single();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        send({ type: "status", message: isProfile ? "Smart Scanner: Launching..." : "Reading individual posts..." });

        const result = isProfile
          ? await scrapeInstagramProfile(profileUrl, (msg, data) => send({ type: "status", message: `Scanner: ${msg}`, ...data }))
          : { posts: await scrapeInstagramPosts(postUrls, (msg) => send({ type: "status", message: msg })) };

        const posts = result.posts;
        if (!posts || posts.length === 0) {
          throw new Error("No products detected on this page. Make sure the profile is public.");
        }

        if (result.screenshot) {
          send({ type: "status", message: "Page captured. Identifying products..." });
        }

        await supabase
          .from("ingestion_jobs")
          .update({ total: posts.length })
          .eq("id", job?.id);

        send({ type: "start", total: posts.length, jobId: job?.id });

        for (let i = 0; i < posts.length; i++) {
          const post = posts[i];
          try {
            send({ type: "status", message: `AI Analysis: Ingesting item ${i + 1}...` });
            
            const parsed = await parseProductFromImage({
              imageUrl: post.imageUrl,
              imageBase64: post.imageBase64,
              mimeType: post.mimeType,
              caption: post.caption,
              source: "instagram",
            });

            send({ type: "status", message: `Smart Extraction: ${parsed.name} (₦${parsed.price})` });

            const { data: product, error: insertError } = await supabase
              .from("products")
              .insert({
                merchant_id: merchant.id,
                name: parsed.name,
                description: parsed.description,
                price: parsed.price,
                sale_price: parsed.sale_price ?? null,
                category: parsed.category,
                image_url: post.imageUrl,
                in_stock: parsed.in_stock,
                source: "instagram",
                ai_confidence: parsed.ai_confidence,
                approved: false,
                position: i,
              })
              .select("id")
              .single();

            if (insertError) throw insertError;

            // Update job progress
            await supabase
              .from("ingestion_jobs")
              .update({ processed: i + 1 })
              .eq("id", job?.id);

            send({
              type: "product",
              index: i,
              product: {
                id: product?.id,
                name: parsed.name,
                price: parsed.price,
                category: parsed.category,
                image_url: post.imageUrl,
                in_stock: parsed.in_stock,
                ai_confidence: parsed.ai_confidence,
              },
            });
          } catch (itemErr) {
            console.error("Item ingestion failed:", itemErr);
            send({ type: "error", index: i, message: "Could not finalize this item" });
          }
        }

        await supabase
          .from("ingestion_jobs")
          .update({ status: "done", completed_at: new Date().toISOString() })
          .eq("id", job?.id);

        send({ type: "done", total: posts.length });
      } catch (err) {
        send({ type: "fatal", message: err instanceof Error ? err.message : "Scan failed" });
      } finally {
        controller.close();
      }
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
