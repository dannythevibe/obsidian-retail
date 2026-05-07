import path from "path";
import { chromium } from "playwright-extra";
// @ts-expect-error — no types for stealth plugin
import StealthPlugin from "puppeteer-extra-plugin-stealth";

chromium.use(StealthPlugin());

export interface InstagramPost {
  imageUrl: string;
  imageBase64: string;
  mimeType: string;
  caption: string;
  postUrl: string;
}

const CHROME_PATH = path.join(
  process.cwd(),
  "browsers",
  "chromium-1217",
  "chrome-win64",
  "chrome.exe"
);

const MAX_POSTS = 12;
const SCROLL_PAUSE = 1500;

async function imageToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url, { headers: { Referer: "https://www.instagram.com/" } });
  const buffer = await res.arrayBuffer();
  return {
    base64: Buffer.from(buffer).toString("base64"),
    mimeType: res.headers.get("content-type") ?? "image/jpeg",
  };
}

function extractUsername(profileUrl: string): string {
  const clean = profileUrl.trim().replace(/\/$/, "");
  const parts = clean.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p.includes("instagram.com"));
  return idx !== -1 ? parts[idx + 1] : parts[parts.length - 1];
}

export async function scrapeInstagramProfile(
  profileUrl: string,
  onProgress?: (msg: string) => void
): Promise<InstagramPost[]> {
  const username = extractUsername(profileUrl);
  if (!username) throw new Error("Could not extract username from URL");

  onProgress?.(`Launching browser for @${username}...`);

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1280,900",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
    timezoneId: "Africa/Lagos",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  // Patch webdriver detection
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    (window as unknown as Record<string, unknown>).chrome = { runtime: {} };
  });

  const page = await context.newPage();
  const posts: InstagramPost[] = [];

  try {
    onProgress?.("Opening Instagram...");
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait a moment for JS to settle
    await page.waitForTimeout(2500);

    // Dismiss login modal if it shows up
    try {
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible({ timeout: 3000 })) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(800);
      }
    } catch { /* no modal */ }

    // Also close "Accept cookies" if it appears
    try {
      const acceptBtn = page.getByRole("button", { name: /accept all|allow all|accept/i });
      if (await acceptBtn.isVisible({ timeout: 2000 })) {
        await acceptBtn.click();
        await page.waitForTimeout(500);
      }
    } catch { /* no cookie banner */ }

    onProgress?.("Scanning posts...");

    // Scroll and collect post links
    const postLinks = new Set<string>();
    for (let scroll = 0; scroll < 5 && postLinks.size < MAX_POSTS; scroll++) {
      const links = await page.$$eval(
        'a[href*="/p/"], a[href*="/reel/"]',
        (anchors) => anchors.map((a) => (a as HTMLAnchorElement).href)
      );
      links.forEach((l) => postLinks.add(l));

      if (postLinks.size < MAX_POSTS) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
        await page.waitForTimeout(SCROLL_PAUSE);
      }
    }

    const uniqueLinks = Array.from(postLinks).slice(0, MAX_POSTS);

    if (uniqueLinks.length === 0) {
      throw new Error(`No posts found for @${username}. Account may be private or empty.`);
    }

    onProgress?.(`Found ${uniqueLinks.length} posts. Reading content...`);

    for (let i = 0; i < uniqueLinks.length; i++) {
      const postUrl = uniqueLinks[i];
      onProgress?.(`Reading post ${i + 1} of ${uniqueLinks.length}...`);

      try {
        await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(1500);

        // Dismiss modal on post page too
        try {
          const modal = page.locator('[role="dialog"]');
          if (await modal.isVisible({ timeout: 1500 })) {
            await page.keyboard.press("Escape");
          }
        } catch { /* no modal */ }

        // Extract image
        const imageUrl = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll("article img"));
          const main = imgs.find(
            (img) =>
              (img as HTMLImageElement).src.includes("cdninstagram") ||
              (img as HTMLImageElement).src.includes("fbcdn")
          );
          return (main as HTMLImageElement)?.src ?? "";
        });

        // Extract caption
        const caption = await page.evaluate(() => {
          const candidates = [
            document.querySelector("h1"),
            document.querySelector('article div[class] span'),
            document.querySelector('meta[property="og:description"]'),
          ];
          for (const el of candidates) {
            if (!el) continue;
            const text = el instanceof HTMLMetaElement
              ? el.content
              : el.textContent?.trim();
            if (text && text.length > 3) return text;
          }
          return "";
        });

        if (imageUrl) {
          onProgress?.(`Downloading image ${i + 1}...`);
          const { base64, mimeType } = await imageToBase64(imageUrl);
          posts.push({ imageUrl, imageBase64: base64, mimeType, caption, postUrl });
        }
      } catch {
        // Skip failed posts
      }
    }
  } finally {
    await browser.close();
  }

  if (posts.length === 0) {
    throw new Error("Could not read any posts. The account may be private.");
  }

  return posts;
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
