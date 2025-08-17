#!/usr/bin/env node

/**
 * Cloudflare Deployment Test Script
 * Tests the build and deployment configuration
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Testing Cloudflare Deployment Configuration...\n');

// Check if required files exist
const requiredFiles = [
  'wrangler.toml',
  '.cloudflare/pages.toml',
  '.cloudflare/pages.json',
  'package.json'
];

console.log('📁 Checking required configuration files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    process.exit(1);
  }
});

// Check if wrangler is installed
try {
  const wranglerVersion = execSync('npx wrangler --version', { encoding: 'utf8' });
  console.log(`✅ Wrangler installed: ${wranglerVersion.trim()}`);
} catch (error) {
  console.log('❌ Wrangler not found. Run: npm install -D wrangler');
  process.exit(1);
}

// Test build
console.log('\n🔨 Testing build process...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful');
} catch (error) {
  console.log('❌ Build failed');
  process.exit(1);
}

// Check if .next directory exists
if (fs.existsSync('.next')) {
  console.log('✅ .next build directory created');
} else {
  console.log('❌ .next directory not found after build');
  process.exit(1);
}

console.log('\n🎉 All tests passed! Your Cloudflare deployment is ready.');
console.log('\n📋 Next steps:');
console.log('1. Run: npx wrangler login');
console.log('2. Create Cloudflare Pages project: "open-lovable"');
console.log('3. Set environment variables in Cloudflare dashboard');
console.log('4. Deploy: npm run deploy:cf');
console.log('\n🚀 For local testing: npm run deploy:cf:dev');
