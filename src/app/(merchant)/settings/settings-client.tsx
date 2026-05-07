"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/components/ui/toast";
import { Copy, Check, ExternalLink } from "lucide-react";
import type { Merchant } from "@/lib/supabase/types";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "obsidianretail.com";

export function SettingsClient({ merchant: initial }: { merchant: Merchant }) {
  const [merchant, setMerchant] = useState(initial);
  const [storeName, setStoreName] = useState(initial.store_name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const shopUrl = `${ROOT_DOMAIN}/store/${merchant.handle}`;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("merchants")
      .update({
        store_name: storeName.trim(),
        description: description.trim() || null,
        phone: phone.trim() || null,
      })
      .eq("id", merchant.id);
    setSaving(false);
    if (error) { toast("Failed to save. Try again.", "error"); return; }
    setMerchant((m) => ({ ...m, store_name: storeName, description: description || null, phone: phone || null }));
    toast("Settings saved", "success");
  }

  async function toggleLive(val: boolean) {
    const { error } = await supabase
      .from("merchants")
      .update({ is_live: val })
      .eq("id", merchant.id);
    if (error) { toast("Failed to update", "error"); return; }
    setMerchant((m) => ({ ...m, is_live: val }));
    toast(val ? "Your shop is now live!" : "Shop taken offline", val ? "success" : "error");
  }

  function copyLink() {
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Link copied", "success");
  }

  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1208]">Settings</h1>
        <p className="text-sm text-[#7A6E62] mt-0.5">Manage your store profile</p>
      </div>

      {/* Shop link card */}
      <div className="bg-white rounded-2xl border border-[#E8E0D4] p-5">
        <p className="text-xs font-semibold text-[#7A6E62] uppercase tracking-wide mb-3">Your shop link</p>
        <div className="flex items-center gap-3 bg-[#F5F0E8] rounded-xl px-4 py-3">
          <span className="text-sm text-[#1A1208] font-mono flex-1 truncate">{shopUrl}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={copyLink} className="text-[#7A6E62] hover:text-[#1A1208] transition-colors">
              {copied ? <Check size={16} className="text-[#2D6A4F]" /> : <Copy size={16} />}
            </button>
            <a href={`/store/${merchant.handle}`} target="_blank" rel="noopener noreferrer" className="text-[#7A6E62] hover:text-[#1A1208] transition-colors">
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Live toggle */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F5F0E8]">
          <div>
            <p className="text-sm font-medium text-[#1A1208]">Shop is live</p>
            <p className="text-xs text-[#7A6E62] mt-0.5">
              {merchant.is_live ? "Customers can find and shop your store" : "Only you can see your store"}
            </p>
          </div>
          <Toggle checked={merchant.is_live} onChange={toggleLive} />
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={save} className="bg-white rounded-2xl border border-[#E8E0D4] p-5 flex flex-col gap-5">
        <p className="text-xs font-semibold text-[#7A6E62] uppercase tracking-wide">Store profile</p>

        <Input
          label="Store name"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#7A6E62]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell customers what you sell..."
            rows={3}
            className="w-full text-sm border border-[#E8E0D4] rounded-xl px-4 py-3 outline-none focus:border-[#1A1208] resize-none bg-white text-[#1A1208] placeholder-[#B0A89E]"
          />
        </div>

        <Input
          label="WhatsApp / Phone (optional)"
          type="tel"
          placeholder="08012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="pt-1">
          <p className="text-xs text-[#7A6E62] mb-3">
            Store handle: <span className="font-mono text-[#1A1208]">@{merchant.handle}</span>
            <span className="ml-2 text-[#B0A89E]">(cannot be changed)</span>
          </p>
          <Button type="submit" loading={saving} className="w-full h-11">
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
