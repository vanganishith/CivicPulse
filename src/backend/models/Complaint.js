import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: String,
  phone: String,
  email: String,
  title: String,
  category: String,
  department: String,
  area: String,
  landmark: String,
  description: String,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'], default: 'Pending' },
  officer: { type: String, default: '' },
  officerPhone: { type: String, default: '' },
  lat: String,
  lng: String,
  photos: [String],
  date: { type: Date, default: Date.now },
  resolvedDate: { type: Date, default: null },
  updates: [
    {
      status: String,
      time: Date,
      note: String,
      done: Boolean,
      active: Boolean,
      rejected: Boolean
    }
  ]
});

export default mongoose.model("Complaint", complaintSchema);
