export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.DISCORD_TOKEN;
  const channelId = '1550902305568718948'; // #📋・𝖢rew-apply

  let isOpen = false;
  let lastChecked = new Date().toISOString();

  if (token) {
    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=5`, {
        headers: { Authorization: `Bot ${token}` }
      });

      if (response.ok) {
        const msgs = await response.json();
        const appMsg = msgs.find(m => m.embeds && m.embeds.length > 0);
        if (appMsg && appMsg.embeds[0]) {
          const title = appMsg.embeds[0].title || '';
          const desc = appMsg.embeds[0].description || '';
          if (desc.includes('NOW OPEN!') || title.includes('Official Production Crew Applications')) {
            isOpen = true;
          } else if (desc.includes('CURRENTLY CLOSED')) {
            isOpen = false;
          }
          lastChecked = appMsg.timestamp || lastChecked;
        }
      }
    } catch (e) {
      console.error('Error checking crew application status from Discord:', e);
    }
  }

  return res.status(200).json({
    ok: true,
    isOpen,
    lastChecked
  });
}
