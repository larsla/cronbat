#!/usr/bin/env python3
import os
import sqlite3
import sys
from app import db

def migrate_database():
    """
    Migrate the database to the latest schema
    """
    print("Starting database migration...")

    # Get database path from environment or use default
    db_path = os.environ.get('CRONBAT_DB_PATH', 'instance/cronbat.db')

    # Check if database exists
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}")
        print("No migration needed. The database will be created with the latest schema.")
        return

    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if job_dependencies table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='job_dependencies'")
        if not cursor.fetchone():
            print("Creating job_dependencies table...")
            cursor.execute("""
            CREATE TABLE job_dependencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                parent_job_id VARCHAR NOT NULL,
                child_job_id VARCHAR NOT NULL,
                FOREIGN KEY (parent_job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                FOREIGN KEY (child_job_id) REFERENCES jobs(id) ON DELETE CASCADE
            )
            """)
            print("job_dependencies table created successfully")

        # Check if trigger_type column exists in jobs table
        cursor.execute("PRAGMA table_info(jobs)")
        columns = [column[1] for column in cursor.fetchall()]

        if 'trigger_type' not in columns:
            print("Adding trigger_type column to jobs table...")
            cursor.execute("ALTER TABLE jobs ADD COLUMN trigger_type VARCHAR DEFAULT 'schedule'")
            print("trigger_type column added successfully")

        # Make schedule column nullable
        # SQLite doesn't support ALTER COLUMN, so we need to create a new table and copy the data
        if 'schedule' in columns:
            print("Making schedule column nullable...")

            # Create a new table with the updated schema
            cursor.execute("""
            CREATE TABLE jobs_new (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                command VARCHAR NOT NULL,
                schedule VARCHAR,
                description TEXT,
                created_at TIMESTAMP,
                last_run TIMESTAMP,
                is_paused BOOLEAN DEFAULT 0,
                trigger_type VARCHAR DEFAULT 'schedule'
            )
            """)

            # Copy data from the old table to the new table
            cursor.execute("""
            INSERT INTO jobs_new (id, name, command, schedule, description, created_at, last_run, is_paused, trigger_type)
            SELECT id, name, command, schedule, description, created_at, last_run, is_paused, trigger_type FROM jobs
            """)

            # Drop the old table
            cursor.execute("DROP TABLE jobs")

            # Rename the new table to the original name
            cursor.execute("ALTER TABLE jobs_new RENAME TO jobs")

            print("schedule column made nullable successfully")

        # Commit the changes
        conn.commit()
        print("Database migration completed successfully")

    except Exception as e:
        conn.rollback()
        print(f"Error during migration: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
