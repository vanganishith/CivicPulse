import express from "express";
import Complaint from "../models/Complaint.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ date: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
});

router.post("/", async (req, res) => {
  try {
    const complaint = new Complaint(req.body);
    await complaint.save();
    res.json({ id: complaint.id });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Failed to save complaint", detail: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.json(complaint);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update complaint", detail: err.message });
  }
});

export default router;
