import mongoose from "mongoose";
import dns from "dns";

// Use public DNS servers for MongoDB Atlas SRV resolution on environments
// where the default Node resolver can fail with ECONNREFUSED.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.error("The server will stay running but DB operations will fail until MongoDB is reachable.");
  }
};

export default connectDB;
