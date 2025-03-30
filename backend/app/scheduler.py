import os
import subprocess
import threading
import time
import uuid
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from flask_socketio import emit
from app import socketio, db

# Initialize the scheduler
scheduler = BackgroundScheduler()
scheduler.start()

# In-memory cache for job states (not stored in DB)
job_states = {}
# In-memory cache for live logs
live_logs = {}

def get_jobs():
    """Get all jobs with their metadata"""
    result = []
    jobs = db.get_jobs()

    for job in jobs:
        job_id = job['id']
        job_info = {
            'id': job_id,
            'name': job['name'],
            'command': job['command'],
            'schedule': job['schedule'],
            'description': job.get('description', ''),
            'state': job_states.get(job_id, 'idle'),
            'last_run': job.get('last_run'),
            'is_paused': job.get('is_paused', False),
            'trigger_type': job.get('trigger_type', 'schedule'),
            'parent_jobs': job.get('parent_jobs', None),
            'next_run': None
        }

        # Get next run time if job is scheduled
        apscheduler_job = scheduler.get_job(job_id)
        if apscheduler_job:
            job_info['next_run'] = apscheduler_job.next_run_time.isoformat() if apscheduler_job.next_run_time else None

        result.append(job_info)

    return result

def get_job(job_id):
    """Get a specific job by ID"""
    job = db.get_job(job_id)
    if not job:
        return None

    job_info = {
        'id': job_id,
        'name': job['name'],
        'command': job['command'],
        'schedule': job['schedule'],
        'description': job.get('description', ''),
        'state': job_states.get(job_id, 'idle'),
        'last_run': job.get('last_run'),
        'is_paused': job.get('is_paused', False),
        'trigger_type': job.get('trigger_type', 'schedule'),
        'parent_jobs': job.get('parent_jobs', None),
        'next_run': None
    }

    # Get next run time if job is scheduled
    apscheduler_job = scheduler.get_job(job_id)
    if apscheduler_job:
        job_info['next_run'] = apscheduler_job.next_run_time.isoformat() if apscheduler_job.next_run_time else None

    return job_info

def add_job(name, command, schedule, description=''):
    """Add a new job to the scheduler"""
    job_id = str(uuid.uuid4())

    # Store job in database
    db.add_job(job_id, name, command, schedule, description)

    # Initialize live logs
    live_logs[job_id] = []

    # Schedule the job if not paused
    scheduler.add_job(
        execute_job,
        CronTrigger.from_crontab(schedule),
        id=job_id,
        args=[job_id]
    )

    # Emit job added event
    socketio.emit('job_added', get_job(job_id))

    return job_id

def update_job(job_id, data):
    """Update job properties"""
    job = db.get_job(job_id)
    if not job:
        return False

    # Update job in database
    success = db.update_job(job_id, data)
    if not success:
        return False

    # Check if job is currently in the scheduler
    job_in_scheduler = False
    try:
        scheduler.get_job(job_id)
        job_in_scheduler = True
    except:
        job_in_scheduler = False

    # Always remove the job from the scheduler if it exists
    # This prevents the ConflictingIdError
    if job_in_scheduler:
        try:
            scheduler.remove_job(job_id)
        except:
            pass

    # Get the updated job data
    updated_job = db.get_job(job_id)

    # Determine if the job should be scheduled
    is_paused = updated_job.get('is_paused', False)

    # Only add the job back to the scheduler if it's not paused
    if not is_paused:
        try:
            scheduler.add_job(
                execute_job,
                CronTrigger.from_crontab(updated_job['schedule']),
                id=job_id,
                args=[job_id]
            )
        except Exception as e:
            print(f"Error scheduling job: {e}")
            # Even if scheduling fails, we still updated the database
            # so we'll return success

    # Emit job updated event
    socketio.emit('job_updated', get_job(job_id))

    return True

def remove_job(job_id):
    """Remove a job from the scheduler"""
    # Remove the job from the scheduler
    try:
        scheduler.remove_job(job_id)
    except:
        pass

    # Delete all execution records and log files for the job
    db.delete_all_job_executions(job_id)

    # Remove job from database
    success = db.remove_job(job_id)
    if not success:
        return False

    # Clean up in-memory data
    if job_id in job_states:
        del job_states[job_id]
    if job_id in live_logs:
        del live_logs[job_id]

    # Emit job removed event
    socketio.emit('job_removed', {'id': job_id})

    return True

def run_job(job_id):
    """Manually trigger a job to run"""
    job = db.get_job(job_id)
    if not job:
        return False

    # Don't run if job is paused
    if job.get('is_paused', False):
        return False

    # Run the job in a separate thread
    thread = threading.Thread(target=execute_job, args=[job_id])
    thread.daemon = True
    thread.start()

    return True

def execute_job(job_id):
    """Execute a job and capture its output"""
    job = db.get_job(job_id)
    if not job:
        return

    # Update job state to running
    job_states[job_id] = 'running'
    socketio.emit('job_state_changed', {'id': job_id, 'state': 'running'})

    # Get job command
    command = job['command']

    # Record start time
    start_time = datetime.now()

    # Initialize log
    log_output = ''
    exit_code = None
    duration = None

    try:
        # Process multi-line commands by joining them with semicolons
        processed_command = '; '.join(command.splitlines())

        # Execute the command
        process = subprocess.Popen(
            processed_command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        # Clear live logs
        live_logs[job_id] = []

        # Stream output in real-time
        for line in iter(process.stdout.readline, ''):
            log_output += line
            live_logs[job_id].append(line)
            socketio.emit('job_log', {'id': job_id, 'line': line})

        # Wait for process to complete
        exit_code = process.wait()

        # Update job state based on exit code
        job_states[job_id] = 'success' if exit_code == 0 else 'failed'

    except Exception as e:
        # Handle execution errors
        error_msg = f"Error executing job: {str(e)}\n"
        log_output += error_msg
        live_logs[job_id].append(error_msg)
        socketio.emit('job_log', {'id': job_id, 'line': error_msg})
        exit_code = -1
        job_states[job_id] = 'failed'

    # Calculate duration
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    # Add execution record to database
    db.add_execution(
        job_id=job_id,
        state=job_states[job_id],
        exit_code=exit_code,
        duration=duration,
        log_content=log_output
    )

    # Clean up old executions for this job
    db.cleanup_old_executions(job_id)

    # Emit job state changed event
    socketio.emit('job_state_changed', {'id': job_id, 'state': job_states[job_id]})

    # Emit job completed event
    socketio.emit('job_completed', {
        'id': job_id,
        'exit_code': exit_code,
        'duration': duration
    })

    # If job was successful, trigger dependent jobs
    if exit_code == 0:
        trigger_dependent_jobs(job_id)

def trigger_dependent_jobs(parent_job_id):
    """Trigger jobs that depend on the successful completion of the parent job"""
    dependent_jobs = db.get_dependent_jobs(parent_job_id)

    for job in dependent_jobs:
        # Run each dependent job in a separate thread
        thread = threading.Thread(target=execute_job, args=[job['id']])
        thread.daemon = True
        thread.start()

        # Log and emit event for the triggered job
        info_msg = f"Job triggered by successful completion of job {parent_job_id}"
        socketio.emit('job_triggered', {
            'id': job['id'],
            'parent_id': parent_job_id,
            'message': info_msg
        })

def get_job_logs(job_id, limit=10):
    """Get logs for a specific job"""
    return db.get_job_executions(job_id, limit)

def get_job_executions(job_id, limit=10):
    """Get execution history for a specific job"""
    return db.get_job_executions(job_id, limit)

def get_all_executions(limit=50):
    """Get execution history for all jobs"""
    return db.get_all_executions(limit)

def get_execution_log(job_id, timestamp):
    """Get log for a specific execution"""
    return db.get_execution_log(job_id, timestamp)

def get_live_log(job_id):
    """Get the current live log for a running job"""
    if job_id in live_logs:
        return live_logs[job_id]
    return []

# Load jobs from database on startup
def load_jobs_from_db():
    """Load all jobs from the database and schedule them"""
    jobs = db.get_jobs()
    for job in jobs:
        job_id = job['id']

        # Initialize live logs
        live_logs[job_id] = []

        # Skip scheduling if job is paused
        if job.get('is_paused', False):
            continue

        # Schedule the job
        scheduler.add_job(
            execute_job,
            CronTrigger.from_crontab(job['schedule']),
            id=job_id,
            args=[job_id]
        )

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    # Send current jobs to the connected client
    emit('jobs', get_jobs())

@socketio.on('subscribe_to_job')
def handle_subscribe_to_job(data):
    """Handle job subscription"""
    job_id = data.get('id')
    if job_id:
        job = db.get_job(job_id)
        if job:
            # Join the job's room
            emit('job_details', get_job(job_id))

# Load jobs when the module is imported
load_jobs_from_db()
