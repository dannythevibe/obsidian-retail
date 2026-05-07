const PAYAZA_LIVE_URL = "https://api.payaza.africa";
const PAYAZA_SANDBOX_URL = "https://api-sandbox.payaza.africa";

function getBaseUrl() {
  return process.env.PAYAZA_ENV === "live" ? PAYAZA_LIVE_URL : PAYAZA_SANDBOX_URL;
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Payaza ${process.env.PAYAZA_API_KEY}`,
    "X-TenantID": process.env.PAYAZA_MERCHANT_ID ?? "",
  };
}

async function payazaRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Payaza API error ${res.status}: ${error}`);
  }

  return res.json();
}

// ─── VIRTUAL ACCOUNT ──────────────────────────────────────────────────────────

export interface CreateVirtualAccountParams {
  amount: number;
  reference: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  expiryMinutes?: number;
}

export interface VirtualAccountResponse {
  account_number: string;
  bank_name: string;
  account_name: string;
  amount: number;
  reference: string;
  expires_at: string;
}

export async function createVirtualAccount(
  params: CreateVirtualAccountParams
): Promise<VirtualAccountResponse> {
  const payload = {
    transaction_type: "reserved_account",
    service_payload: {
      amount: params.amount,
      transaction_ref: params.reference,
      currency: "NGN",
      description: `Payment for order ${params.reference}`,
      merchant_reference: params.reference,
      payer: {
        name: params.customerName,
        email: params.customerEmail ?? "",
        phone: params.customerPhone ?? "",
      },
      account_expiry_duration_in_minutes: params.expiryMinutes ?? 30,
    },
  };

  const res = await payazaRequest<{
    response_code: string;
    response_message: string;
    data: {
      account_number: string;
      bank_name: string;
      account_name: string;
      amount: number;
      transaction_reference: string;
      expiry_date: string;
    };
  }>("POST", "/accounts/api/v3/reserved-accounts/create", payload);

  return {
    account_number: res.data.account_number,
    bank_name: res.data.bank_name,
    account_name: res.data.account_name,
    amount: res.data.amount,
    reference: res.data.transaction_reference,
    expires_at: res.data.expiry_date,
  };
}

// ─── TRANSACTION STATUS ───────────────────────────────────────────────────────

export interface TransactionStatus {
  reference: string;
  status: "pending" | "successful" | "failed";
  amount: number;
  paid_at: string | null;
}

export async function getTransactionStatus(
  reference: string
): Promise<TransactionStatus> {
  const res = await payazaRequest<{
    data: {
      transaction_reference: string;
      transaction_status: string;
      amount: number;
      payment_date: string | null;
    };
  }>("GET", `/accounts/api/v3/transactions/${reference}`);

  return {
    reference: res.data.transaction_reference,
    status: res.data.transaction_status === "successful" ? "successful" : "pending",
    amount: res.data.amount,
    paid_at: res.data.payment_date,
  };
}

// ─── SETTLEMENT DATA ──────────────────────────────────────────────────────────

export interface SettlementRecord {
  reference: string;
  amount: number;
  settled_amount: number;
  fee: number;
  status: string;
  settled_at: string;
}

export async function getSettlements(params: {
  from: string;
  to: string;
  page?: number;
}): Promise<SettlementRecord[]> {
  const res = await payazaRequest<{
    data: {
      settlements: Array<{
        transaction_reference: string;
        amount: number;
        settlement_amount: number;
        fee: number;
        status: string;
        settlement_date: string;
      }>;
    };
  }>("GET", `/accounts/api/v3/settlements?from=${params.from}&to=${params.to}&page=${params.page ?? 1}`);

  return res.data.settlements.map((s) => ({
    reference: s.transaction_reference,
    amount: s.amount,
    settled_amount: s.settlement_amount,
    fee: s.fee,
    status: s.status,
    settled_at: s.settlement_date,
  }));
}

// ─── WEBHOOK VERIFICATION ─────────────────────────────────────────────────────

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require("crypto");
  const secret = process.env.PAYAZA_WEBHOOK_SECRET ?? "";
  const expected = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");
  return expected === signature;
}

export interface WebhookPayload {
  event: string;
  data: {
    transaction_reference: string;
    merchant_reference: string;
    amount: number;
    status: string;
    payment_date: string;
    payer: {
      name: string;
      email: string;
      phone: string;
    };
  };
}
