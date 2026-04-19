#!/usr/bin/env bash
# Exit on error
set -e

echo "▶ Installing Node.js via NVM..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 18
nvm use 18

echo "▶ Building Frontend React application..."
cd frontend
npm install
npm run build
cd ..

echo "▶ Installing Python backend dependencies..."
pip install -r backend/requirements.txt

echo "▶ Build complete! App is ready."
