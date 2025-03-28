from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
import os

socketio = SocketIO()

# Import database
from app.database import Database
db = Database()

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        DB_PATH=os.environ.get('CRONBAT_DB_PATH', os.path.join(app.instance_path, 'cronbat.db')),
        LOGS_PATH=os.environ.get('CRONBAT_LOGS_PATH', os.path.join(app.instance_path, 'logs')),
    )

    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Enable CORS
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register blueprints
    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    # Initialize Socket.IO
    socketio.init_app(app, cors_allowed_origins="*")

    # Initialize database with configured paths
    global db
    db = Database(
        db_path=app.config['DB_PATH'],
        logs_path=app.config['LOGS_PATH']
    )

    return app
