#!/bin/bash

set -e
cd ~/NexaProDev || exit 1

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




#############Production

#!/bin/bash

set -e
cd ~/NexaProDev || exit 1

echo "🔁 Pulling latest code..."
git fetch --all
git reset --hard origin/main

echo "📦 Installing backend dependencies..."
cd server && npm install --legacy-peer-deps && cd ..

echo "📦 Installing frontend dependencies..."
cd client && npm install --legacy-peer-deps

echo "🛠️ Building frontend..."
npm run build
cd ..

echo "🧼 Stopping old PM2 processes..."
pm2 delete ProductivityApp || true

echo "🚀 Starting backend in production mode..."
cd server && pm2 start "npm run start" --name ProductivityApp && cd ..

echo "💾 Saving PM2 process list..."
pm2 save

echo "⚙️ Enabling PM2 on boot..."
pm2 startup systemd -u $USER --hp $HOME

echo "✅ Deployment finished! Serving frontend via NGINX and backend via PM2"
