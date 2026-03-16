import express from "express";
import cors from "cors";
import "./db.js";
import complaintRoutes from "./routes/complaints.js";
import otpRoutes from "./routes/otp.js";
import aiRoutes from "./routes/ai.js";
import notifyRoutes from "./routes/notify.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/complaints", complaintRoutes);
app.use("/otp", otpRoutes);
app.use("/ai", aiRoutes);
app.use("/notify", notifyRoutes);

const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("CivicPulse API is running 🚀");
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
