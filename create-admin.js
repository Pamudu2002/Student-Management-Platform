const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envFile.split(/\r?\n/).forEach(line => {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine.startsWith('#')) return;
  
  const separatorIndex = trimmedLine.indexOf('=');
  if (separatorIndex !== -1) {
    const key = trimmedLine.substring(0, separatorIndex).trim();
    const value = trimmedLine.substring(separatorIndex + 1).trim().replace(/^["'](.*)["']$/, '$1');
    envVars[key] = value;
  }
});

console.log('Loaded Environment Variables:', Object.keys(envVars));

const MONGODB_URI = envVars.MONGODB_URI;
const ADMIN_USERNAME = envVars.ADMIN_USERNAME;
const ADMIN_PASSWORD = envVars.ADMIN_PASSWORD;

if (!MONGODB_URI) {
  console.error('✗ Error: MONGODB_URI is missing from .env.local');
  process.exit(1);
}

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
