export async function onRequest(context) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  };

  const items = [];
  const nowIso = new Date().toISOString();

  // 1. Vuta habari mpya za moja kwa moja kutoka Google News RSS (Bure 100%, bila API Key)
  const rssSources = [
    { url: "https://google.com", badge: "🇹🇿 Habari Mpya" },
    { url: "https://google.com", badge: "⚽ Michezo" },
    { url: "https://google.com", badge: "🌍 Dunia" }
  ];

  for (const src of rssSources) {
    try {
      const res = await fetch(src.url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) continue;
      const xml = await res.text();
      const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 3);
      matches.forEach((m, idx) => {
        const block = m[1] || "";
        const rawTitle = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "").trim();
        const title = rawTitle.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || nowIso;
        if (title) {
          items.push({
            id: `live-news-${src.badge}-${idx}-${Date.now()}`,
            user_id: null,
            author_name: "ZUKA News AI",
            author_avatar: "https://ui-avatars.com",
            is_verified: true,
            content: `${src.badge} • ${title}`,
            image_url: "",
            created_at: new Date(pubDate).toISOString() || nowIso
          });
        }
      });
    } catch (_) {}
  }

  // 2. Kama GEMINI_API_KEY ipo kwenye Cloudflare Pages, ongeza uchambuzi wa AI na vichekesho
  const geminiKey = context?.env?.GEMINI_API_KEY || "";
  if (geminiKey) {
    try {
      const gemRes = await fetch(
        `https://googleapis.com{encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Andika vichekesho 2 vifupi vya Kiswahili vya kuvutia na salama kwa jamii, vitenganishe kwa |||" }] }]
          })
        }
      );
      if (gemRes.ok) {
        const gemData = await gemRes.json();
        const raw = gemData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        raw.split("|||").map((s) => s.trim()).filter(Boolean).slice(0, 2).forEach((joke, i) => {
          items.push({
            id: `live-news-ai-${i}-${Date.now()}`,
            user_id: null,
            author_name: "ZUKA News AI",
            author_avatar: "https://ui-avatars.com",
            is_verified: true,
            content: `😂 ${joke}`,
            image_url: "",
            created_at: nowIso
          });
        });
      }
    } catch (_) {}
  }

  return new Response(JSON.stringify({ ok: true, items }), { status: 200, headers });
}
