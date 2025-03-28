import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

Base = declarative_base()

class Job(Base):
    __tablename__ = 'jobs'

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    command = Column(String, nullable=False)
    schedule = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    last_run = Column(DateTime, nullable=True)
    is_paused = Column(Boolean, default=False)

    executions = relationship("Execution", back_populates="job", cascade="all, delete-orphan")

class Execution(Base):
    __tablename__ = 'executions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, ForeignKey('jobs.id'), nullable=False)
    timestamp = Column(DateTime, default=datetime.now)
    state = Column(String, nullable=False)
    exit_code = Column(Integer, nullable=True)
    duration = Column(Float, nullable=True)
    log_file = Column(String, nullable=True)

    job = relationship("Job", back_populates="executions")

class Database:
    def __init__(self, db_path=None, logs_path=None):
        # Default paths if not provided
        self.db_path = db_path or os.environ.get('CRONBAT_DB_PATH', 'instance/cronbat.db')
        self.logs_path = logs_path or os.environ.get('CRONBAT_LOGS_PATH', 'instance/logs')

        # Ensure directories exist
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        os.makedirs(self.logs_path, exist_ok=True)

        # Create database engine
        self.engine = create_engine(f'sqlite:///{self.db_path}')
        Base.metadata.create_all(self.engine)

        # Create session factory
        self.Session = sessionmaker(bind=self.engine)

    def get_jobs(self):
        """Get all jobs from the database"""
        session = self.Session()
        try:
            jobs = session.query(Job).all()
            return [self._job_to_dict(job) for job in jobs]
        finally:
            session.close()

    def get_job(self, job_id):
        """Get a specific job by ID"""
        session = self.Session()
        try:
            job = session.query(Job).filter_by(id=job_id).first()
            if job:
                return self._job_to_dict(job)
            return None
        finally:
            session.close()

    def add_job(self, job_id, name, command, schedule, description=''):
        """Add a new job to the database"""
        session = self.Session()
        try:
            job = Job(
                id=job_id,
                name=name,
                command=command,
                schedule=schedule,
                description=description,
                created_at=datetime.now()
            )
            session.add(job)
            session.commit()
            return job_id
        finally:
            session.close()

    def update_job(self, job_id, data):
        """Update job properties"""
        session = self.Session()
        try:
            job = session.query(Job).filter_by(id=job_id).first()
            if not job:
                return False

            # Make a copy of data to avoid modifying the original
            update_data = data.copy()

            # Remove id field if present to prevent primary key changes
            if 'id' in update_data:
                del update_data['id']

            # Check if name is being changed and if it would conflict with another job
            if 'name' in update_data and update_data['name'] != job.name:
                # Check if another job with the same name exists
                existing_job = session.query(Job).filter(Job.name == update_data['name'], Job.id != job_id).first()
                if existing_job:
                    return False

            # Update fields that are present in data
            for key, value in update_data.items():
                if hasattr(job, key):
                    setattr(job, key, value)

            session.commit()
            return True
        finally:
            session.close()

    def remove_job(self, job_id):
        """Remove a job from the database"""
        session = self.Session()
        try:
            job = session.query(Job).filter_by(id=job_id).first()
            if not job:
                return False

            session.delete(job)
            session.commit()
            return True
        finally:
            session.close()

    def add_execution(self, job_id, state, exit_code=None, duration=None, log_content=None):
        """Add a new execution record and save log to file"""
        session = self.Session()
        try:
            # Update job's last_run timestamp
            job = session.query(Job).filter_by(id=job_id).first()
            if not job:
                return None

            timestamp = datetime.now()
            job.last_run = timestamp

            # Create log file if content is provided
            log_file = None
            if log_content is not None:
                # Generate a unique filename based on job_id and timestamp
                filename = f"{job_id}_{timestamp.strftime('%Y%m%d%H%M%S')}.txt"
                log_file = os.path.join(self.logs_path, filename)

                # Write log content to file
                with open(log_file, 'w') as f:
                    f.write(log_content)

            # Create execution record
            execution = Execution(
                job_id=job_id,
                timestamp=timestamp,
                state=state,
                exit_code=exit_code,
                duration=duration,
                log_file=log_file
            )

            session.add(execution)
            session.commit()

            return {
                'id': execution.id,
                'job_id': execution.job_id,
                'timestamp': execution.timestamp.isoformat(),
                'state': execution.state,
                'exit_code': execution.exit_code,
                'duration': execution.duration,
                'log_file': execution.log_file
            }
        finally:
            session.close()

    def get_job_executions(self, job_id, limit=10):
        """Get execution history for a specific job"""
        session = self.Session()
        try:
            executions = session.query(Execution).filter_by(job_id=job_id).order_by(Execution.timestamp.desc()).limit(limit).all()
            return [self._execution_to_dict(execution) for execution in executions]
        finally:
            session.close()

    def get_all_executions(self, limit=50):
        """Get execution history for all jobs"""
        session = self.Session()
        try:
            executions = session.query(Execution).join(Job).order_by(Execution.timestamp.desc()).limit(limit).all()
            return [self._execution_to_dict(execution, include_job=True) for execution in executions]
        finally:
            session.close()

    def get_execution_log(self, job_id, timestamp):
        """Get log for a specific execution"""
        session = self.Session()
        try:
            execution = session.query(Execution).filter_by(
                job_id=job_id
            ).filter(
                Execution.timestamp == datetime.fromisoformat(timestamp)
            ).first()

            if not execution or not execution.log_file:
                return None

            # Read log file content
            try:
                with open(execution.log_file, 'r') as f:
                    log_content = f.read()

                return {
                    'timestamp': execution.timestamp.isoformat(),
                    'output': log_content,
                    'exit_code': execution.exit_code,
                    'duration': execution.duration
                }
            except FileNotFoundError:
                return {
                    'timestamp': execution.timestamp.isoformat(),
                    'output': 'Log file not found',
                    'exit_code': execution.exit_code,
                    'duration': execution.duration
                }
        finally:
            session.close()

    def _job_to_dict(self, job):
        """Convert Job object to dictionary"""
        return {
            'id': job.id,
            'name': job.name,
            'command': job.command,
            'schedule': job.schedule,
            'description': job.description,
            'created_at': job.created_at.isoformat() if job.created_at else None,
            'last_run': job.last_run.isoformat() if job.last_run else None,
            'is_paused': job.is_paused
        }

    def _execution_to_dict(self, execution, include_job=False):
        """Convert Execution object to dictionary"""
        result = {
            'id': execution.id,
            'job_id': execution.job_id,
            'timestamp': execution.timestamp.isoformat(),
            'state': execution.state,
            'exit_code': execution.exit_code,
            'duration': execution.duration,
            'log_file': execution.log_file
        }

        if include_job:
            result['job_name'] = execution.job.name

        return result
