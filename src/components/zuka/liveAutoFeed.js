const RSS_SOURCES = [
  { name: 'BBC News Swahili', url: 'https://bbci.co.uk', fallbackImg: 'https://unsplash.com' },
  { name: 'Al Jazeera English', url: 'https://aljazeera.com', fallbackImg: 'https://unsplash.com' },
  { name: 'Millard Ayo', url: 'https://millardayo.com', fallbackImg: 'https://unsplash.com' }
];

const FUNNY_CURATED = [
  {
    id: 'funny-vid-1',
    author_name: 'Tanzania Comedy Hub',
    is_verified: false,
    content: 'Bosi akisema "leo tunatoka mapema saa kumi" halafu saa tisa na dakika hamsini anakuja na mafaili mapya matatu 😂🤦‍♂️',
    image_url: 'https://unsplash.com',
    time_label: 'Trending Comedy',
    likes_count: 14
  },
  {
    id: 'funny-vid-2',
    author_name: 'Vichekesho Vya Bongo',
    is_verified: false,
    content: 'Pale unapoingia duka la simu kuulizia bei ya iPhone 16 Pro Max halafu muuzaji anakwambia "chukua tu kaka tutaelewana" wakati mfukoni una nauli ya daladala tu 😅📱',
    image_url: 'https://googleapis.com',
    media_type: 'video',
    time_label: 'Funny Video',
    likes_count: 23
  }
];

export async function fetchLiveNewsAndFunny() {
  const results = [];
  for (const src of RSS_SOURCES) {
    try {
      const api = `https://rss2json.com{encodeURIComponent(src.url)}`;
      const res = await fetch(api);
      if (!res.ok) continue;
      const json = await res.json();
      const items = Array.isArray(json?.items) ? json.items.slice(0, 3) : [];
      items.forEach((item, idx) => {
        const cleanDesc = (item.description || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 170);
        const matchImg = (item.description || item.content || '').match(/<img[^>]+src="([^">]+)"/);
        const img = item.thumbnail || item.enclosure?.link || (matchImg ? matchImg : src.fallbackImg);
        results.push({
          id: `live-${src.name.replace(/\s+/g, '')}-${idx}-${item.pubDate || idx}`,
          author_name: src.name,
          is_verified: true,
          content: `${item.title}${cleanDesc ? `\n\n${cleanDesc}...` : ''}`,
          image_url: img,
          time_label: 'Live News',
          likes_count: 7 + idx * 4
        });
      });
    } catch (_) {}
  }
  return [...results, ...FUNNY_CURATED];
}
