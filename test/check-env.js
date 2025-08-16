// Environment Check Script
// This script checks if our environment variables are loaded correctly

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Environment Variables Check');
console.log('==============================');
console.log('');

// Check critical environment variables
const requiredVars = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GROQ_API_KEY'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Show first 8 characters and last 4 characters for security
    const maskedValue = value.length > 12 
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : '***';
    console.log(`✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allGood = false;
  }
});

console.log('');
console.log('📁 Current working directory:', process.cwd());
console.log('📁 Script directory:', __dirname);
console.log('📁 Project root:', join(__dirname, '..'));

// Check if .env file exists
import { existsSync } from 'fs';
const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  console.log('✅ .env file found at:', envPath);
} else {
  console.log('❌ .env file not found at:', envPath);
}

console.log('');
if (allGood) {
  console.log('🎉 All required environment variables are set!');
} else {
  console.log('⚠️  Some environment variables are missing. Please check your .env file.');
}

console.log('');
console.log('🔧 To run the GPT-5 timeout test:');
console.log('   npm run test:gpt5');
console.log('');
console.log('🔧 Or run directly:');
console.log('   node test/gpt5-timeout-test.js');
