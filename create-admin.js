const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const MONGODB_URI = envVars.MONGODB_URI || 'mongodb://localhost:27017/student-management';
const ADMIN_USERNAME = envVars.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = envVars.ADMIN_PASSWORD || 'admin123';

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ username: ADMIN_USERNAME });
    
    if (existingAdmin) {
      console.log('ℹ Admin already exists');
      console.log(`Username: ${ADMIN_USERNAME}`);
      process.exit(0);
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin
    console.log('Creating admin...');
    await Admin.create({
      username: ADMIN_USERNAME,
      password: hashedPassword,
      createdAt: new Date()
    });

    console.log('✓ Admin created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log(`  Username: ${ADMIN_USERNAME}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log('');
    console.log('You can now login at: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

createAdmin();
