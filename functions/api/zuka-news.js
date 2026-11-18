export async function onRequestGet(context) {
  const items = [];
  try {
    const rssRes = await fetch("https://google.com");
    const xml = await rssRes.text();
    const matches = [...xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/g)].slice(0, 4);
    if (matches.length === 0) {
      const plainMatches = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/g)].slice(0, 4);
      plainMatches.forEach((m, i) => {
        items.push({
          id: `live-news-${Date.now()}-${i}`,
          author_name: "ZUKA News AI",
          is_verified: true,
          content: `📰 Breaking News: ${m.replace(/&amp;/g, "&").replace(/&quot;/g, '"')}`,
          created_at: new Date(m || Date.now()).toISOString(),
          likes_count: 14 + i * 7
        });
      });
    } else {
      matches.forEach((m, i) => {
        items.push({
          id: `live-news-${Date.now()}-${i}`,
          author_name: "ZUKA News AI",
          is_verified: true,
          content: `📰 Breaking News: ${m}`,
          created_at: new Date(m || Date.now()).toISOString(),
          likes_count: 18 + i * 9
        });
      });
    }
  } catch (_) {}

  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (apiKey) {
      const gemRes = await fetch(`https://googleapis.com{apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Generate 2 short, fresh, hilarious, clean viral jokes/memes in English for a social media feed today. Separate them with ||| and do not number them." }] }]
        })
      });
      const gemData = await gemRes.json();
      const raw = gemData?.candidates?.at(0)?.content?.parts?.at(0)?.text || "";
      raw.split("|||").map((s) => s.trim()).filter(Boolean).slice(0, 2).forEach((joke, i) => {
        items.push({
          id: `funny-ai-${Date.now()}-${i}`,
          author_name: "ZUKA Comedy AI",
          is_verified: true,
          content: `😂 ${joke}`,
          created_at: new Date(Date.now() - (i + 1) * 180000).toISOString(),
          likes_count: 27 + i * 11
        });
      });
    }
  } catch (_) {}

  if (items.length === 0) {
    items.push(
      { id: `live-news-${Date.now()}-1`, author_name: "ZUKA News AI", is_verified: true, content: "📰 Tech Update: Artificial Intelligence and mobile cloud apps are transforming digital communities across Africa and the world today.", created_at: new Date().toISOString(), likes_count: 34 },
      { id: `funny-ai-${Date.now()}-1`, author_name: "ZUKA Comedy AI", is_verified: true, content: "😂 Me: I will sleep early tonight.\nAlso me at 2:45 AM: Wonder how penguins have knees?", created_at: new Date(Date.now() - 300000).toISOString(), likes_count: 52 }
    );
  }

  return new Response(JSON.stringify({ items }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
