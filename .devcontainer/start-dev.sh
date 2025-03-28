#!/bin/bash
set -e

echo "Starting CronBat development servers..."

# Start the backend server in the background
echo "Starting backend server..."
cd /workspace/backend
python run.py &
BACKEND_PID=$!

# Start the frontend server in the background
echo "Starting frontend server..."
cd /workspace/frontend
npm start &
FRONTEND_PID=$!

# Function to handle cleanup on exit
cleanup() {
  echo "Shutting down servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Set up trap to catch SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "Both servers are running!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both servers."

# Wait for both processes to finish
wait $BACKEND_PID $FRONTEND_PID
