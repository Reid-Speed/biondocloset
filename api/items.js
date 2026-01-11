import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // Initialize tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price DECIMAL NOT NULL,
        description TEXT,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    if (req.method === 'GET') {
      // Get all items
      const { rows } = await sql`SELECT * FROM items ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      // Add new item
      const { id, name, price, description, image } = req.body;
      await sql`
        INSERT INTO items (id, name, price, description, image)
        VALUES (${id}, ${name}, ${price}, ${description || ''}, ${image || ''})
      `;
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      // Update item
      const { id, name, price, description, image } = req.body;
      await sql`
        UPDATE items
        SET name = ${name}, price = ${price}, description = ${description || ''}, image = ${image || ''}
        WHERE id = ${id}
      `;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      // Delete item
      const { id } = req.body;
      await sql`DELETE FROM items WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message });
  }
}
