"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, ShoppingBag, BarChart3, ExternalLink } from "lucide-react";

const nav = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/ingest",      label: "Import",      icon: Upload },
  { href: "/orders",      label: "Orders",      icon: ShoppingBag },
  { href: "/settlements", label: "Settlements", icon: BarChart3 },
];

export function Sidebar({ handle, storeName }: { handle: string; storeName: string }) {
  const pathname = usePathname();
  return (
    <>
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-56 bg-white border-r border-[#E8E0D4] z-40">
        <div className="px-5 py-5 border-b border-[#E8E0D4]">
          <p className="text-xs font-bold text-[#C4973A] uppercase tracking-widest">Obsidian Retail</p>
          <p className="text-sm font-bold text-[#1A1208] mt-0.5 truncate">{storeName}</p>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${pathname === href ? "bg-[#1A1208] text-white" : "text-[#7A6E62] hover:bg-[#F5F0E8] hover:text-[#1A1208]"}`}>
              <Icon size={16} />{label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-[#E8E0D4]">
          <a href={`/store/${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#7A6E62] hover:bg-[#F5F0E8] hover:text-[#1A1208] transition-colors">
            <ExternalLink size={13} />View my shop
          </a>
        </div>
      </aside>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E0D4] z-40 flex">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium ${pathname === href ? "text-[#1A1208]" : "text-[#B0A89E]"}`}>
            <Icon size={18} strokeWidth={pathname === href ? 2.5 : 1.5} />{label}
          </Link>
        ))}
      </nav>
    </>
  );
}
