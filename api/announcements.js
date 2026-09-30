import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token = process.env.DISCORD_TOKEN;
  const channelId = '1549882277209571329'; // #📢・𝖠nnouncements

  if (token) {
    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=10`, {
        headers: { Authorization: `Bot ${token}` }
      });

      if (response.ok) {
        const msgs = await response.json();
        const parsed = msgs.map(m => {
          const embed = m.embeds?.[0] || {};
          return {
            id: m.id,
            timestamp: m.timestamp,
            title: embed.title || "Skybase Official Dispatch",
            author: embed.author?.name || m.author?.username || "Krylo",
            description: embed.description || m.content || "",
            image: embed.image?.url || null
          };
        });
        return res.status(200).json({ ok: true, source: 'live', announcements: parsed });
      }
    } catch (e) {
      console.error('Error fetching live Discord announcements:', e.message);
    }
  }

  // Fallback to static bundled data
  try {
    const dataPath = path.join(process.cwd(), 'data', 'announcements.json');
    if (fs.existsSync(dataPath)) {
      const fallback = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return res.status(200).json({ ok: true, source: 'cached', announcements: fallback });
    }
  } catch (err) {
    console.error('Fallback read error:', err);
  }

  return res.status(200).json({ ok: true, source: 'default', announcements: [] });
}
