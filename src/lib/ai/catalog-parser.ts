import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { normalizePrice } from "@/lib/utils";
import type { ParsedProduct } from "@/lib/supabase/types";

// Lazy init — avoids crashing at build time when env vars are absent
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
function getGemini() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

const SYSTEM_PROMPT = `You are a product catalog parser for Nigerian small businesses.
Your job is to extract structured product information from images and captions posted by Nigerian vendors on Instagram and WhatsApp.

PRICE FORMATS YOU WILL SEE:
- ₦12,500 or N12,500 → 12500
- 12.5k or 12k → 12500 or 12000
- "35k only" → 35000
- "12500 naira" → 12500
- "affordable price, dm" → null (no price found)

NIGERIAN PRODUCT CATEGORIES:
Fashion: Ankara, Aso-ebi, Agbada, Ready-to-wear, Owambe, Gele, Kaftan, Senator, Jumpsuit, Bodycon, Corset, Co-ord set
Beauty: Skincare, Body butter, Hair (wigs, braids, weave), Makeup, Perfume, Nail kit
Food: Smallchops, Cakes, Pastries, Frozen food, Soups, Snacks, Drinks
Accessories: Body chain, Waist beads, Bag, Footwear, Jewellery, Sunglasses, Belt
Home: Bedding, Decor, Kitchenware, Furniture
Kids: Children clothing, Toys, Baby items
Electronics: Gadgets, Phones, Accessories

STOCK SIGNALS:
- "sold out", "sold 🙏", "gone", "finished" → in_stock: false
- "available", "in stock", "restock" → in_stock: true
- no signal → in_stock: true (assume available)

RESPOND WITH VALID JSON ONLY. No explanation. No markdown. Just the JSON object.`;

const USER_PROMPT = (caption?: string) => `
Analyze this product image${caption ? ` and caption: "${caption}"` : ""}.

Return this exact JSON structure:
{
  "name": "product name (concise, title case)",
  "price": 12500,
  "sale_price": null,
  "category": "exact category from the list",
  "description": "1-2 sentence product description, include sizes/colours if mentioned",
  "in_stock": true,
  "variants": ["Size S", "Size M"],
  "confidence": 0.92
}

Rules:
- price must be a plain integer in naira, or null if truly undetectable
- variants only if explicitly mentioned (sizes, colours, materials)
- confidence: 0.0–1.0 (how certain you are about the extraction)
- name: max 6 words, no emojis
- description: natural, no "DM to order" or "pay before delivery" filler
`;

interface RawAIResult {
  name: string;
  price: number | null;
  sale_price: number | null;
  category: string;
  description: string;
  in_stock: boolean;
  variants?: string[];
  confidence: number;
}

async function parseWithGPT4o(
  image: { url: string } | { base64: string; mimeType: string },
  caption?: string
): Promise<RawAIResult> {
  const imageUrl =
    "url" in image
      ? image.url
      : `data:${image.mimeType};base64,${image.base64}`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    max_tokens: 500,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
          { type: "text", text: USER_PROMPT(caption) },
        ],
      },
    ],
  });

  const raw = response.choices[0].message.content ?? "{}";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
}

async function parseWithGemini(
  imageBase64: string,
  mimeType: string,
  caption?: string
): Promise<RawAIResult> {
  const model = getGemini().getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType } },
    SYSTEM_PROMPT + "\n\n" + USER_PROMPT(caption),
  ]);

  const raw = result.response.text();
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

export async function parseProductFromImage(params: {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  caption?: string;
  source: "instagram" | "whatsapp" | "upload";
}): Promise<ParsedProduct> {
  const { imageUrl, imageBase64, mimeType, caption, source } = params;

  let raw: RawAIResult;

  try {
    if (imageBase64 && mimeType) {
      // Prefer base64 — works regardless of whether the CDN URL is publicly reachable
      raw = await parseWithGPT4o({ base64: imageBase64, mimeType }, caption);
    } else if (imageUrl) {
      raw = await parseWithGPT4o({ url: imageUrl }, caption);
    } else {
      throw new Error("No image provided");
    }
  } catch {
    // Fallback: Gemini with base64
    if (imageBase64 && mimeType) {
      raw = await parseWithGemini(imageBase64, mimeType, caption);
    } else {
      throw new Error("Both AI providers failed");
    }
  }

  return {
    name: raw.name ?? "Unnamed Product",
    price: raw.price != null ? normalizePrice(raw.price) : 0,
    sale_price: raw.sale_price != null ? normalizePrice(raw.sale_price) : undefined,
    category: raw.category ?? "General",
    description: raw.description ?? "",
    in_stock: raw.in_stock ?? true,
    variants: raw.variants,
    ai_confidence: raw.confidence ?? 0.5,
    source,
    image_url: imageUrl,
  };
}

export async function filterPositiveReviews(comments: string[]): Promise<string[]> {
  if (comments.length === 0) return [];

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Filter this list of Instagram comments to only return genuine positive product reviews.
EXCLUDE: questions ("how much?", "is it available?"), spam, irrelevant comments, price enquiries.
INCLUDE: compliments, satisfaction, positive experiences about the product quality, fit, or delivery.

Comments (JSON array):
${JSON.stringify(comments)}

Return ONLY a JSON array of the positive review strings. No explanation.`,
      },
    ],
  });

  const raw = response.choices[0].message.content ?? "[]";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}
