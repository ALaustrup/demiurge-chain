#!/usr/bin/env node
// Copy static assets (manifest, icons) to dist/ after Vite build

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

// Copy manifest.json
fs.copyFileSync(
  path.join(root, 'manifest.json'),
  path.join(dist, 'manifest.json')
);
console.log('Copied manifest.json');

// Copy icons
const iconsDir = path.join(dist, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const srcIcons = path.join(root, 'icons');
if (fs.existsSync(srcIcons)) {
  for (const file of fs.readdirSync(srcIcons)) {
    fs.copyFileSync(
      path.join(srcIcons, file),
      path.join(iconsDir, file)
    );
    console.log(`Copied icons/${file}`);
  }
}

console.log('Static assets copied to dist/');
