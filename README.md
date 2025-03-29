# CronBat

CronBat is a web application for scheduling, running, and monitoring tasks. It provides a user-friendly interface to manage scheduled tasks, view their execution state in real-time, and stream logs.

> **Note:** This project was built with [Cline](https://github.com/saoudrizwan/cline) and Claude-3.7-sonnet as an experiment in AI-assisted development.

## Features

- Create and manage scheduled tasks with cron expressions
- Real-time updates of task execution state
- Live streaming of task logs
- Manual triggering of tasks
- Responsive UI built with React and Tailwind CSS
- Dark mode support with persistent user preference
- Job dependencies - trigger jobs based on successful completion of other jobs
- Visual workflow representation showing job dependencies
- Automatic cleanup of old execution logs with configurable retention

## Architecture

- **Backend**: Python with Flask, Flask-SocketIO for real-time updates
- **Frontend**: React with Tailwind CSS
- **Communication**: REST API and WebSockets

## Development Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

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

### Frontend Setup

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

This will pull the latest Docker images from GitHub Container Registry and start both the frontend and backend services. The application will be available at http://localhost.

### Using a Specific Version

By default, the `latest` tag is used for the Docker images. To use a specific version:

1. Edit the `.env` file and change `CRONBAT_VERSION` to the desired version (e.g., `CRONBAT_VERSION=1.0.0`)
2. Run `docker-compose up -d`

### Building Images Locally

If you prefer to build the images locally instead of using the pre-built ones:

```
docker-compose -f docker-compose.dev.yml up -d
```

### GitHub Container Registry

Docker images are automatically built and published to GitHub Container Registry (ghcr.io) when a new release is created. The images are tagged with both the release version and `latest`.

- Backend image: `ghcr.io/larsla/cronbat-backend`
- Frontend image: `ghcr.io/larsla/cronbat-frontend`

## Environment Variables

### Backend

- `SECRET_KEY`: Secret key for Flask sessions
- `FLASK_DEBUG`: Enable debug mode (set to "true" for development)
- `HOST`: Host to bind the server to
- `PORT`: Port to run the server on
- `CRONBAT_MAX_EXECUTIONS`: Maximum number of execution records to keep per job (default: 20)

### Frontend

- `REACT_APP_API_URL`: URL of the backend API
- `REACT_APP_SOCKET_URL`: URL for WebSocket connection

## Dependency Management

This project uses GitHub's Dependabot to automatically keep dependencies up-to-date:

- Minor and patch updates are automatically merged
- Major version updates create pull requests for review
- Dependencies are checked weekly
- Updates are grouped to minimize disruption

## License

MIT
