import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const hrSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  company: {
    type: String,
    required: [true, "Company is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  role: {
    type: String,
    default: "hr",
    enum: ["hr"],
  },
  status: {
    type: String,
    default: "Active",
    enum: ["Active", "Inactive"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

hrSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

hrSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const HR = mongoose.model("HR", hrSchema);

export default HR;
