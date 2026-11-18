export async function onRequestPost(context) {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
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

    const res = await fetch(`https://googleapis.com{encodeURIComponent(apiKey.trim())}`, {
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
      const errMsg = data?.error?.message || `API status ${res.status}`;
      return new Response(JSON.stringify({ reply: `ZUKA AI setup note: ${errMsg}` }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    const candidates = data && data.candidates ? data.candidates : [];
    const first = candidates.length > 0 ? candidates.at(0) : null;
    const parts = first && first.content && first.content.parts ? first.content.parts : [];
    const reply = parts.length > 0 && parts.at(0).text ? parts.at(0).text : "No response generated.";
    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ reply: `ZUKA AI error: ${err?.message || "Unknown error"}` }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
