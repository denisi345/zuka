Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const txRef = body?.data?.tx_ref || "";
    const ok = (body?.data?.status || "") === "successful";
    const u = Deno.env.get("SUPABASE_URL")!;
    const k = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const h = { apikey: k, Authorization: "Bearer " + k, "Content-Type": "application/json" };
