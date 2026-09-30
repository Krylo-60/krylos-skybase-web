export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Live Dynamic Status Check (Synced with Discord #crew-apply)
  let applicationsOpen = false;
  const token = process.env.DISCORD_TOKEN;
  if (token) {
    try {
      const channelId = '1550902305568718948';
      const checkRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=5`, {
        headers: { Authorization: `Bot ${token}` }
      });
      if (checkRes.ok) {
        const msgs = await checkRes.json();
        const appMsg = msgs.find(m => m.embeds && m.embeds.length > 0);
        if (appMsg && appMsg.embeds[0]) {
          const desc = appMsg.embeds[0].description || '';
          const title = appMsg.embeds[0].title || '';
          if (desc.includes('NOW OPEN!') || title.includes('Official Production Crew Applications')) {
            applicationsOpen = true;
          }
        }
      }
    } catch (e) {
      console.error('Dynamic status check error:', e.message);
    }
  }

  if (!applicationsOpen) {
    return res.status(403).json({
      ok: false,
      error: 'Crew applications are currently closed as the video production roster is at full capacity. Please keep an eye on announcements for when auditions reopen!'
    });
  }

  const { name, contactMethod, contactValue, role, noDiscordPlan, experience } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Your name or handle is required!' });
  }

  if (!role || !role.trim()) {
    return res.status(400).json({ error: 'Please select the role you are auditioning for.' });
  }

  if (!noDiscordPlan || !noDiscordPlan.trim()) {
    return res.status(400).json({ error: 'Please explain how you plan to communicate with the crew without Discord.' });
  }

  const webhookUrl = process.env.DISCORD_CREW_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('DISCORD_CREW_WEBHOOK_URL environment variable is not configured.');
    return res.status(500).json({ error: 'Audition system is currently undergoing maintenance. Please check back soon!' });
  }

  try {
    const embed = {
      title: "🎬 New Film Crew Audition (Web Portal Submission)",
      description: "A creator submitted an application via the **Krylo's Skybase Web Portal** (Non-Discord Applicant).",
      color: 0x00E5FF,
      fields: [
        {
          name: "👤 Applicant Name / Handle",
          value: `**${name.trim()}**`,
          inline: true
        },
        {
          name: "🎯 Role Auditioning For",
          value: `**${role.trim()}**`,
          inline: true
        },
        {
          name: "📬 Alternate Contact Method",
          value: `**${contactMethod || 'Alternative'}:** ${contactValue ? contactValue.trim() : 'Not provided'}`,
          inline: false
        },
        {
          name: "❓ Communication Plan (No Discord)",
          value: `> *"${noDiscordPlan.trim()}"*`,
          inline: false
        },
        {
          name: "✨ Experience & Portfolio",
          value: experience && experience.trim() ? experience.trim() : '*No additional experience links provided.*',
          inline: false
        }
      ],
      footer: {
        text: "Krylo's Skybase • Web Audition Bridge",
        icon_url: "https://krylos-skybase-web.vercel.app/skybase-portal-clean.png"
      },
      timestamp: new Date().toISOString()
    };

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: "Skybase Audition Bot",
        avatar_url: "https://krylos-skybase-web.vercel.app/skybase-portal-clean.png",
        content: "🚨 **New Film Crew Application Received from Website!** (@here / @Krylo)",
        embeds: [embed]
      })
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error('Webhook error:', discordRes.status, errText);
      return res.status(500).json({ error: 'Failed to send application to Discord.' });
    }

    return res.status(200).json({
      ok: true,
      message: 'Your audition application was received successfully! Krylo and the team will review your application.'
    });
  } catch (err) {
    console.error('Audition error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error submitting audition.' });
  }
}
