import { serve } from "https://deno.land";
import { createClient } from "https://esm.sh";

serve(async (req) => {
  try {
    const body = await req.json();
    const txRef = body?.data?.tx_ref || "";
    const status = body?.data?.status || "";
    if (!txRef.startsWith("zuka_gift_")) return new Response("ignored", { status: 200 });
    const tipId = txRef.replace("zuka_gift_", "");
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const nextStatus = status === "successful" ? "paid" : "failed";
    await sb.from("creator_tips").update({ payment_status: nextStatus, transaction_ref: String(body?.data?.id || "") }).eq("id", tipId);
    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
