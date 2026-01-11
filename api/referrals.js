import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // Initialize tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        code TEXT PRIMARY KEY,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS referral_usage (
        id SERIAL PRIMARY KEY,
        user_code TEXT NOT NULL,
        used_code TEXT NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_code, used_code)
      )
    `;

    if (req.method === 'POST' && req.body.action === 'register') {
      // Register a new referral code
      const { code } = req.body;
      await sql`
        INSERT INTO referrals (code, active)
        VALUES (${code}, true)
        ON CONFLICT (code) DO NOTHING
      `;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'POST' && req.body.action === 'validate') {
      // Validate a referral code
      const { code } = req.body;
      const { rows } = await sql`
        SELECT * FROM referrals WHERE code = ${code} AND active = true
      `;
      return res.status(200).json({ valid: rows.length > 0 });
    }

    if (req.method === 'POST' && req.body.action === 'use') {
      // Mark a referral code as used by a user
      const { userCode, usedCode } = req.body;
      
      // Check if code is valid
      const { rows: validRows } = await sql`
        SELECT * FROM referrals WHERE code = ${usedCode} AND active = true
      `;
      
      if (validRows.length === 0) {
        return res.status(400).json({ error: 'Invalid referral code' });
      }

      // Check if already used
      const { rows: usedRows } = await sql`
        SELECT * FROM referral_usage WHERE user_code = ${userCode} AND used_code = ${usedCode}
      `;

      if (usedRows.length > 0) {
        return res.status(400).json({ error: 'Code already used' });
      }

      // Record usage
      await sql`
        INSERT INTO referral_usage (user_code, used_code)
        VALUES (${userCode}, ${usedCode})
      `;

      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      // Get discount count for a user
      const { userCode } = req.query;
      const { rows } = await sql`
        SELECT COUNT(*) as count FROM referral_usage WHERE user_code = ${userCode}
      `;
      return res.status(200).json({ count: parseInt(rows[0].count) });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message });
  }
}
