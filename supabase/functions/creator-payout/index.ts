const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const BANK_MAP: Record<string, string> = { "M-Pesa (Tanzania)": "MPS", "M-Pesa": "MPS", "Mixx by Yas (Tigo Pesa)": "TIGO", "Airtel Money": "AIRTEL", "HaloPesa": "HALOPESA", "T-Pesa": "TPESA", "AzamPesa": "AZAMPESA", "M-Pesa (Kenya)": "MPESA", "MTN MoMo": "MTN", "CRDB Bank": "003", "NMB Bank": "016", "NBC Bank": "005", "Equity Bank": "047", "KCB Bank": "030", "Absa Bank": "020", "Stanbic Bank": "024", "DTB Bank": "032", "Azania Bank": "026" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { payoutId, userId, amount, currency, provider, account, holder } = await req.json();
    const u = Deno.env.get("SUPABASE_URL")!;
    const k = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const flw = Deno.env.get("FLW_SECRET_KEY")!;
    const h = { apikey: k, Authorization: "Bearer " + k, "Content-Type": "application/json" };
    const code = BANK_MAP[provider] || "MPS";
    const cleanAcc = String(account || "").replace(/\s+/g, "").replace(/^\+/, "");
    const res = await fetch("https://flutterwave.com", { method: "POST", headers: { Authorization: "Bearer " + flw, "Content-Type": "application/json" }, body: JSON.stringify({ account_bank: code, account_number: cleanAcc, amount: Number(amount), currency: currency || "TZS", narration: "ZUKA Creator Payout", reference: "zuka_out_" + (payoutId || Date.now()), beneficiary_name: holder || "ZUKA Creator" }) });
    const data = await res.json();
    const ok = data?.status === "success";
    if (payoutId) await fetch(`${u}/rest/v1/payout_requests?id=eq.${encodeURIComponent(payoutId)}`, { method: "PATCH", headers: h, body: JSON.stringify({ status: ok ? "paid" : "failed", transaction_ref: String(data?.data?.id || "") }) });
    if (!ok) return new Response(JSON.stringify({ error: data?.message || "Transfer failed" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ ok: true, transfer: data?.data }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) { return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }); }
});
