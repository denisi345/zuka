const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { tipId, amount, currency, provider, phone, isCard } = await req.json();
    const key = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing FLUTTERWAVE_SECRET_KEY" }), { status: 400, headers: cors });
    const tx_ref = "zuka_gift_" + (tipId || Date.now());
    const tx_ref = "zuka_gift_" + (tipId || Date.now());
    const uPay = new Array("https:", "", "api.flutterwave.com", "v3", "payments").join("/");
    const uRed = new Array("https:", "", "zuka-world-app.pages.dev").join("/");
    if (isCard) {
      const res = await fetch(uPay, {
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({ tx_ref, amount, currency, redirect_url: uRed, customer: { email: phone }, customizations: { title: "ZUKA Creator Gift" } })
      });
      const json = await res.json();
      return new Response(JSON.stringify({ checkoutUrl: json?.data?.link || null, raw: json }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    const netMap: Record<string, string> = { "M-Pesa": "MPESA", "Mixx by Yas": "TIGO", "Airtel Money": "AIRTEL", "HaloPesa": "HALOPESA" };
    const uMob = new Array("https:", "", "api.flutterwave.com", "v3", "charges?type=mobile_money_tanzania").join("/");
    const res = await fetch(uMob, {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ tx_ref, amount, currency: currency || "TZS", email: "gift@zuka.app", phone_number: phone, network: netMap[provider] || "MPESA" })
    });
    const json = await res.json();
    return new Response(JSON.stringify({ status: json?.status, raw: json }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
