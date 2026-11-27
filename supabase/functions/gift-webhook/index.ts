Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const txRef = body?.data?.tx_ref || "";
    const status = body?.data?.status || "";
    if (!txRef.startsWith("zuka_gift_")) return new Response("ignored", { status: 200 });
    const tipId = txRef.replace("zuka_gift_", "");
    const nextStatus = status === "successful" ? "paid" : "failed";
