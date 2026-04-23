import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { password } = req.body;
  const SETTINGS_PASSWORD = process.env.SETTINGS_PASSWORD;

  if (!SETTINGS_PASSWORD) {
    return res.json({ success: true });
  }

  if (password === SETTINGS_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Feil passord" });
  }
}
