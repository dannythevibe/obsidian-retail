"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      setLoading(false);

      if (error) {
        toast(error.message, "error");
        return;
      }

      // If session exists immediately, email confirmation is disabled — go straight in
      if (data.session) {
        router.push("/onboarding");
        return;
      }

      // Otherwise email confirmation is required
      setCheckEmail(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast("Incorrect email or password.", "error");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: merchant } = await supabase
      .from("merchants")
      .select("handle")
      .eq("user_id", user!.id)
      .single();

    router.push(merchant ? "/dashboard" : "/onboarding");
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <span className="text-2xl font-bold text-[#1A1208] tracking-tight">Obsidian Retail</span>

          <div className="bg-white rounded-2xl border border-[#E8E0D4] p-8 shadow-sm mt-10">
            <div className="text-3xl mb-4">📬</div>
            <h1 className="text-lg font-semibold text-[#1A1208]">Check your email</h1>
            <p className="text-sm text-[#7A6E62] mt-2 leading-relaxed">
              We sent a confirmation link to <span className="font-medium text-[#1A1208]">{email}</span>.
              Click it to activate your account and set up your shop.
            </p>
            <button
              type="button"
              onClick={() => setCheckEmail(false)}
              className="mt-6 text-xs text-[#C4973A] underline underline-offset-2"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="text-2xl font-bold text-[#1A1208] tracking-tight">Obsidian Retail</span>
          <p className="text-sm text-[#7A6E62] mt-1">Your shop, live in 60 seconds.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E0D4] p-6 shadow-sm">
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-[#F5F0E8] p-1 mb-6">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  mode === m
                    ? "bg-white text-[#1A1208] shadow-sm"
                    : "text-[#7A6E62] hover:text-[#1A1208]"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            <Button type="submit" loading={loading} className="w-full h-12 mt-2">
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#B0A89E] mt-6">
          By continuing you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
