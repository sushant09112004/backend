import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandlers.js";
import connectDB from "./config/db.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Check for required environment variables
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  WARNING: GEMINI_API_KEY is not set in environment variables!");
  console.warn("   Resume processing will fail without a valid API key.");
  console.warn("   Please create a .env file with: GEMINI_API_KEY=your_api_key_here");
} else {
  console.log("✅ GEMINI_API_KEY is configured");
  // Mask the API key for security (show only first and last few characters)
  const maskedKey = process.env.GEMINI_API_KEY.substring(0, 10) + "..." + process.env.GEMINI_API_KEY.slice(-4);
  console.log(`   API Key: ${maskedKey}`);
}

// Connect to MongoDB
connectDB();
const allowedOrigins = [
  "https://resumesync.in",
  "https://www.resumesync.in",
  "https://backend-re9w.onrender.com"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow Postman / server-to-server calls
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  optionsSuccessStatus: 200,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api", routes);
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
export default app;
