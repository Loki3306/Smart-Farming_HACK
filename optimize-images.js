/**
 * Image Optimization Script
 * Compresses PNG images to WebP format for better performance
 * 
 * Usage: node optimize-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGE_DIR = path.join(__dirname, 'client', 'assets', 'farm-time-images');
const QUALITY = 80; // WebP quality (0-100)
const TARGET_MAX_SIZE_KB = 150; // Target max file size in KB

async function optimizeImage(filePath) {
  const fileName = path.basename(filePath);
  const nameWithoutExt = path.parse(fileName).name;
  const webpPath = path.join(IMAGE_DIR, `${nameWithoutExt}.webp`);
  
  try {
    const originalStats = fs.statSync(filePath);
    const originalSizeKB = Math.round(originalStats.size / 1024);
    
    console.log(`\n🖼️  Processing: ${fileName} (${originalSizeKB} KB)`);
    
    // Convert to WebP
    await sharp(filePath)
      .webp({ quality: QUALITY })
      .toFile(webpPath);
    
    const newStats = fs.statSync(webpPath);
    const newSizeKB = Math.round(newStats.size / 1024);
    const savings = Math.round(((originalSizeKB - newSizeKB) / originalSizeKB) * 100);
    
    console.log(`✅ Created: ${nameWithoutExt}.webp (${newSizeKB} KB)`);
    console.log(`   💾 Saved: ${originalSizeKB - newSizeKB} KB (${savings}% reduction)`);
    
    return {
      original: fileName,
      optimized: `${nameWithoutExt}.webp`,
      originalSize: originalSizeKB,
      newSize: newSizeKB,
      savings: savings
    };
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Smart Farming - Image Optimization Tool\n');
  console.log(`📁 Target directory: ${IMAGE_DIR}\n`);
  
  if (!fs.existsSync(IMAGE_DIR)) {
    console.error(`❌ Directory not found: ${IMAGE_DIR}`);
    process.exit(1);
  }
  
  // Get all PNG files
  const files = fs.readdirSync(IMAGE_DIR)
    .filter(file => file.toLowerCase().endsWith('.png'))
    .map(file => path.join(IMAGE_DIR, file));
  
  if (files.length === 0) {
    console.log('ℹ️  No PNG files found to optimize.');
    return;
  }
  
  console.log(`Found ${files.length} PNG file(s) to optimize:\n`);
  
  const results = [];
  for (const file of files) {
    const result = await optimizeImage(file);
    if (result) results.push(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('='.repeat(60));
  
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalNew = results.reduce((sum, r) => sum + r.newSize, 0);
  const totalSavings = totalOriginal - totalNew;
  const percentSavings = Math.round((totalSavings / totalOriginal) * 100);
  
  console.log(`\n✅ Optimized: ${results.length} image(s)`);
  console.log(`📉 Total size reduction: ${totalSavings} KB (${percentSavings}%)`);
  console.log(`   Before: ${totalOriginal} KB`);
  console.log(`   After:  ${totalNew} KB`);
  
  console.log('\n💡 Next steps:');
  console.log('   1. Update your code to use .webp files instead of .png');
  console.log('   2. Add <picture> tag with fallback for older browsers');
  console.log('   3. You can safely delete the old .png files after testing\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
