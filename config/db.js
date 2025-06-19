import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Remove deprecated options that are now defaults in Mongoose 6+
    });

    console.log(`
    ============================================================
    📦 MongoDB Connected Successfully
    ============================================================
    🔗 Host: ${conn.connection.host}
    🏷️  Database: ${conn.connection.name}
    📊 Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}
    ============================================================
    `);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('📦 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error(`
    ============================================================
    ❌ MongoDB Connection Failed
    ============================================================
    Error: ${error.message}
    ============================================================
    `);
    process.exit(1);
  }
};

export default connectDB; 