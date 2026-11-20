/**
 * src/config/db.js
 * Establishes and manages the MongoDB connection via Mongoose.
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are now defaults in Mongoose 8.x but kept for clarity
      serverSelectionTimeoutMS: 5000, // timeout after 5 s if no server found
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

// Mongoose connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️   MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄  MongoDB reconnected');
});

module.exports = connectDB;
