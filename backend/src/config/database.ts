import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in the environment file.");
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("MongoDB Atlas connected successfully.");

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected.");
    });

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
    });
  } catch (error) {
    console.error("Initial MongoDB connection failed:", error);
    throw error;
  }
}