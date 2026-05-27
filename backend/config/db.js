import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is missing in backend/.env');
  }

  const options = {
    serverSelectionTimeoutMS: 10000,
  };

  // Helps on some Windows networks where IPv6 DNS breaks Atlas SRV lookup
  if (uri.startsWith('mongodb+srv://')) {
    options.family = 4;
  }

  try {
    const conn = await mongoose.connect(uri, options);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (error.message?.includes('querySrv') || error.code === 'ECONNREFUSED') {
      console.error('\n--- MongoDB connection failed (DNS/network) ---');
      console.error('Your PC cannot resolve mongodb+srv (Atlas). Try ONE of these:\n');
      console.error('1) Use Docker local MongoDB:');
      console.error('   docker compose up -d');
      console.error('   MONGODB_URI=mongodb://127.0.0.1:27017/codefusion\n');
      console.error('2) In Atlas: Connect -> Drivers -> choose "Standard connection string"');
      console.error('   (mongodb://... not mongodb+srv://) and paste into MONGODB_URI\n');
      console.error('3) Atlas -> Network Access -> allow IP 0.0.0.0/0\n');
    }
    throw error;
  }
};

export default connectDB;
