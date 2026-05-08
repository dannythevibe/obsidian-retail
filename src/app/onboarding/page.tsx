"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";
import { Store, ArrowRight, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const [storeName, setStoreName] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  function handleNameChange(val: string) {
    setStoreName(val);
    setHandle(slugify(val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase.from("merchants").insert({
      user_id: user.id,
      store_name: storeName,
      handle: handle.toLowerCase(),
      is_live: false,
    });

    setLoading(false);

    if (error?.code === "23505") {
      toast("That handle is already taken. Try another.", "error");
      return;
    }
    if (error) {
      toast("Something went wrong. Try again.", "error");
      return;
    }

    router.push("/ingest");
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-[#C4973A]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-[#1A1208]/5 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#1A1208] rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-[#C4973A] rotate-45" />
            </div>
            <span className="text-xl font-bold text-[#1A1208] tracking-tight">Obsidian Retail</span>
          </div>
          <h1 className="text-3xl font-black text-[#1A1208] tracking-tighter uppercase mb-2">Claim your handle</h1>
          <p className="text-sm text-[#7A6E62] font-medium uppercase tracking-widest">Set up your storefront in seconds</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-[#E8E0D4] p-10 shadow-premium relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C4973A] to-[#1A1208]" />
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="space-y-6">
              <Input
                label="What's your shop's name?"
                placeholder="Her Boutique Lagos"
                value={storeName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
                className="h-14 rounded-2xl border-[#E8E0D4] focus:border-[#C4973A] transition-all"
              />

              <div className="relative group">
                <Input
                  label="Your unique shop link"
                  placeholder={handle || "your-store-handle"}
                  value={handle}
                  onChange={(e) => setHandle(slugify(e.target.value))}
                  required
                  className="pl-10 h-14 rounded-2xl border-[#E8E0D4] bg-[#FAF7F2]/50 focus:bg-white focus:border-[#C4973A] transition-all"
                />
                <span className="absolute left-4 bottom-[1.1rem] text-[10px] font-bold text-[#B0A89E] group-focus-within:text-[#C4973A]">/</span>
              </div>

              {handle && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-[#F5F0E8] rounded-2xl p-4 border border-[#E8E0D4]/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Store size={14} className="text-[#C4973A]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#7A6E62] uppercase tracking-widest leading-none mb-1">Your Live URL</p>
                      <p className="text-xs font-bold text-[#1A1208] break-all">
                        obsidianretail.com/store/<span className="text-[#C4973A]">{handle}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={!storeName || !handle}
              className="w-full h-14 rounded-2xl bg-[#1A1208] hover:bg-black text-white font-bold uppercase tracking-widest shadow-xl shadow-[#1A1208]/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
              Finish Setup
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Sparkles size={14} className="text-[#C4973A]" />
            <span className="text-[10px] font-bold text-[#7A6E62] uppercase tracking-widest">Smart Ingestion</span>
          </div>
          <div className="w-px h-3 bg-[#E8E0D4]" />
          <div className="flex items-center gap-2 opacity-50">
            <ArrowRight size={14} className="text-[#1A1208]" />
            <span className="text-[10px] font-bold text-[#7A6E62] uppercase tracking-widest">Payaza Verified</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
