export async function onRequestPost(context) {
  try {
    const apiKey = (context.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return new Response(JSON.stringify({ reply: "GEMINI_API_KEY is missing in Cloudflare Pages Production Environment Variables." }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await context.request.json();
    const rawHistory = Array.isArray(body.messages) ? body.messages.filter((m) => m.id !== "ai-welcome").slice(-10) : [];
    const contents = rawHistory.map((m) => ({
      role: m.sender_id === "zuka-ai" ? "model" : "user",
      parts: [{ text: String(m.content || "") }]
    }));
    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "Hello ZUKA AI" }] });
    }

    const endpoint = "https://googleapis.com" + apiKey;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "You are ZUKA AI, a brilliant, helpful, and deeply knowledgeable AI assistant built inside the ZUKA social app. Give thorough, clear, well-structured, and intelligent answers in whatever language the user speaks (English, Swahili, etc.)." }]
        },
        contents
      })
    });
    const data = await res.json();
    if (!res.ok) {
      const errMsg = data?.error?.message || "API status " + res.status;
      return new Response(JSON.stringify({ reply: "ZUKA AI note: " + errMsg }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
    const parts = Array.isArray(candidates.at(0)?.content?.parts) ? candidates.at(0).content.parts : [];
    const reply = parts.at(0)?.text || "No response generated.";
    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ reply: "ZUKA AI error: " + (err?.message || "Unknown error") }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
