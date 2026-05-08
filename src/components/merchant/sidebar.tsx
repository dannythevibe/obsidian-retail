"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Upload, ShoppingBag, 
  BarChart3, UserCircle, ExternalLink,
  ChevronRight
} from "lucide-react";

const nav = [
  { href: "/dashboard",   label: "Overview",     icon: LayoutDashboard },
  { href: "/ingest",      label: "Import Products", icon: Upload },
  { href: "/orders",      label: "Sales & Orders",  icon: ShoppingBag },
  { href: "/settlements", label: "Earnings",      icon: BarChart3 },
  { href: "/settings",    label: "Store Settings",  icon: UserCircle },
];

export function Sidebar({ handle, storeName }: { handle: string; storeName: string }) {
  const pathname = usePathname();
  
  return (
    <>
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-[#1A1208] text-white z-40 shadow-2xl">
        <div className="px-8 py-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 border-2 border-[#C4973A] rotate-45" />
            <p className="text-[10px] font-black text-[#C4973A] uppercase tracking-[0.3em]">Obsidian</p>
          </div>
          <p className="text-xl font-bold text-white tracking-tighter truncate uppercase">{storeName}</p>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className="relative group">
                <div className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${active ? "text-[#1A1208]" : "text-[#B0A89E] hover:text-white"}`}>
                  <Icon size={18} className={`transition-colors ${active ? "text-[#1A1208]" : "text-[#7A6E62] group-hover:text-[#C4973A]"}`} />
                  {label}
                  {active && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-[#C4973A] rounded-2xl -z-10 shadow-lg shadow-[#C4973A]/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-8">
          <a href={`/store/${handle}`} target="_blank" rel="noopener noreferrer" 
            className="flex items-center justify-between w-full px-5 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C4973A] flex items-center justify-center">
                <ExternalLink size={14} className="text-[#1A1208]" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-[#7A6E62] uppercase tracking-widest">Live Store</p>
                <p className="text-xs font-bold text-white">View Shop</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#7A6E62] group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[#E8E0D4] z-50 flex px-2 py-1 pb-safe shadow-2xl">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex-1 flex flex-col items-center gap-1.5 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${pathname === href ? "text-[#1A1208]" : "text-[#B0A89E]"}`}>
            <div className={`p-2 rounded-xl transition-all ${pathname === href ? "bg-[#1A1208] text-white shadow-lg" : ""}`}>
              <Icon size={18} strokeWidth={pathname === href ? 2.5 : 2} />
            </div>
            <span className={pathname === href ? "opacity-100" : "opacity-60"}>{label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
