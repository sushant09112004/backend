import mongoose from "mongoose";

const candidateSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    experience: Number,
    location: String,
    match_score: Number,
    matched_skills: [String],
    reason: String,
  },
  { _id: false }
);

const shortlistedCandidateSchema = new mongoose.Schema({
  hr: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HR",
    required: true,
  },
  candidate_id: {
    type: String,
    required: true,
  },
  shortlisted_at: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "shortlisted",
    enum: ["shortlisted", "interviewing", "offered", "rejected"],
  },
  notes: {
    type: String,
    default: "",
  },
  source_query: {
    type: String,
    default: "",
  },
  candidate_snapshot: candidateSnapshotSchema,
});

shortlistedCandidateSchema.index({ hr: 1, candidate_id: 1 }, { unique: true });

const ShortlistedCandidate = mongoose.model(
  "ShortlistedCandidate",
  shortlistedCandidateSchema,
  "shortlisted_candidates"
);

export default ShortlistedCandidate;
