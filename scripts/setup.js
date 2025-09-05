#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Vid Essence Chat - Complete Installation\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js v18 or higher is required. Current version:', nodeVersion);
  console.log('Please install Node.js from: https://nodejs.org/');
  process.exit(1);
}

console.log('✅ Node.js version:', nodeVersion);

// Function to run command and handle errors
function runCommand(command, directory = process.cwd()) {
  try {
    console.log(`🔄 Running: ${command} in ${path.basename(directory)}`);
    execSync(command, { stdio: 'inherit', cwd: directory });
    return true;
  } catch (error) {
    console.error(`❌ Failed to run: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Install frontend dependencies
console.log('\n📦 Installing frontend dependencies...');
if (!runCommand('npm install')) {
  console.error('❌ Frontend dependency installation failed');
  process.exit(1);
}
console.log('✅ Frontend dependencies installed');

// Install backend dependencies
console.log('\n📦 Installing backend dependencies...');
const serverDir = path.join(__dirname, '..', 'server');
if (!runCommand('npm install', serverDir)) {
  console.error('❌ Backend dependency installation failed');
  process.exit(1);
}
console.log('✅ Backend dependencies installed');

// Setup environment files
console.log('\n🔧 Setting up environment files...');

// Frontend .env
const frontendEnvPath = path.join(__dirname, '..', '.env');
const frontendEnvExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(frontendEnvPath) && fs.existsSync(frontendEnvExamplePath)) {
  fs.copyFileSync(frontendEnvExamplePath, frontendEnvPath);
  console.log('✅ Created frontend .env file');
}

// Backend .env
const backendEnvPath = path.join(serverDir, '.env');
const backendEnvExamplePath = path.join(serverDir, '.env.example');

if (!fs.existsSync(backendEnvPath) && fs.existsSync(backendEnvExamplePath)) {
  fs.copyFileSync(backendEnvExamplePath, backendEnvPath);
  console.log('✅ Created backend .env file');
}

// Create backend logs directory
const logsDir = path.join(serverDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory');
}

// Check environment configuration
console.log('\n🔍 Checking environment configuration...');

let configurationNeeded = false;

if (fs.existsSync(backendEnvPath)) {
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  const requiredVars = [
    { name: 'MONGODB_URI', description: 'MongoDB Atlas connection string' },
    { name: 'OPENROUTER_API_KEY', description: 'OpenRouter API key for GPT-4o-mini' }
  ];

  const missingVars = requiredVars.filter(variable => 
    !envContent.includes(`${variable.name}=`) || 
    envContent.includes(`${variable.name}=your-`) ||
    envContent.includes(`${variable.name}=mongodb+srv://your-username`)
  );

  if (missingVars.length > 0) {
    configurationNeeded = true;
    console.log('\n⚠️  Environment Configuration Required:');
    console.log('Please update the following in server/.env:');
    missingVars.forEach(variable => {
      console.log(`   - ${variable.name}: ${variable.description}`);
    });
  } else {
    console.log('✅ Backend environment variables configured');
  }
}

// Display setup completion message
console.log('\n🎉 Installation Complete!');
console.log('\n' + '='.repeat(60));

if (configurationNeeded) {
  console.log('⚠️  CONFIGURATION REQUIRED:');
  console.log('');
  console.log('1. Get MongoDB Atlas connection string:');
  console.log('   • Sign up at: https://www.mongodb.com/atlas');
  console.log('   • Create a free cluster');
  console.log('   • Get connection string and update MONGODB_URI in server/.env');
  console.log('');
  console.log('2. Get OpenRouter API key:');
  console.log('   • Sign up at: https://openrouter.ai/');
  console.log('   • Get API key and update OPENROUTER_API_KEY in server/.env');
  console.log('');
  console.log('📖 For detailed setup instructions, see SETUP.md');
  console.log('');
}

console.log('🚀 To start the application:');
console.log('');
console.log('Terminal 1 (Backend):');
console.log('   cd server');
console.log('   npm run dev');
console.log('');
console.log('Terminal 2 (Frontend):');
console.log('   npm run dev');
console.log('');
console.log('Then visit: http://localhost:5173');
console.log('API Health: http://localhost:5000/health');
console.log('');
console.log('='.repeat(60));

if (configurationNeeded) {
  console.log('\n⚠️  Remember to configure your environment variables before starting!');
}