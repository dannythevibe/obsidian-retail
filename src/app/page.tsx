import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CountdownNumber } from "@/components/countdown-number";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-5">
        <span className="text-sm font-bold text-[#1A1208] tracking-tight">Obsidian Retail</span>
        <div className="hidden md:flex items-center gap-8 text-sm text-[#7A6E62]">
          <a href="#features" className="hover:text-[#1A1208] transition-colors">Features</a>
          <a href="#how" className="hover:text-[#1A1208] transition-colors">How it works</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="secondary" size="sm">Sign in</Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="bg-[#C4973A] hover:bg-[#A97E2A] text-white border-0">Join now</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-6 lg:px-12 pt-10 overflow-hidden relative">
        {/* Background image */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img src="/hero_bg.png" alt="" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/60 to-white" />
          <div className="absolute inset-0 backdrop-blur-[2px]" />
        </div>

        {/* Social proof pill */}
        <div className="flex items-center gap-2.5 mb-8 bg-[#FAF7F2] border border-[#E8E0D4] rounded-full px-4 py-2">
          <div className="flex -space-x-2">
            {["#C4973A","#1A1208","#7A6E62","#B45309","#2D6A4F"].map((c, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold" style={{ background: c }}>
                {["A","B","C","D","E"][i]}
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold text-[#1A1208]">500+</span>
          <span className="text-xs text-[#7A6E62]">vendors already live</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl lg:text-7xl font-bold text-[#1A1208] leading-[1.05] tracking-tight text-center max-w-3xl">
          Your shop, live in{" "}
          <span className="text-[#C4973A]"><CountdownNumber /></span> seconds.
        </h1>

        <p className="text-base lg:text-lg text-[#7A6E62] mt-5 max-w-md text-center leading-relaxed">
          Import from Instagram. AI builds your catalog.
          Payaza handles every payment. You just sell.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3 mt-8">
          <Link href="/login">
            <Button className="h-12 px-8 text-sm font-semibold">Start for free</Button>
          </Link>
          <Link href="/store/demo">
            <Button variant="secondary" className="h-12 px-8 text-sm font-semibold">See a live shop</Button>
          </Link>
        </div>

        {/* Visual section */}
        <div className="relative w-full max-w-5xl mt-16 flex justify-center items-end gap-4">

          {/* Left cards */}
          <div className="hidden lg:flex flex-col gap-3 pb-8 self-center">
            {[
              { label: "AI catalog builder", sub: "Scans 50 photos instantly", dark: false },
              { label: "Payaza checkout",    sub: "Unique account per order",  dark: true  },
              { label: "Live subdomain",     sub: "yourshop.obsidianretail.com", dark: false },
            ].map(({ label, sub, dark }) => (
              <div key={label} className={`rounded-2xl border px-4 py-3 shadow-sm w-52 ${dark ? "bg-[#1A1208] border-[#1A1208]" : "bg-white border-[#E8E0D4]"}`}>
                <p className={`text-xs font-semibold ${dark ? "text-white" : "text-[#1A1208]"}`}>{label}</p>
                <p className={`text-[11px] mt-0.5 ${dark ? "text-[#B0A89E]" : "text-[#7A6E62]"}`}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Centre — mock storefront rising from bottom */}
          <div className="w-72 lg:w-80 bg-[#FAF7F2] rounded-t-3xl border border-[#E8E0D4] border-b-0 shadow-2xl px-5 pt-5 pb-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#C4973A] flex items-center justify-center text-white text-xs font-bold">H</div>
              <div>
                <p className="text-xs font-bold text-[#1A1208]">Her Boutique Lagos</p>
                <p className="text-[10px] text-[#7A6E62]">herboutique.obsidianretail.com</p>
              </div>
              <span className="ml-auto text-[10px] bg-[#D1FAE5] text-[#065F46] px-2 py-0.5 rounded-full font-semibold">Live</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pb-5">
              {[
                { name: "Ankara Set",  price: "₦35k", color: "#E8D5B7" },
                { name: "Waist Beads", price: "₦8.5k", color: "#D4B8E0" },
                { name: "Gele Wrap",   price: "₦12k", color: "#B8D4C8" },
              ].map((p) => (
                <div key={p.name}>
                  <div className="aspect-square rounded-xl mb-1.5" style={{ background: p.color }} />
                  <p className="text-[10px] font-semibold text-[#1A1208] truncate">{p.name}</p>
                  <p className="text-[10px] text-[#7A6E62]">{p.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right cards */}
          <div className="hidden lg:flex flex-col gap-3 pb-8 self-center">
            {[
              { label: "Payment received ✓", sub: "₦35,000 · Payaza" },
              { label: "12 products found",   sub: "AI confidence 94%" },
            ].map(({ label, sub }) => (
              <div key={label} className="bg-white rounded-2xl border border-[#E8E0D4] px-4 py-3 shadow-sm w-48">
                <p className="text-xs font-semibold text-[#1A1208]">{label}</p>
                <p className="text-[11px] text-[#7A6E62] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-5 text-xs text-[#B0A89E] border-t border-[#E8E0D4] mt-8">
        Obsidian Retail · Built by The Obsidian Studios · Powered by Payaza
      </footer>
    </div>
  );
}
