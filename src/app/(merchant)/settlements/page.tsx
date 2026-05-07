import { createClient } from "@/lib/supabase/server";
import { getSettlements } from "@/lib/payaza/client";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default async function SettlementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, handle, store_name")
    .eq("user_id", user!.id)
    .single();

  // Pull raw transactions from our DB for the audit table
  const { data: transactions } = await supabase
    .from("payaza_transactions")
    .select("*, orders(reference, customer_name, products(name))")
    .eq("merchant_id", merchant!.id)
    .order("processed_at", { ascending: false });

  // Pull settlement summaries from Payaza
  const { from, to } = getDateRange();
  let settlements: Awaited<ReturnType<typeof getSettlements>> = [];
  try {
    settlements = await getSettlements({ from, to });
  } catch {
    // Payaza key not set yet — show empty state gracefully
  }

  const totalPaid       = transactions?.reduce((s, t) => s + t.amount, 0) ?? 0;
  const totalSettled    = settlements.reduce((s, t) => s + t.settled_amount, 0);
  const totalFees       = settlements.reduce((s, t) => s + t.fee, 0);
  const pendingSettlement = totalPaid - totalSettled;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1208]">Settlements</h1>
        <p className="text-sm text-[#7A6E62] mt-0.5">Last 30 days · Powered by Payaza</p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total received",    value: formatNaira(totalPaid),          sub: "All confirmed payments" },
          { label: "Settled to account",value: formatNaira(totalSettled),       sub: "Already in your bank" },
          { label: "Pending settlement",value: formatNaira(pendingSettlement),   sub: "Being processed" },
          { label: "Payaza fees",       value: formatNaira(totalFees),           sub: "Deducted from settlements" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E8E0D4] p-4">
            <p className="text-xs text-[#7A6E62]">{label}</p>
            <p className="text-lg font-bold text-[#1A1208] mt-1">{value}</p>
            <p className="text-xs text-[#B0A89E] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Payaza settlements */}
      {settlements.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-[#1A1208] mb-4">Settlement batches</h2>
          <div className="flex flex-col gap-2">
            {settlements.map((s) => (
              <div key={s.reference} className="bg-white rounded-2xl border border-[#E8E0D4] px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-[#7A6E62] truncate">{s.reference}</p>
                  <p className="text-xs text-[#B0A89E] mt-0.5">
                    {new Date(s.settled_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1A1208]">{formatNaira(s.settled_amount)}</p>
                    <p className="text-xs text-[#B0A89E]">fee {formatNaira(s.fee)}</p>
                  </div>
                  <Badge variant={s.status === "successful" ? "paid" : "pending"}>
                    {s.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transaction audit log */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1A1208]">Transaction log</h2>
          <span className="text-xs text-[#7A6E62]">{transactions?.length ?? 0} transactions</span>
        </div>

        {!transactions?.length ? (
          <div className="bg-[#F5F0E8] rounded-2xl p-10 text-center">
            <p className="text-sm text-[#7A6E62]">No transactions yet. Share your shop to start receiving payments.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E0D4] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-[#F5F0E8]">
              {["Order / Product", "Amount", "Status", "Date"].map((h) => (
                <span key={h} className="text-xs font-semibold text-[#7A6E62] uppercase tracking-wide">{h}</span>
              ))}
            </div>

            {/* Rows */}
            {transactions.map((t) => {
              const order = t.orders as unknown as {
                reference: string;
                customer_name: string;
                products: { name: string } | null;
              } | null;

              return (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3.5 border-b border-[#F5F0E8] last:border-0 items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1208] truncate">
                      {order?.products?.name ?? "Product"}
                    </p>
                    <p className="text-xs text-[#7A6E62] truncate">
                      {order?.customer_name ?? "—"} · {order?.reference ?? t.payaza_ref.slice(0, 12)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#1A1208] tabular-nums">
                    {formatNaira(t.amount)}
                  </span>
                  <Badge variant="paid">paid</Badge>
                  <span className="text-xs text-[#7A6E62] tabular-nums whitespace-nowrap">
                    {new Date(t.processed_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
