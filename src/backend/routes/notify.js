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

const MESSAGES = {
  "In Progress": (id, title, officer) =>
    `CivicPulse Update 🔄\n\nYour complaint "${title}" (${id}) is now In Progress.\n\nAssigned Officer: ${officer || "Being assigned"}\n\nTrack: civicpulse.app`,

  "Resolved": (id, title) =>
    `CivicPulse Update ✅\n\nYour complaint "${title}" (${id}) has been resolved!\n\nThank you for helping improve our city.\n\nTrack: civicpulse.app`,

  "Rejected": (id, title) =>
    `CivicPulse Update ❌\n\nYour complaint "${title}" (${id}) could not be processed.\n\nPlease re-submit with more details.\n\nTrack: civicpulse.app`,
};

router.post("/status", async (req, res) => {
  try {
    const { phone, complaintId, status, title, officer } = req.body;

    const messageFn = MESSAGES[status];
    if (!messageFn) return res.status(400).json({ error: "No SMS for this status" });

    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) return res.status(400).json({ error: "Invalid phone" });

    const body = messageFn(complaintId, title, officer);

    // Use Twilio Verify service to send notification SMS
    // Note: For status notifications we use the messaging API directly
    const message = await client.messages.create({
      body,
      messagingServiceSid: VERIFY_SID,
      to: `+91${digits}`,
    });

    console.log(`✅ Status SMS sent to +91${digits} | ${status} | SID: ${message.sid}`);
    res.json({ success: true });

  } catch (err) {
    console.error("Notify SMS error:", err.message);
    // Non-blocking — don't fail the complaint update if SMS fails
    res.json({ success: false, error: err.message });
  }
});

export default router;
