"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Edit2, Save, Image as ImageIcon } from "lucide-react";

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
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [imgError, setImgError] = useState(false);
  
  const supabase = createClient();

  async function approve() {
    setLoading(true);
    // If we've edited, save those changes too
    await supabase.from("products").update({ 
      approved: true,
      name: name,
      price: parseFloat(price) || 0
    }).eq("id", product.id);
    setGone(true);
  }

  async function reject() {
    setLoading(true);
    await supabase.from("products").delete().eq("id", product.id);
    setGone(true);
  }

  async function saveChanges() {
    setLoading(true);
    const { error } = await supabase.from("products").update({
      name: name,
      price: parseFloat(price) || 0
    }).eq("id", product.id);
    
    if (!error) {
      setEditing(false);
    }
    setLoading(false);
  }

  if (gone) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D4] overflow-hidden flex gap-4 p-4 items-start transition-all hover:border-[#C4973A]/30">
      <div className="w-20 h-20 rounded-xl bg-[#F5F0E8] shrink-0 overflow-hidden relative flex items-center justify-center border border-[#E8E0D4]">
        {product.image_url && !imgError ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <ImageIcon size={20} className="text-[#B0A89E]" />
            <span className="text-[10px] text-[#B0A89E]">No image</span>
          </div>
        )}
        {pending && (
          <div className="absolute top-1 right-1">
            <Badge variant="default" className="bg-[#1A1208] text-white text-[8px] px-1.5 py-0">NEW</Badge>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              className="text-sm font-semibold text-[#1A1208] bg-[#F5F0E8] rounded px-2 py-1 outline-none border border-transparent focus:border-[#C4973A]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1A1208]">₦</span>
              <input
                type="number"
                className="text-sm font-bold text-[#1A1208] bg-[#F5F0E8] rounded px-2 py-1 w-24 outline-none border border-transparent focus:border-[#C4973A]"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-[#1A1208] truncate">{name}</p>
            <p className="text-sm font-bold text-[#1A1208] mt-0.5">{formatNaira(parseFloat(price))}</p>
          </>
        )}
        
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <Badge variant="default" className="text-[10px] bg-[#FAF7F2] text-[#7A6E62] border-[#E8E0D4]">{product.category}</Badge>
          {!product.in_stock && <Badge variant="pending" className="text-[10px]">Out of stock</Badge>}
          {!pending && <span className="text-[10px] text-[#B0A89E]">{product.sales_count} sold</span>}
          {pending && (
            <span className="text-[10px] text-[#7A6E62] font-medium tracking-tight">Pending Approval</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 shrink-0 self-center">
        {pending ? (
          <>
            {editing ? (
              <button 
                onClick={saveChanges} 
                disabled={loading} 
                className="w-9 h-9 rounded-xl bg-[#1A1208] flex items-center justify-center text-white hover:bg-[#2D2010] transition-colors shadow-sm"
              >
                <Save size={16} />
              </button>
            ) : (
              <button 
                onClick={() => setEditing(true)} 
                className="w-9 h-9 rounded-xl border border-[#E8E0D4] flex items-center justify-center text-[#7A6E62] hover:bg-white hover:border-[#1A1208] hover:text-[#1A1208] transition-all"
              >
                <Edit2 size={16} />
              </button>
            )}
            <div className="w-[1px] h-6 bg-[#E8E0D4] self-center mx-1" />
            <button 
              onClick={reject} 
              disabled={loading} 
              className="w-9 h-9 rounded-xl border border-[#E8E0D4] flex items-center justify-center text-[#7A6E62] hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
            >
              <X size={16} />
            </button>
            <button 
              onClick={approve} 
              disabled={loading} 
              className="w-9 h-9 rounded-xl bg-[#C4973A] flex items-center justify-center text-white hover:bg-[#A97E2A] transition-all shadow-sm"
            >
              <Check size={16} />
            </button>
          </>
        ) : (
          <button 
            onClick={() => setEditing(!editing)} 
            className="w-9 h-9 rounded-xl border border-[#E8E0D4] flex items-center justify-center text-[#7A6E62] hover:bg-white hover:border-[#1A1208] transition-all"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

