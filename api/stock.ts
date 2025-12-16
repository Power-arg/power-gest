import type { VercelRequest, VercelResponse } from '@vercel/node';

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL!;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getStock',
      }),
    });

    const text = await response.text();
    const data = JSON.parse(text);

    if (data.error) {
      return res.status(500).json({ success: false, error: data.error });
    }

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('STOCK ERROR:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}