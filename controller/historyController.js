import History from "../model/history.js";

export const createHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    const {
      personalInfo,
      summary,
      experience,
      education,
      skills,
      projects,
      certifications,
      languages,
      originalText,
    } = req.body || {};

    if (
      !personalInfo &&
      !summary &&
      (!experience || !experience.length) &&
      (!education || !education.length) &&
      (!skills || !skills.length) &&
      (!projects || !projects.length)
    ) {
      return res.status(400).json({
        success: false,
        message: "Resume data is required",
      });
    }

    const history = await History.create({
      user: userId,
      personalInfo: personalInfo || {},
      summary: summary || "",
      experience: experience || [],
      education: education || [],
      skills: skills || [],
      projects: projects || [],
      certifications: certifications || [],
      languages: languages || [],
      originalText: originalText || "",
    });

    return res.status(201).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error creating history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create history entry",
      error: error.message,
    });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    const history = await History.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch history",
      error: error.message,
    });
  }
};

