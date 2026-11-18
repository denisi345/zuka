export async function onRequestPost(context) {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ reply: "ZUKA AI is almost ready! Please add GEMINI_API_KEY in Cloudflare Pages Settings -> Environment variables." }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await context.request.json();
    const history = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    const contents = history.map((m) => ({
      role: m.sender_id === "zuka-ai" ? "model" : "user",
      parts: [{ text: String(m.content || "") }]
    }));

    const res = await fetch(`https://googleapis.com{apiKey}`, {
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
    const reply = data?.candidates?.at(0)?.content?.parts?.at(0)?.text || "I could not generate a response right now. Please try again.";
    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ reply: "Connection error. Please try again in a moment." }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
