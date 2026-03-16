import express from "express";
import dotenv from "dotenv";
import twilio from "twilio";
dotenv.config();

const router = express.Router();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const VERIFY_SID = process.env.TWILIO_VERIFY_SID;

/* ── Send OTP ── */
router.post("/send", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number required" });

    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      return res.status(400).json({ error: "Invalid phone number. Must be 10 digits." });
    }

    // Twilio Verify handles OTP generation + SMS delivery automatically
    const verification = await client.verify.v2
      .services(VERIFY_SID)
      .verifications.create({
        to: `+91${digits}`,
        channel: "sms",
      });

    console.log(`✅ OTP sent to +91${digits} | Status: ${verification.status}`);
    res.json({ success: true, message: `OTP sent to +91${digits}` });

  } catch (err) {
    console.error("OTP send error:", err.message);
    if (err.code === 60200) return res.status(400).json({ error: "Invalid phone number." });
    if (err.code === 60203) return res.status(429).json({ error: "Max OTP attempts reached. Wait 10 minutes." });
    res.status(500).json({ error: "Failed to send OTP.", detail: err.message });
  }
});

/* ── Verify OTP ── */
router.post("/verify", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ verified: false, error: "Phone and OTP required" });
    }

    const digits = phone.replace(/\D/g, "").slice(-10);

    // Twilio checks the code — no manual comparison needed
    const check = await client.verify.v2
      .services(VERIFY_SID)
      .verificationChecks.create({
        to: `+91${digits}`,
        code: otp,
      });

    console.log(`OTP check for +91${digits}: ${check.status}`);

    if (check.status === "approved") {
      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: "Incorrect OTP. Please try again." });
    }

  } catch (err) {
    console.error("OTP verify error:", err.message);
    if (err.code === 60202) {
      return res.status(400).json({ verified: false, error: "Max attempts exceeded. Request a new OTP." });
    }
    res.status(500).json({ verified: false, error: "Verification failed. Please try again." });
  }
});

export default router;
