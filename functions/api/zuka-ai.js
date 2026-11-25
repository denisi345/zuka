export async function onRequestPost(context) {
  try {
    const key = (context.env.GEMINI_API_KEY || context.env.VITE_GEMINI_API_KEY || "").trim();
    if (!key) return new Response(JSON.stringify({ reply: "GEMINI_API_KEY missing" }), { headers: { "Content-Type": "application/json" } });
    const body = await context.request.json();
    const raw = (Array.isArray(body.messages) ? body.messages : []).filter((m) => m && m.id !== "ai-welcome").slice(-10);
    const lastUser = [...raw].reverse().find((m) => m.sender_id !== "zuka-ai");
    const prompt = String(lastUser?.content || "Hello ZUKA AI").trim();
    const base = atob("aHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRh");
    const ir = await fetch(`${base}/interactions?key=${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "gemini-3.8-flash", input: prompt }) });
    const idata = await ir.json();
    const iout = Array.isArray(idata?.outputs) ? idata.outputs.at(-1)?.text : "";
    if (ir.ok && iout) return new Response(JSON.stringify({ reply: iout }), { headers: { "Content-Type": "application/json" } });
    const contents = raw.map((m) => ({ role: m.sender_id === "zuka-ai" ? "model" : "user", parts: m.imageBase64 ? [{ inlineData: { mimeType: m.imageMime || "image/jpeg", data: m.imageBase64 } }, { text: m.content || "Analyze" }] : [{ text: String(m.content || "Hi") }] }));
    if (contents.at(0)?.role === "model") contents.shift();
    let gdata = null;
    for (const m of ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-2.5-flash"]) {
      const r = await fetch(`${base}/models/${m}:generateContent?key=${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents }) });
      gdata = await r.json();
      const txt = gdata?.candidates?.at(0)?.content?.parts?.at(0)?.text;
      if (r.ok && txt) return new Response(JSON.stringify({ reply: txt }), { headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ reply: "ZUKA AI note: " + (gdata?.error?.message || idata?.error?.message || "No reply") }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ reply: "ZUKA AI error: " + String(e?.message || e) }), { headers: { "Content-Type": "application/json" } });
  }
}
