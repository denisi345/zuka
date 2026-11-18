export async function onRequestPost(context) {
  try {
    const apiKey = ((context.env.GEMINI_API_KEY || context.env.VITE_GEMINI_API_KEY) || "").trim();
    if (!apiKey) {
      return new Response(JSON.stringify({ reply: "GEMINI_API_KEY is missing in Cloudflare Pages Production Environment Variables." }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await context.request.json();
    const rawHistory = Array.isArray(body.messages) ? body.messages.filter((m) => m.id !== "ai-welcome").slice(-10) : [];
    const contents = rawHistory.map((m) => {
      const parts = [];
      if (m.imageBase64 && m.imageMime) {
        parts.push({ inlineData: { mimeType: m.imageMime, data: m.imageBase64 } });
      }
      const txt = String(m.content || "").replace(/^\[photo\].*$/, "").trim();
      parts.push({ text: txt || "Please analyze this image in detail." });
      return {
        role: m.sender_id === "zuka-ai" ? "model" : "user",
        parts
      };
    });
    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "Hello ZUKA AI" }] });
    }

    const endpoint = ["https://generativelanguage","://googleapis.com"].join(".") + encodeURIComponent(apiKey);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "You are ZUKA AI, a brilliant, helpful, and deeply knowledgeable multimodal AI assistant built inside the ZUKA social app. Analyze images and text thoroughly, clearly, and intelligently in whatever language the user speaks (English, Swahili, etc.)." }]
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
