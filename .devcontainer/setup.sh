#!/bin/bash
set -e

echo "Setting up CronBat development environment..."

# Copy example .env files if they don't exist
echo "Setting up environment variables..."
if [ ! -f /workspace/backend/.env ]; then
  cp /workspace/backend/.env.example /workspace/backend/.env
  echo "Created backend/.env from example file"
fi

if [ ! -f /workspace/frontend/.env ]; then
  cp /workspace/frontend/.env.example /workspace/frontend/.env
  echo "Created frontend/.env from example file"
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd /workspace/backend
pip install -r requirements.txt

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd /workspace/frontend
npm install

echo "Setup complete! You can now run the following commands:"
echo "- Run both servers: .devcontainer/start-dev.sh"
echo "- Or run them separately:"
echo "  - Backend: cd /workspace/backend && python run.py"
echo "  - Frontend: cd /workspace/frontend && npm start"
