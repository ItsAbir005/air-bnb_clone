// test-connection.js
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...');
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('- MONGO_URI format:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'not found');

const testConnection = async () => {
  try {
    console.log('\n⏱️  Attempting connection with 30 second timeout...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    
    console.log('✅ SUCCESS: Connected to MongoDB!');
    
    // Test a simple query
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.ping();
    console.log('✅ Database ping successful:', result);
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed gracefully');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED:');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    // Specific troubleshooting
    if (error.message.includes('ETIMEOUT') || error.message.includes('timeout')) {
      console.log('\n🔧 TIMEOUT ISSUE - Try these solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Change DNS to 8.8.8.8 and 8.8.4.4');
      console.log('3. Disable VPN if using one');
      console.log('4. Check Windows Firewall/Antivirus');
      console.log('5. Try mobile hotspot to test network');
    }
    
    if (error.message.includes('authentication') || error.message.includes('auth')) {
      console.log('\n🔧 AUTHENTICATION ISSUE:');
      console.log('1. Check username and password in connection string');
      console.log('2. Verify database user exists in MongoDB Atlas');
      console.log('3. Check user permissions');
    }
    
    if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 NETWORK ISSUE:');
      console.log('1. Check if cluster is running (not paused)');
      console.log('2. Verify network access in MongoDB Atlas');
      console.log('3. Add 0.0.0.0/0 to IP whitelist for testing');
    }
    
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Test interrupted');
  try {
    await mongoose.connection.close();
  } catch (e) {
    // Ignore error during cleanup
  }
  process.exit(0);
});

testConnection();