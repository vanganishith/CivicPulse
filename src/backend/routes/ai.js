import express from "express";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
dotenv.config();

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Officer pool per department
const OFFICERS = {
  "Roads & Infrastructure Dept": [
    { name: "Ramesh Kumar",  phone: "+91 9111222333" },
    { name: "Suresh Verma",  phone: "+91 9444555666" },
    { name: "Prakash Reddy", phone: "+91 9777888999" },
  ],
  "Water Supply & Sewerage Board": [
    { name: "Anil Sharma",   phone: "+91 9222333444" },
    { name: "Vijay Patel",   phone: "+91 9555666777" },
  ],
  "Sanitation & Waste Management Dept": [
    { name: "Govind Singh",  phone: "+91 9333444555" },
    { name: "Raju Nair",     phone: "+91 9666777888" },
  ],
  "GHMC Electrical Wing": [
    { name: "Suresh Babu",   phone: "+91 9222333445" },
    { name: "Kiran Kumar",   phone: "+91 9555666778" },
  ],
  "Parks & Horticulture Dept": [
    { name: "Mohan Das",     phone: "+91 9111222334" },
    { name: "Lakshmi Rao",   phone: "+91 9444555667" },
  ],
  "Public Health & Pest Control Dept": [
    { name: "Sanjay Gupta",  phone: "+91 9333444556" },
  ],
  "Traffic Police & Transport Dept": [
    { name: "Inspector Rao", phone: "+91 9777888000" },
    { name: "SI Reddy",      phone: "+91 9888999111" },
  ],
  "Town Planning & Enforcement Dept": [
    { name: "Prasad Kumar",  phone: "+91 9666777889" },
    { name: "Arjun Singh",   phone: "+91 9555666779" },
  ],
  "General Public Services Dept": [
    { name: "Venkat Rao",    phone: "+91 9999000111" },
  ],
};

/* ── AI Officer Assignment ── */
router.post("/assign-officer", async (req, res) => {
  try {
    const { title, description, category, area, priority, department } = req.body;

    const officers = OFFICERS[department] || OFFICERS["General Public Services Dept"];
    const officerList = officers.map((o, i) => `${i + 1}. ${o.name} (${o.phone})`).join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a civic complaint management AI for Hyderabad, India.

A citizen has filed the following complaint:
- Title: ${title}
- Category: ${category}
- Area: ${area}
- Priority: ${priority}
- Department: ${department}
- Description: ${description}

Available officers for this department:
${officerList}

Based on the complaint priority and area, select the best officer.

Respond ONLY in this exact JSON format, no extra text:
{
  "officerName": "exact name from the list above",
  "officerPhone": "exact phone from the list above",
  "reason": "one short sentence why this officer",
  "estimatedHours": 24
}`,
        },
      ],
    });

    const text = message.content[0].text;

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");

    const result = JSON.parse(jsonMatch[0]);

    // Validate officer is from our list — prevent hallucination
    const validOfficer = officers.find(o => o.name === result.officerName);
    if (!validOfficer) {
      result.officerName  = officers[0].name;
      result.officerPhone = officers[0].phone;
      result.reason       = "Assigned based on department availability";
    }

    console.log(`🤖 AI assigned: ${result.officerName} for complaint in ${area}`);

    res.json({
      success:        true,
      officer:        result.officerName,
      officerPhone:   result.officerPhone,
      reason:         result.reason,
      estimatedHours: result.estimatedHours,
    });

  } catch (err) {
    console.error("AI assignment error:", err.message);

    // Fallback — assign first available officer if AI fails
    const officers = OFFICERS[req.body.department] || OFFICERS["General Public Services Dept"];
    res.json({
      success:        true,
      officer:        officers[0].name,
      officerPhone:   officers[0].phone,
      reason:         "Assigned based on department",
      estimatedHours: 48,
    });
  }
});

export default router;
