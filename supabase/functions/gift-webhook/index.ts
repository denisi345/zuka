Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const txRef = body?.data?.tx_ref || "";
    const ok = (body?.data?.status || "") === "successful";
    const u = Deno.env.get("SUPABASE_URL")!;
    const k = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const h = { apikey: k, Authorization: "Bearer " + k, "Content-Type": "application/json" };
    if (txRef.startsWith("zuka_gift_")) {
      const id = encodeURIComponent(txRef.replace("zuka_gift_", ""));
      const tipArr = await (await fetch(`${u}/rest/v1/creator_tips?id=eq.${id}&select=id,amount`, { headers: h })).json();
      const setArr = await (await fetch(`${u}/rest/v1/system_settings?id=eq.1&select=gift_commission_percent`, { headers: h })).json();
      const gross = Number(tipArr?.[0]?.amount || body?.data?.amount || 0);
      const pct = Number(setArr?.[0]?.gift_commission_percent || 0);
      const net = Math.max(0, Number((gross * (1 - pct / 100)).toFixed(2)));
      await fetch(`${u}/rest/v1/creator_tips?id=eq.${id}`, { method: "PATCH", headers: h, body: JSON.stringify({ payment_status: ok ? "paid" : "failed", creator_net: ok ? net : 0, transaction_ref: String(body?.data?.id || "") }) });
    } else if (txRef.startsWith("zuka_req_") && ok) {
      const id = encodeURIComponent(txRef.replace("zuka_req_", ""));
      const rArr = await (await fetch(`${u}/rest/v1/payment_requests?id=eq.${id}&select=*`, { headers: h })).json();
      const r = Array.isArray(rArr) ? (rArr[0] || {}) : {};
      await fetch(`${u}/rest/v1/payment_requests?id=eq.${id}`, { method: "PATCH", headers: h, body: JSON.stringify({ status: "approved" }) });
      if (r.request_type === "blue_tick" && r.user_id) {
        await fetch(`${u}/rest/v1/profiles?id=eq.${r.user_id}`, { method: "PATCH", headers: h, body: JSON.stringify({ is_verified: true, is_blue_tick: true }) });
      } else if (r.request_type === "boost" && r.target_id) {
        const exp = new Date(Date.now() + Number(r.duration_days || 3) * 86400000).toISOString();
        const tbl = r.target_type === "marketplace" ? "marketplace_listings" : "posts";
        await fetch(`${u}/rest/v1/${tbl}?id=eq.${encodeURIComponent(r.target_id)}`, { method: "PATCH", headers: h, body: JSON.stringify({ is_boosted: true, boost_expires_at: exp }) });
      }
    }
    return new Response("ok", { status: 200 });
  } catch (e) { return new Response(String(e), { status: 500 }); }
});
