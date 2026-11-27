Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const txRef = body?.data?.tx_ref || "";
    const status = body?.data?.status || "";
    if (!txRef.startsWith("zuka_gift_")) return new Response("ignored", { status: 200 });
    const tipId = txRef.replace("zuka_gift_", "");
    const nextStatus = status === "successful" ? "paid" : "failed";
    const sbUrl = Deno.env.get("SUPABASE_URL")!;
    const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(sbUrl + "/rest/v1/creator_tips?id=eq." + encodeURIComponent(tipId), {
      method: "PATCH",
      headers: { apikey: sbKey, Authorization: "Bearer " + sbKey, "Content-Type": "application/json" },
      body: JSON.stringify({ payment_status: nextStatus, transaction_ref: String(body?.data?.id || "") })
    });
    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
