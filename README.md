# CronBat

CronBat is a web application for scheduling, running, and monitoring tasks. It provides a user-friendly interface to manage scheduled tasks, view their execution state in real-time, and stream logs.

## Features

- Create and manage scheduled tasks with cron expressions
- Real-time updates of task execution state
- Live streaming of task logs
- Manual triggering of tasks
- Responsive UI built with React and Tailwind CSS

## Architecture

- **Backend**: Python with Flask, Flask-SocketIO for real-time updates
- **Frontend**: React with Tailwind CSS
- **Communication**: REST API and WebSockets

## Development Setup

### Using Dev Container (Recommended)

This project includes a devcontainer configuration for Visual Studio Code, which provides a consistent development environment with all the necessary tools pre-installed.

#### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [Docker](https://www.docker.com/products/docker-desktop)
- [VS Code Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

#### Steps

1. Clone the repository
2. Open the project in VS Code
3. When prompted, click "Reopen in Container" or run the "Remote-Containers: Reopen in Container" command from the command palette
4. VS Code will build the development container and open the project inside it
5. Once the container is ready, you can:
   - Run both servers at once: `.devcontainer/start-dev.sh`
   - Or run them separately:
     - Backend: `cd backend && python run.py`
     - Frontend: `cd frontend && npm start`

Both servers will start with hot-reload enabled, and the ports will be forwarded to your local machine (backend on port 5000, frontend on port 3000).

### Manual Setup

If you prefer not to use the devcontainer, you can set up the project manually:

#### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

#### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the development server:
   ```
   python run.py
   ```

   The backend server will start at http://localhost:5000 with hot-reload enabled.

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm start
   ```

   The frontend development server will start at http://localhost:3000 with hot-reload enabled.

## Production Deployment

The application can be deployed using Docker and Docker Compose:

```
docker-compose up -d
```

This will build and start both the frontend and backend services. The application will be available at http://localhost.

## Environment Variables

### Backend

- `SECRET_KEY`: Secret key for Flask sessions
- `FLASK_DEBUG`: Enable debug mode (set to "true" for development)
- `HOST`: Host to bind the server to
- `PORT`: Port to run the server on

### Frontend

- `REACT_APP_API_URL`: URL of the backend API
- `REACT_APP_SOCKET_URL`: URL for WebSocket connection

## License

MIT
