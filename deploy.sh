#!/bin/bash

cd ~/Productivityapp || exit 1

echo "🔁 Pulling latest code..."
git fetch --all
git reset --hard origin/main

echo "🛠 Restarting backend..."
pm2 delete ProductivityApp || true
cd server || exit 1
npm install --legacy-peer-deps
pm2 start index.js --name ProductivityApp
cd ..

echo "📦 Rebuilding frontend..."
rm -rf dist
npm install --legacy-peer-deps
npm run build

echo "🚀 Restarting frontend..."
pm2 delete frontend || true
pm2 start npx --name frontend --interpreter none -- serve -s dist

echo "💾 Saving PM2 process list..."
pm2 save

echo "⚙️ Ensuring PM2 starts on boot..."
pm2 startup --silent

echo "✅ Deployment finished!"
