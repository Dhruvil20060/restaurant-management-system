import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    console.log("🔥 USING DB:", mongoURI); // IMPORTANT

    await mongoose.connect(mongoURI, {
  dbName: "restaurant-management"
});

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
export default connectDB;