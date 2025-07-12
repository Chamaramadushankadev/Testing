#!/bin/bash

cd ~/Productivityapp

git clone https://github.com/Chamaramadushankadev/Productivityapp.git

echo "🔁 Pulling latest code..."
git fetch --all
git reset --hard origin/main

echo "🛠 Restarting backend..."
pm2 stop ProductivityApp
pm2 delete ProductivityApp
cd server
npm install
pm2 start index.js --name ProductivityApp
cd ..

echo "📦 Rebuilding frontend..."
npm install
npm run build

echo "🚀 Restarting frontend..."
pm2 stop frontend
pm2 delete frontend
pm2 start "serve -s dist" --name frontend

pm2 save
echo "✅ Deployment finished!"
