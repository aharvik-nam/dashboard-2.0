import express from "express";

const router = express.Router();

router.post("/verify-password", (req, res) => {
  const { password } = req.body;
  const SETTINGS_PASSWORD = process.env.SETTINGS_PASSWORD;

  if (!SETTINGS_PASSWORD) {
    console.warn("⚠️ SETTINGS_PASSWORD er ikke satt i miljøvariabler. Tillater tilgang uten passord.");
    return res.json({ success: true });
  }

  if (password === SETTINGS_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Feil passord" });
  }
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const envUser = process.env.APP_USERNAME || 'foto';
  const envPass = process.env.APP_PASSWORD || 'NaMFOTO';

  console.log(`Login attempt for user: ${username}`);
  console.log(`Comparing against env user: ${envUser} (from env: ${!!process.env.APP_USERNAME})`);

  if (username === envUser && password === envPass) {
    console.log("Login successful");
    res.json({ success: true, token: "authenticated-user-token" });
  } else {
    console.log("Login failed: Invalid credentials");
    res.status(401).json({ success: false, message: "Ugyldig brukernavn eller passord" });
  }
});

export default router;
