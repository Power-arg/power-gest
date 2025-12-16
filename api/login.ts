import type { VercelRequest, VercelResponse } from '@vercel/node';

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL!;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false });
    }

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        password,
      }),
    });

    const text = await response.text();

    const data = JSON.parse(text);

    return res.status(200).json({
      success: data.success === true,
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    return res.status(500).json({ success: false });
  }
}
