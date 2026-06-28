import ShortlistedCandidate from "../model/shortlistedCandidate.js";

export const getShortlisted = async (req, res) => {
  try {
    const items = await ShortlistedCandidate.find({ hr: req.hr._id }).sort({
      shortlisted_at: -1,
    });
    return res.json({ success: true, data: items });
  } catch (error) {
    console.error("Get shortlisted error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getShortlistedIds = async (req, res) => {
  try {
    const items = await ShortlistedCandidate.find({ hr: req.hr._id }).select(
      "candidate_id"
    );
    return res.json({
      success: true,
      data: items.map((item) => item.candidate_id),
    });
  } catch (error) {
    console.error("Get shortlisted ids error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addToShortlist = async (req, res) => {
  try {
    const { candidate_id, source_query, candidate_snapshot } = req.body;

    if (!candidate_id) {
      return res.status(400).json({ message: "candidate_id is required" });
    }

    const existing = await ShortlistedCandidate.findOne({
      hr: req.hr._id,
      candidate_id,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Candidate already shortlisted",
        data: existing,
      });
    }

    const item = await ShortlistedCandidate.create({
      hr: req.hr._id,
      candidate_id,
      source_query: source_query || "",
      candidate_snapshot: candidate_snapshot || {},
    });

    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error("Add to shortlist error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateShortlistNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const item = await ShortlistedCandidate.findOneAndUpdate(
      { _id: id, hr: req.hr._id },
      { notes: notes ?? "" },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Shortlisted candidate not found" });
    }

    return res.json({ success: true, data: item });
  } catch (error) {
    console.error("Update shortlist notes error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromShortlist = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await ShortlistedCandidate.findOneAndDelete({
      _id: id,
      hr: req.hr._id,
    });

    if (!item) {
      return res.status(404).json({ message: "Shortlisted candidate not found" });
    }

    return res.json({ success: true, message: "Removed from shortlist" });
  } catch (error) {
    console.error("Remove from shortlist error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
