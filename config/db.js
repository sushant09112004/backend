// MongoDB connection (optional - can be added later if needed)
const connectDB = async () => {
  try {
    // Uncomment and configure when MongoDB is needed
    // const mongoose = await import('mongoose');
    // await mongoose.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-editor');
    // console.log('MongoDB connected');
    console.log('Database connection skipped (not configured)');
  } catch (error) {
    console.error('Database connection error:', error.message);
    // Don't exit process - app can work without DB for now
  }
};

export default connectDB;
