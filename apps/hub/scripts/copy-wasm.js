/**
 * Copy WASM wallet files to public directory for Next.js to serve
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../../../packages/wallet-wasm/pkg');
const destDir = path.join(__dirname, '../public/pkg');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Files to copy
const filesToCopy = [
  'wallet_wasm_bg.wasm',
  'wallet_wasm.js',
  'wallet_wasm.d.ts',
  'wallet_wasm_bg.wasm.d.ts',
];

console.log('Copying WASM wallet files...');

filesToCopy.forEach((file) => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied ${file}`);
  } else {
    console.warn(`⚠ File not found: ${sourcePath}`);
  }
});

console.log('WASM files copied successfully!');
