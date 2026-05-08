"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CountdownNumber } from "@/components/countdown-number";
import { ChevronRight, ArrowRight, Sparkles, ShieldCheck, Zap, Globe } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-[#C4973A] selection:text-white">
      {/* Hero Background Image */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img 
          src="/hero_bg.png" 
          alt="" 
          className="w-full h-full object-cover" 
        />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-transparent px-6 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-[#1A1208] rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-[#C4973A] rotate-45" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Obsidian Retail</span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-white/70">
            {["Features", "How it works", "Pricing", "Showcase"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C4973A] transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link href="/login" className="text-sm font-semibold text-white/80 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-black hover:bg-black/80 text-white px-8 rounded-full shadow-lg transition-all active:scale-95">
                Join now
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-6 lg:px-12 pt-16 lg:pt-24 relative z-10">
        <motion.div 
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-4xl w-full text-center"
        >
          {/* Social proof pill */}
          <motion.div 
            variants={fadeUp}
            className="inline-flex items-center gap-3 mb-10 glass border border-[#E8E0D4] rounded-full px-5 py-2.5 shadow-sm"
          >
            <div className="flex -space-x-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-[#C4973A] to-[#1A1208] flex items-center justify-center text-[10px] text-white font-bold">
                  {i}
                </div>
              ))}
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs font-bold text-[#1A1208]">500+ Vendors</span>
              <span className="text-[10px] text-[#7A6E62] mt-0.5">scaling their businesses</span>
            </div>
          </motion.div>

          <motion.h1 
            variants={fadeUp}
            className="text-6xl lg:text-8xl font-bold text-white leading-[0.95] tracking-tight mb-8 drop-shadow-2xl"
          >
            Your shop, live in <br />
            <span className="text-[#FFD700] drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]">
              <CountdownNumber />
            </span> seconds.
          </motion.h1>

          <motion.p 
            variants={fadeUp}
            className="text-lg lg:text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-lg"
          >
            Move your business from Instagram and WhatsApp to a professional storefront. 
            Automated catalog builder. Payaza handles every payment.
          </motion.p>

          <motion.div 
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link href="/login">
              <Button className="h-14 px-10 text-base font-bold bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white border border-white/30 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 group">
                Start for free
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/store/demo">
              <Button variant="outline" className="h-14 px-10 text-base font-bold border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 rounded-2xl transition-all">
                See a live shop
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Visual Showcase Section */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-6xl mt-12 flex justify-center items-end"
        >
          {/* Dashboard Preview Cards */}
          <div className="absolute left-0 top-1/4 hidden xl:flex flex-col gap-6 -translate-x-12">
            {[
              { icon: Sparkles, label: "Automated Ingestion", val: "98% Accuracy", color: "text-[#C4973A]" },
              { icon: Zap, label: "Live Setup", val: "< 60 Seconds", color: "text-[#1A1208]" },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.2 }}
                className="glass-dark p-5 rounded-3xl shadow-premium w-56 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <item.icon size={18} className={item.color} />
                  <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{item.label}</span>
                </div>
                <p className="text-xl font-bold text-white">{item.val}</p>
              </motion.div>
            ))}
          </div>

          <div className="absolute right-0 top-1/3 hidden xl:flex flex-col gap-6 translate-x-12">
            {[
              { icon: ShieldCheck, label: "Security", val: "Payaza PCI-DSS", color: "text-[#2D6A4F]" },
              { icon: Globe, label: "Network", val: "Global Payouts", color: "text-[#1A1208]" },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + i * 0.2 }}
                className="glass p-5 rounded-3xl shadow-premium w-56 border border-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <item.icon size={18} className={item.color} />
                  <span className="text-xs font-bold text-[#7A6E62] uppercase tracking-widest">{item.label}</span>
                </div>
                <p className="text-xl font-bold text-[#1A1208]">{item.val}</p>
              </motion.div>
            ))}
          </div>

          {/* Centre — mock storefront rising from bottom */}
          <div className="relative z-10 w-full max-w-md bg-white rounded-t-[3rem] border border-[#E8E0D4] border-b-0 shadow-premium p-8 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C4973A] via-[#1A1208] to-[#C4973A]" />
            
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-[#C4973A] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#C4973A]/20">H</div>
              <div className="flex-1">
                <p className="text-sm font-black text-[#1A1208] uppercase tracking-tight">Her Boutique Lagos</p>
                <p className="text-xs text-[#7A6E62]">herboutique.obsidianretail.com</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#D1FAE5] text-[#065F46] px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-[#065F46] animate-pulse" />
                <span className="text-[10px] font-bold uppercase">Live</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { name: "Silk Wrap",  price: "₦35,000", color: "bg-[#E8D5B7]" },
                { name: "Gold Cuff",  price: "₦12,500", color: "bg-[#D4B8E0]" },
              ].map((p, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className={`${p.color} aspect-[4/5] rounded-[2rem] mb-4 overflow-hidden transition-transform group-hover:scale-[1.02] active:scale-[0.98] relative`}>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  </div>
                  <p className="text-xs font-bold text-[#1A1208] uppercase tracking-wide">{p.name}</p>
                  <p className="text-sm font-medium text-[#C4973A]">{p.price}</p>
                </div>
              ))}
            </div>

            <Button className="w-full h-12 rounded-2xl bg-[#1A1208] hover:bg-black text-white font-bold text-xs uppercase tracking-widest">
              View All Collection
            </Button>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 bg-black/80 backdrop-blur-xl border-t border-white/10 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
              <div className="w-4 h-4 border-2 border-[#FFD700] rotate-45" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight uppercase">Obsidian Retail</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-10 mb-12 text-sm font-medium text-white/50">
            {["Terms", "Privacy", "Shipping", "Contact"].map((item) => (
              <a key={item} href="#" className="hover:text-white transition-colors">{item}</a>
            ))}
          </div>

          <div className="h-px bg-white/5 w-full mb-8" />
          
          <p className="text-xs text-white/30 uppercase tracking-[0.3em] font-bold">
            © {new Date().getFullYear()} The Obsidian Studios. All rights reserved.
          </p>
          </div>
      </footer>
    </div>
  );
}
