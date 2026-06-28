import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = process.env.SMTP_PORT || "587";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com";
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "ResumeMe";
const SMTP_SECURE = (process.env.SMTP_SECURE || "false") === "true";

export const sendEmail = async (req, res) => {
  try {
    const { to, subject, body } = req.body || {};

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return res.status(400).json({ success: false, message: "`to` is required" });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: "`subject` is required" });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: "`body` is required" });
    }

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return res.status(500).json({ success: false, message: "SMTP not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS in .env" });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const from = SMTP_FROM_NAME ? `${SMTP_FROM_NAME} <${SMTP_FROM}>` : SMTP_FROM;

    const toField = Array.isArray(to) ? to.join(",") : String(to);

    const info = await transporter.sendMail({
      from,
      to: toField,
      subject,
      text: body,
    });

    return res.status(200).json({ success: true, message: "Sent", info: { messageId: info.messageId } });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({ success: false, message: "Failed to send email", error: error?.message || String(error) });
  }
};
