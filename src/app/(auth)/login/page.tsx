"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ArrowRight, Mail, Lock, ShieldCheck, Sparkles } from "lucide-react";

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

      if (data.session) {
        router.push("/onboarding");
        return;
      }

      setCheckEmail(true);
      return;
    }

    const { data: signData, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      toast("Incorrect email or password.", "error");
      return;
    }

    if (!signData.user) {
      setLoading(false);
      toast("Session error. Please try again.", "error");
      return;
    }

    // Check if they have a merchant profile
    const { data: merchant } = await supabase
      .from("merchants")
      .select("handle")
      .eq("user_id", signData.user.id)
      .maybeSingle(); // Better than .single() which errors if 0 rows

    setLoading(false);
    router.push(merchant ? "/dashboard" : "/onboarding");
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-10">
            <div className="w-8 h-8 bg-[#1A1208] rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-[#C4973A] rotate-45" />
            </div>
            <span className="text-xl font-bold text-[#1A1208] tracking-tight">Obsidian Retail</span>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-[#E8E0D4] p-10 shadow-premium relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C4973A] to-[#1A1208]" />
            <div className="w-20 h-20 bg-[#F5F0E8] rounded-full flex items-center justify-center mx-auto mb-8">
              <Mail size={32} className="text-[#C4973A]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1208] mb-4 tracking-tight">Verify your identity</h1>
            <p className="text-sm text-[#7A6E62] leading-relaxed mb-8">
              We've sent a magic link to <span className="font-bold text-[#1A1208]">{email}</span>. 
              Click the button in your inbox to proceed.
            </p>
            <button
              type="button"
              onClick={() => setCheckEmail(false)}
              className="text-xs font-black text-[#C4973A] uppercase tracking-[0.2em] hover:underline"
            >
              ← Use a different email
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#C4973A]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#1A1208]/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#1A1208] rounded-xl flex items-center justify-center shadow-lg shadow-[#1A1208]/20">
              <div className="w-5 h-5 border-2 border-[#C4973A] rotate-45" />
            </div>
            <span className="text-2xl font-black text-[#1A1208] tracking-tighter uppercase">Obsidian Retail</span>
          </div>
          <p className="text-[#7A6E62] font-medium tracking-tight">Your shop, live in 60 seconds.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[3rem] border border-[#E8E0D4] p-10 shadow-premium relative"
        >
          {/* Mode Switcher */}
          <div className="flex p-1.5 bg-[#F5F0E8] rounded-2xl mb-10 relative">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`relative z-10 flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  mode === m ? "text-[#1A1208]" : "text-[#7A6E62] hover:text-[#1A1208]"
                }`}
              >
                {m === "signin" ? "Sign In" : "Join Now"}
                {mode === m && (
                  <motion.div 
                    layoutId="mode-bg"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-4">
              <div className="relative group">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                  className="pl-12 h-14 rounded-2xl border-[#E8E0D4] focus:border-[#C4973A] focus:ring-4 focus:ring-[#C4973A]/5 transition-all"
                />
                <Mail className="absolute left-4 bottom-4 text-[#B0A89E] group-focus-within:text-[#C4973A] transition-colors" size={20} />
              </div>

              <div className="relative group">
                <Input
                  label="Secure Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="pl-12 h-14 rounded-2xl border-[#E8E0D4] focus:border-[#C4973A] focus:ring-4 focus:ring-[#C4973A]/5 transition-all"
                />
                <Lock className="absolute left-4 bottom-4 text-[#B0A89E] group-focus-within:text-[#C4973A] transition-colors" size={20} />
              </div>
            </div>

            <Button 
              type="submit" 
              loading={loading} 
              className="w-full h-14 rounded-2xl bg-[#1A1208] hover:bg-black text-white font-bold uppercase tracking-widest shadow-xl shadow-[#1A1208]/20 transition-all hover:scale-[1.02] active:scale-[0.98] group mt-2"
            >
              {mode === "signin" ? "Enter Store" : "Create My Shop"}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          {/* Social Proof inside Login */}
          <div className="mt-10 pt-8 border-t border-[#F5F0E8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#2D6A4F]" />
              <span className="text-[10px] font-bold text-[#7A6E62] uppercase tracking-wider">PCI-DSS Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#C4973A]" />
              <span className="text-[10px] font-bold text-[#7A6E62] uppercase tracking-wider">Smart Tools</span>
            </div>
          </div>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-[10px] font-bold text-[#B0A89E] uppercase tracking-[0.2em] mt-10"
        >
          Protected by Obsidian Studios & Payaza
        </motion.p>
      </div>
    </div>
  );
}
