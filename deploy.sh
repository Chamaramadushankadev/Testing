#!/bin/bash

set -e
cd ~/Productivityapp || exit 1

echo "🔁 Pulling latest code..."
git fetch --all
git reset --hard origin/main

echo "📦 Installing dependencies..."
cd server && npm install --legacy-peer-deps && cd ..
cd client && npm install --legacy-peer-deps && cd ..

echo "🧼 Killing port 5173 if busy..."
fuser -k 5173/tcp || true

echo "🚀 Restarting backend..."
pm2 delete ProductivityApp || true
cd server && pm2 start "npm run dev" --name ProductivityApp && cd ..

echo "🚀 Restarting frontend..."
pm2 delete frontend || true
cd client && pm2 start "npm run dev" --name frontend && cd ..

echo "💾 Saving PM2 process list..."
pm2 save

echo "⚙️ Enabling PM2 on boot..."
pm2 startup systemd -u $USER --hp $HOME

echo "✅ Deployment finished!"
