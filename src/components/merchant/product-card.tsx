"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number | null;
  category: string;
  image_url?: string | null;
  in_stock: boolean;
  approved: boolean;
  sales_count: number;
  ai_confidence?: number | null;
}

export function ProductCard({ product, pending }: { product: Product; pending?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [gone, setGone] = useState(false);
  const supabase = createClient();

  async function approve() {
    setLoading(true);
    await supabase.from("products").update({ approved: true }).eq("id", product.id);
    setGone(true);
  }

  async function reject() {
    setLoading(true);
    await supabase.from("products").delete().eq("id", product.id);
    setGone(true);
  }

  if (gone) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D4] overflow-hidden flex gap-4 p-4 items-start">
      <div className="w-16 h-16 rounded-xl bg-[#F5F0E8] shrink-0 overflow-hidden">
        {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A1208] truncate">{product.name}</p>
        <p className="text-sm font-bold text-[#1A1208] mt-0.5">{formatNaira(product.price)}</p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <Badge variant="default" className="text-[10px]">{product.category}</Badge>
          {!product.in_stock && <Badge variant="pending" className="text-[10px]">Out of stock</Badge>}
          {!pending && <span className="text-[10px] text-[#B0A89E]">{product.sales_count} sold</span>}
        </div>
      </div>
      {pending && (
        <div className="flex gap-2 shrink-0">
          <button onClick={reject} disabled={loading} className="w-8 h-8 rounded-full border border-[#E8E0D4] flex items-center justify-center text-[#7A6E62] hover:bg-red-50 hover:text-red-600 transition-colors">
            <X size={14} />
          </button>
          <button onClick={approve} disabled={loading} className="w-8 h-8 rounded-full bg-[#1A1208] flex items-center justify-center text-white hover:bg-[#2D2010] transition-colors">
            <Check size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
