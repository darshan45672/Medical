const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, 'public/icons/app-icon.svg');
const outputDir = path.join(__dirname, 'public/icons');

async function generateIcons() {
  try {
    console.log('Generating PWA icons...');
    
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated: icon-${size}x${size}.png`);
    }
    
    // Generate apple touch icon
    await sharp(inputSvg)
      .resize(180, 180)
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    
    console.log('Generated: apple-touch-icon.png');
    
    // Generate favicon
    await sharp(inputSvg)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, 'public/favicon-32x32.png'));
    
    await sharp(inputSvg)
      .resize(16, 16)
      .png()
      .toFile(path.join(__dirname, 'public/favicon-16x16.png'));
    
    console.log('Generated favicons');
    console.log('All icons generated successfully!');
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

if (require.main === module) {
  generateIcons();
}

module.exports = generateIcons;
