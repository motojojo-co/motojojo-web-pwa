#!/usr/bin/env node

/**
 * Script to help update media logo files
 * 
 * Usage:
 * 1. Place your logo images in the public/media-logos/ directory
 * 2. Run: node update-logos.js
 * 3. The script will validate the files and provide feedback
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logosDir = path.join(__dirname, 'public', 'media-logos');
const expectedLogos = [
  'radio-and-music.png',
  'lbb.png', 
  'times-of-india.png',
  'dainik-bhaskar.png',
  'mumbai-mirror.png',
  'indian-express.png',
  'rolling-stone.png',
  'the-hindu.png'
];

console.log('🎨 MotoJojo Media Logos Validator\n');

// Check if logos directory exists
if (!fs.existsSync(logosDir)) {
  console.error('❌ Media logos directory not found!');
  process.exit(1);
}

let allPresent = true;

console.log('Checking logo files...\n');

expectedLogos.forEach(logoFile => {
  const filePath = path.join(logosDir, logoFile);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    
    // Check if it's a placeholder file (very small size)
    if (stats.size < 1000) {
      console.log(`⚠️  ${logoFile} - Placeholder file detected (${stats.size} bytes)`);
      allPresent = false;
    } else {
      console.log(`✅ ${logoFile} - Present (${(stats.size / 1024).toFixed(1)} KB)`);
    }
  } else {
    console.log(`❌ ${logoFile} - Missing`);
    allPresent = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPresent) {
  console.log('🎉 All logo files are ready!');
  console.log('The MediaLogosSection should display properly on your landing page.');
} else {
  console.log('📝 Action needed:');
  console.log('1. Replace placeholder files with actual logo images');
  console.log('2. Ensure logos are PNG format with transparent backgrounds');
  console.log('3. Recommended size: 200x80 pixels or similar aspect ratio');
  console.log('4. Run this script again to validate');
}

console.log('\n💡 Tip: The logos will appear in grayscale and become colored on hover');
console.log('   Make sure your logos work well in both grayscale and color modes.');
