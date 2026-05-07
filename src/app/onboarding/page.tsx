"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";

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
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="text-2xl font-bold text-[#1A1208] tracking-tight">Obsidian Retail</span>
          <p className="text-sm text-[#7A6E62] mt-1">Set up your store in seconds.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E0D4] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <h1 className="text-lg font-semibold text-[#1A1208]">Name your shop</h1>
              <p className="text-sm text-[#7A6E62] mt-0.5">You can change this later</p>
            </div>

            <Input
              label="Shop name"
              placeholder="Her Boutique Lagos"
              value={storeName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
            />

            {handle && (
              <div className="bg-[#F5F0E8] rounded-xl px-4 py-3">
                <p className="text-xs text-[#7A6E62]">Your shop link</p>
                <p className="text-sm font-medium text-[#1A1208] mt-0.5">
                  <span className="text-[#7A6E62]">obsidianretail.com/</span>
                  {handle}
                </p>
              </div>
            )}

            <Input
              label="Custom handle (optional)"
              placeholder={handle}
              value={handle}
              onChange={(e) => setHandle(slugify(e.target.value))}
              hint="Letters, numbers and hyphens only"
            />

            <Button
              type="submit"
              loading={loading}
              disabled={!storeName || !handle}
              className="w-full h-12"
            >
              Create my shop
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
