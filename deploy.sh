#!/bin/bash

cd ~/Productivityapp || exit 1

echo "🔁 Pulling latest code..."
git fetch --all
git reset --hard origin/main

echo "🛠 Restarting backend (dev mode)..."
pm2 delete ProductivityApp || true
cd server || exit 1
npm install --legacy-peer-deps
pm2 start "npm run dev" --name ProductivityApp
cd ..

echo "🚀 Restarting frontend (dev mode)..."
pm2 delete frontend || true
pm2 start "npm run dev" --name frontend

echo "💾 Saving PM2 process list..."
pm2 save

echo "⚙️ Ensuring PM2 starts on boot..."
pm2 startup systemd -u $USER --hp $HOME

echo "✅ Deployment finished!"
