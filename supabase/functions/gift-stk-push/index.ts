import { serve } from "https://deno.land";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { tipId, amount, currency, provider, phone, isCard } = await req.json();
    const key = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing FLUTTERWAVE_SECRET_KEY" }), { status: 400, headers: cors });
    const tx_ref = "zuka_gift_" + (tipId || Date.now());
