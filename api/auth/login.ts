import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;
  const envUser = process.env.APP_USERNAME || "foto";
  const envPass = process.env.APP_PASSWORD || "NaMFOTO";

  if (username === envUser && password === envPass) {
    res.json({ success: true, token: "authenticated-user-token" });
  } else {
    res.status(401).json({ success: false, message: "Ugyldig brukernavn eller passord" });
  }
}
