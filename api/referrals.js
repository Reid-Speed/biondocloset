import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method === 'POST' && req.body.action === 'register') {
      // Register a new referral code
      const { code } = req.body;
      const { data, error } = await supabase
        .from('referrals')
        .insert([{ code, active: true }])
        .select();

      // Ignore duplicate key errors
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
      return res.status(200).json({ success: true });
    }

    if (req.method === 'POST' && req.body.action === 'validate') {
      // Validate a referral code
      const { code } = req.body;
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('code', code)
        .eq('active', true);

      if (error) throw error;
      return res.status(200).json({ valid: data && data.length > 0 });
    }

    if (req.method === 'POST' && req.body.action === 'use') {
      // Mark a referral code as used by a user
      const { userCode, usedCode } = req.body;

      // Check if code is valid
      const { data: validData, error: validError } = await supabase
        .from('referrals')
        .select('*')
        .eq('code', usedCode)
        .eq('active', true);

      if (validError) throw validError;
      if (!validData || validData.length === 0) {
        return res.status(400).json({ error: 'Invalid referral code' });
      }

      // Check if already used
      const { data: usedData, error: usedError } = await supabase
        .from('referral_usage')
        .select('*')
        .eq('user_code', userCode)
        .eq('used_code', usedCode);

      if (usedError) throw usedError;
      if (usedData && usedData.length > 0) {
        return res.status(400).json({ error: 'Code already used' });
      }

      // Record usage
      const { data: insertData, error: insertError } = await supabase
        .from('referral_usage')
        .insert([{ user_code: userCode, used_code: usedCode }]);

      if (insertError) throw insertError;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      // Get discount count for a user
      const { userCode } = req.query;
      const { data, error, count } = await supabase
        .from('referral_usage')
        .select('*', { count: 'exact' })
        .eq('user_code', userCode);

      if (error) throw error;
      return res.status(200).json({ count: count || 0 });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message });
  }
}