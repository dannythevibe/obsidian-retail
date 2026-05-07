import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

async function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const url = req.nextUrl.clone();

  // ─── Subdomain routing ────────────────────────────────────────────────────
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "obsidianretail.com";
  const isSubdomain =
    host !== rootDomain &&
    host !== `www.${rootDomain}` &&
    host.endsWith(`.${rootDomain}`);

  const isCustomDomain =
    !host.endsWith(rootDomain) &&
    !host.includes("localhost") &&
    !host.includes("vercel.app");

  if (isSubdomain) {
    const handle = host.replace(`.${rootDomain}`, "");
    url.pathname = `/store/${handle}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (isCustomDomain) {
    url.pathname = `/store/__domain__${url.pathname}`;
    const res = NextResponse.rewrite(url);
    res.headers.set("x-custom-domain", host);
    return res;
  }

  // ─── Session refresh ───────────────────────────────────────────────────────
  // Must create response first so setAll can write refreshed tokens onto it
  const response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ─── Auth protection ──────────────────────────────────────────────────────
  const protectedPaths = ["/dashboard", "/orders", "/settlements", "/ingest", "/onboarding", "/settings"];
  const isProtected = protectedPaths.some((p) => url.pathname.startsWith(p));

  if (isProtected && !user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged-in users hitting /login go straight to dashboard
  if (url.pathname === "/login" && user) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
