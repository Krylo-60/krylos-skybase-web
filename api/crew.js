import fs from 'fs';
import path from 'path';

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

  const { key } = req.body || {};
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ ok: false, error: 'Crew passkey is required.' });
  }

  const cleanKey = key.trim().toUpperCase();

  let roster = [];
  try {
    const dataPath = path.join(process.cwd(), 'data', 'crew-roster.json');
    if (fs.existsSync(dataPath)) {
      roster = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading crew roster:', err);
  }

  // Master key aliases for Krylo
  const isMasterKey = (cleanKey === 'KRYLO' || cleanKey === 'KRYLO-MASTER' || cleanKey === 'SKYBASE2026');

  let member = null;
  if (isMasterKey) {
    member = roster.find(m => m.isMaster) || {
      key: 'KRYLO-MASTER',
      name: 'Krylo',
      handle: '@krylomcyt',
      role: '👑 Director & Executive Producer',
      badge: 'Master Director',
      clearance: 'Level 5 • High Command Clearance',
      status: 'DIRECTING ACTIVE PRODUCTIONS',
      assignedProject: 'All Active Skybase YouTube Productions',
      callTime: 'Continuous Production Oversight',
      directorNotes: 'Master Director Key. You have full oversight of all current shoot windows, set blueprints, and production scripts.',
      id: 'SKY-DIR-001',
      isMaster: true
    };
  } else {
    member = roster.find(m => m.key && m.key.toUpperCase() === cleanKey);
  }

  if (!member) {
    return res.status(401).json({
      ok: false,
      error: 'Invalid crew passkey. Passkeys are individually issued by Krylo. Contact Krylo if you were accepted into the crew.'
    });
  }

  return res.status(200).json({
    ok: true,
    member: member,
    allRoster: member.isMaster ? roster.filter(m => !m.isMaster) : null
  });
}
