import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/merchant/sidebar";

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: merchant } = await supabase
    .from("merchants")
    .select("handle, store_name")
    .eq("user_id", user.id)
    .single();

  if (!merchant) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Sidebar handle={merchant.handle} storeName={merchant.store_name} />
      <main className="lg:pl-56 pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
