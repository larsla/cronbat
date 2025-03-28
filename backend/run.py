import os
from dotenv import load_dotenv
from app import create_app, socketio
import migrate_db

# Load environment variables from .env file
load_dotenv()

# Run database migrations
migrate_db.migrate_database()

app = create_app()

if __name__ == '__main__':
    # Use eventlet for WebSocket support
    socketio.run(
        app,
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 5000)),
        debug=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true',
        use_reloader=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    )
