import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfigCollection } from '../src/lib/mongodb/models';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      const configCollection = await getConfigCollection();
      const config = await configCollection.findOne({ key: 'admin_password' });

      if (!config) {
        return res.status(500).json({ error: 'Configuration not found' });
      }

      const isValid = await bcrypt.compare(password, config.value);
      return res.status(200).json({ valid: isValid });
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
