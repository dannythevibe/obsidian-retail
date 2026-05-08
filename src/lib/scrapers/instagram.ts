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

  const devices = [
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1", w: 393, h: 852 }, // iPhone 15
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1", w: 430, h: 932 }, // iPhone 14 Pro Max
    { ua: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36", w: 412, h: 915 }, // Pixel 7
  ];
  const device = devices[Math.floor(Math.random() * devices.length)];

  const context = await browser.newContext({
    userAgent: device.ua,
    viewport: { width: device.w, height: device.h },
    hasTouch: true,
  });

  // Advanced Stealth: Scrub all automation traces
  await context.addInitScript(() => {
    // @ts-ignore
    delete Object.getPrototypeOf(navigator).webdriver;
    // @ts-ignore
    window.chrome = { runtime: {} };
    // @ts-ignore
    navigator.languages = ["en-US", "en"];
  });

  const page = await context.newPage();
  const posts: InstagramPost[] = [];
  let profileScreenshot: any = "";

  try {
    onProgress?.("Smart Ingestion: Masking identity...");
    // Add a random human-like delay before starting
    await page.waitForTimeout(Math.random() * 2000 + 1000);

    await page.goto(`https://www.instagram.com/${username}/?utm_medium=copy_link`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForTimeout(Math.random() * 3000 + 3000);

    // If still stuck on login, try the mobile query bypass
    if (page.url().includes("/accounts/login/") || await page.isVisible('text="Log In"')) {
      onProgress?.("Security Bypass: Hard Reset...");
      await page.goto(`https://www.instagram.com/${username}/?utm_source=ig_embed&ig_mid=1`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(4000);
    }

    // Clear any overlays blocking the view
    await page.evaluate(() => {
      const overlays = Array.from(document.querySelectorAll('div[role="presentation"], div[style*="position: fixed"]'));
      overlays.forEach(el => {
        if (el.textContent?.includes("Log In") || el.textContent?.includes("Sign Up")) {
          (el as HTMLElement).style.display = "none";
        }
      });
      document.body.style.overflow = "auto";
    });

    onProgress?.("Capturing profile layout...");
    profileScreenshot = await page.screenshot({ type: "jpeg", quality: 60, fullPage: false });
    onProgress?.("Profile captured. Scanning items...", { screenshot: profileScreenshot.toString("base64") });

    // Scroll and collect post links with better selectors
    const postLinks = new Set<string>();
    onProgress?.("Scanning grid for products...");
    
    for (let scroll = 0; scroll < 3; scroll++) {
      const links = await page.evaluate(() => {
        // Look for ANY link that goes to a post or reel, handling both full and relative URLs
        const selectors = [
          'a[href*="/p/"]', 
          'a[href*="/reels/"]', 
          'a[href*="/reel/"]',
          'div[role="link"] a',
          'article a'
        ];
        const found = new Set<string>();
        selectors.forEach(s => {
          document.querySelectorAll(s).forEach(el => {
            const href = (el as HTMLAnchorElement).href;
            if (href && (href.includes("/p/") || href.includes("/reel"))) {
              found.add(href);
            }
          });
        });
        return Array.from(found);
      });
      
      links.forEach((l) => postLinks.add(l));
      
      // Random scroll "jitter" to look human
      const scrollAmt = 800 + Math.random() * 600;
      await page.evaluate((amt) => window.scrollBy(0, amt), scrollAmt);
      await page.waitForTimeout(1500 + Math.random() * 1000);
    }

    if (uniqueLinks.length === 0) {
      onProgress?.("Security Alert: No items visible. Capturing diagnostic view...");
      profileScreenshot = await page.screenshot({ type: "jpeg", quality: 60 });
    } else {
      onProgress?.(`Found ${uniqueLinks.length} products. Deep Ingesting...`);
    }

    for (let i = 0; i < uniqueLinks.length; i++) {
      const postUrl = uniqueLinks[i];
      onProgress?.(`Smart Scan: Reading item ${i + 1}...`);

      try {
        // Human-like pause
        await page.waitForTimeout(Math.random() * 1000 + 500);
        
        await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForSelector('article', { timeout: 5000 }).catch(() => null);
        await page.waitForTimeout(1000);

        const data = await page.evaluate(() => {
          const img = document.querySelector('article img[srcset], main img[srcset], img[style*="object-fit: cover"]') as HTMLImageElement;
          const captionEl = document.querySelector('h1, div[dir="auto"], article span');
          return { src: img?.src || "", cap: captionEl?.textContent?.trim() || "" };
        });

        if (data.src) {
          onProgress?.(`AI Parse: Item ${i + 1} captured.`);
          const { base64, mimeType } = await imageToBase64(data.src);
          posts.push({ imageUrl: data.src, imageBase64: base64, mimeType, caption: data.cap, postUrl });
        }
      } catch (postErr) {
        console.error(`Failed ingest for item ${i}:`, postErr);
      }
    }
  } catch (err: any) {
    console.error("Scrape failed:", err);
    // If it failed but we have some posts, return them. Otherwise throw.
    if (posts.length === 0) {
       profileScreenshot = await page.screenshot({ type: "jpeg", quality: 60 }).catch(() => null);
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
