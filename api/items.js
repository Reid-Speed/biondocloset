import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.biondocloset_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_biondocloset_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all items that are not sold
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('sold', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      // Add new item
      const { id, name, price, description, image } = req.body;
      const { data, error } = await supabase
        .from('items')
        .insert([{ id, name, price, description: description || '', image: image || '' }]);

      if (error) throw error;
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      // Update item
      const { id, name, price, description, image } = req.body;
      const { data, error } = await supabase
        .from('items')
        .update({ name, price, description: description || '', image: image || '' })
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      // Soft delete item (mark as sold)
      const { id } = req.body;
      const { data, error } = await supabase
        .from('items')
        .update({ sold: true })
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message });
  }
}