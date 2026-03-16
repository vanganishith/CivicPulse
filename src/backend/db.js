import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/NOVAS_Hackathon")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));
