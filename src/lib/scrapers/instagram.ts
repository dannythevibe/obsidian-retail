import path from "path";
import { chromium } from "playwright-extra";
// @ts-ignore — no types for stealth plugin
import StealthPlugin from "puppeteer-extra-plugin-stealth";

chromium.use(StealthPlugin());

export interface InstagramPost {
  imageUrl: string;
  imageBase64: string;
  mimeType: string;
  caption: string;
  postUrl: string;
}

export interface ScrapeResult {
  posts: InstagramPost[];
  screenshot?: string; // base64 screenshot of the profile
}

const MAX_POSTS = 12;
const CHROME_PATH = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function extractUsername(url: string): string | null {
  try {
    const match = url.match(/instagram\.com\/([^/?#&]+)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function imageToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  try {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    return {
      base64: buffer.toString("base64"),
      mimeType,
    };
  } catch (err) {
    console.error("Image fetch error:", err);
    return { base64: "", mimeType: "image/jpeg" };
  }
}

export async function scrapeInstagramProfile(
  profileUrl: string,
  onProgress?: (msg: string, data?: any) => void
): Promise<ScrapeResult> {
  const username = extractUsername(profileUrl);
  if (!username) throw new Error("Could not extract username from URL");

  onProgress?.(`Launching browser for @${username}...`);

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: false, 
    slowMo: 500,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1280,1000",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 1000 },
    locale: "en-US",
    timezoneId: "Africa/Lagos",
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const page = await context.newPage();
  const posts: InstagramPost[] = [];
  let profileScreenshot: any = "";

  try {
    onProgress?.("Opening Instagram...");
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    // Dismiss modals
    try {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    } catch {}

    onProgress?.("Capturing profile layout...");
    profileScreenshot = await page.screenshot({ type: "jpeg", quality: 60, fullPage: false });
    onProgress?.("Profile captured. Scanning items...", { screenshot: profileScreenshot.toString("base64") });

    // Scroll and collect post links
    const postLinks = new Set<string>();
    for (let scroll = 0; scroll < 3 && postLinks.size < MAX_POSTS; scroll++) {
      const links = await page.$$eval(
        'a[href*="/p/"], a[href*="/reel/"]',
        (anchors) => anchors.map((a) => (a as HTMLAnchorElement).href)
      );
      links.forEach((l) => postLinks.add(l));

      if (postLinks.size < MAX_POSTS) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(1000);
      }
    }

    const uniqueLinks = Array.from(postLinks).slice(0, MAX_POSTS);

    for (let i = 0; i < uniqueLinks.length; i++) {
      const postUrl = uniqueLinks[i];
      onProgress?.(`Reading post ${i + 1} of ${uniqueLinks.length}...`);

      try {
        await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(1000);

        const imageUrl = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll("article img"));
          const main = imgs.find((img) => (img as HTMLImageElement).src.includes("cdninstagram") || (img as HTMLImageElement).src.includes("fbcdn"));
          return (main as HTMLImageElement)?.src ?? "";
        });

        const caption = await page.evaluate(() => {
          const el = document.querySelector("h1") || document.querySelector('article div span');
          return el?.textContent?.trim() || "";
        });

        if (imageUrl) {
          const { base64, mimeType } = await imageToBase64(imageUrl);
          posts.push({ imageUrl, imageBase64: base64, mimeType, caption, postUrl });
        }
      } catch {}
    }
  } finally {
    await browser.close();
  }

  return { posts, screenshot: profileScreenshot ? Buffer.from(profileScreenshot).toString("base64") : undefined };
}

// Keep oEmbed fallback for individual post links
export async function scrapeInstagramPosts(
  rawInput: string,
  onProgress?: (msg: string) => void
): Promise<InstagramPost[]> {
  const urls = rawInput
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.includes("instagram.com/p/") || s.includes("instagram.com/reel/"))
    .slice(0, 20);

  if (urls.length === 0) {
    throw new Error("No valid Instagram post links found.");
  }

  onProgress?.(`Fetching ${urls.length} posts...`);
  const posts: InstagramPost[] = [];

  for (let i = 0; i < urls.length; i++) {
    onProgress?.(`Fetching post ${i + 1} of ${urls.length}...`);
    try {
      const oembedRes = await fetch(
        `https://api.instagram.com/oembed?url=${encodeURIComponent(urls[i])}&maxwidth=640`
      );
      if (!oembedRes.ok) continue;
      const oembed = await oembedRes.json();
      const imageUrl: string = oembed.thumbnail_url ?? "";
      if (!imageUrl) continue;
      const { base64, mimeType } = await imageToBase64(imageUrl);
      posts.push({ imageUrl, imageBase64: base64, mimeType, caption: oembed.title ?? "", postUrl: urls[i] });
    } catch { /* skip */ }
  }

  if (posts.length === 0) throw new Error("Could not fetch any posts. Make sure they are public.");
  return posts;
}
