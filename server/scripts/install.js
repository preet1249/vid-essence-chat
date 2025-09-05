#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Vid Essence Chat Backend...\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js v18 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version:', nodeVersion);

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Copy .env.example to .env if .env doesn't exist
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
    console.log('⚠️  Please edit .env file with your MongoDB URI and OpenRouter API key');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
  }
}

// Check if .env file has required variables
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['MONGODB_URI', 'OPENROUTER_API_KEY'];
  const missingVars = [];

  requiredVars.forEach(varName => {
    if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your-`)) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log('\n⚠️  Environment Setup Required:');
    console.log('Please update the following variables in your .env file:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\nSee SETUP.md for detailed instructions.');
  } else {
    console.log('✅ Environment variables configured');
  }
}

// Create logs directory
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory');
}

console.log('\n🎉 Backend setup complete!');
console.log('\nNext steps:');
console.log('1. Update your .env file with MongoDB URI and OpenRouter API key');
console.log('2. Run: npm run dev');
console.log('3. Visit: http://localhost:5000/health to verify the server is running');
console.log('\nFor detailed setup instructions, see SETUP.md');