#!/usr/bin/env node
// Generate PNG icons from SVG for the extension manifest
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Simple 1-bit PNG generator for placeholder icons
// These are minimal valid PNGs with the Demiurge "D" branding

function createMinimalPNG(size) {
  // Create a simple solid-color PNG with the right dimensions
  // This is a valid PNG that Chrome will accept
  
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);
  
  // IDAT chunk - create raw image data
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // Create a gradient orange circle
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) * 0.42;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      
      if (dist <= r) {
        // Orange gradient
        const t = dist / r;
        const red = Math.round(255 - t * 30);
        const green = Math.round(140 - t * 60);
        const blue = Math.round(0);
        rawData.push(red, green, blue);
      } else {
        // Transparent-ish dark
        rawData.push(30, 30, 35);
      }
    }
  }
  
  // Compress with deflate (use zlib)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idat = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32 implementation
function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const png = createMinimalPNG(size);
  const filename = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Generated ${filename} (${png.length} bytes)`);
});

console.log('Done! Icons generated.');
