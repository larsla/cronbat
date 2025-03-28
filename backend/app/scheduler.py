import os
import subprocess
import threading
import time
import uuid
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from flask_socketio import emit
from app import socketio

# Initialize the scheduler
scheduler = BackgroundScheduler()
scheduler.start()

# Store for jobs and their metadata
jobs = {}
# Store for job logs
job_logs = {}
# Store for job execution state
job_states = {}
# Store for job execution history
job_executions = {}

def get_jobs():
    """Get all jobs with their metadata"""
    result = []
    for job_id, metadata in jobs.items():
        job_info = {
            'id': job_id,
            'name': metadata['name'],
            'command': metadata['command'],
            'schedule': metadata['schedule'],
            'description': metadata.get('description', ''),
            'state': job_states.get(job_id, 'idle'),
            'last_run': metadata.get('last_run'),
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
    if job_id not in jobs:
        return None

    metadata = jobs[job_id]
    job_info = {
        'id': job_id,
        'name': metadata['name'],
        'command': metadata['command'],
        'schedule': metadata['schedule'],
        'description': metadata.get('description', ''),
        'state': job_states.get(job_id, 'idle'),
        'last_run': metadata.get('last_run'),
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

    # Store job metadata
    jobs[job_id] = {
        'name': name,
        'command': command,
        'schedule': schedule,
        'description': description,
        'created_at': datetime.now().isoformat()
    }

    # Initialize job logs and executions
    job_logs[job_id] = []
    job_executions[job_id] = []

    # Schedule the job
    scheduler.add_job(
        execute_job,
        CronTrigger.from_crontab(schedule),
        id=job_id,
        args=[job_id]
    )

    # Emit job added event
    socketio.emit('job_added', get_job(job_id))

    return job_id

def remove_job(job_id):
    """Remove a job from the scheduler"""
    if job_id not in jobs:
        return False

    # Remove the job from the scheduler
    scheduler.remove_job(job_id)

    # Remove job metadata, logs, and executions
    del jobs[job_id]
    del job_logs[job_id]
    if job_id in job_states:
        del job_states[job_id]
    if job_id in job_executions:
        del job_executions[job_id]

    # Emit job removed event
    socketio.emit('job_removed', {'id': job_id})

    return True

def run_job(job_id):
    """Manually trigger a job to run"""
    if job_id not in jobs:
        return False

    # Run the job in a separate thread
    thread = threading.Thread(target=execute_job, args=[job_id])
    thread.daemon = True
    thread.start()

    return True

def execute_job(job_id):
    """Execute a job and capture its output"""
    if job_id not in jobs:
        return

    # Update job state to running
    job_states[job_id] = 'running'
    socketio.emit('job_state_changed', {'id': job_id, 'state': 'running'})

    # Get job command
    command = jobs[job_id]['command']

    # Record start time
    start_time = datetime.now()
    jobs[job_id]['last_run'] = start_time.isoformat()

    # Initialize log entry
    log_entry = {
        'timestamp': start_time.isoformat(),
        'output': '',
        'exit_code': None,
        'duration': None
    }

    try:
        # Execute the command
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        # Stream output in real-time
        for line in iter(process.stdout.readline, ''):
            log_entry['output'] += line
            socketio.emit('job_log', {'id': job_id, 'line': line})

        # Wait for process to complete
        exit_code = process.wait()
        log_entry['exit_code'] = exit_code

        # Update job state based on exit code
        job_states[job_id] = 'success' if exit_code == 0 else 'failed'

    except Exception as e:
        # Handle execution errors
        log_entry['output'] += f"Error executing job: {str(e)}\n"
        log_entry['exit_code'] = -1
        job_states[job_id] = 'failed'

    # Calculate duration
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    log_entry['duration'] = duration

    # Add log entry
    job_logs[job_id].append(log_entry)

    # Create execution history entry
    execution_entry = {
        'timestamp': start_time.isoformat(),
        'state': job_states[job_id],
        'exit_code': log_entry['exit_code'],
        'duration': duration,
        'log_id': id(log_entry)  # Use object id as a reference to the log
    }

    # Add execution entry to history
    if job_id not in job_executions:
        job_executions[job_id] = []
    job_executions[job_id].append(execution_entry)

    # Emit job state changed event
    socketio.emit('job_state_changed', {'id': job_id, 'state': job_states[job_id]})

    # Emit job completed event
    socketio.emit('job_completed', {
        'id': job_id,
        'exit_code': log_entry['exit_code'],
        'duration': duration
    })

def get_job_logs(job_id, limit=10):
    """Get logs for a specific job"""
    if job_id not in job_logs:
        return None

    # Return the most recent logs up to the limit
    return sorted(job_logs[job_id], key=lambda x: x['timestamp'], reverse=True)[:limit]

def get_job_executions(job_id, limit=10):
    """Get execution history for a specific job"""
    if job_id not in job_executions:
        return []

    # Return the most recent executions up to the limit
    return sorted(job_executions[job_id], key=lambda x: x['timestamp'], reverse=True)[:limit]

def get_all_executions(limit=50):
    """Get execution history for all jobs"""
    all_executions = []

    for job_id, executions in job_executions.items():
        for execution in executions:
            # Add job name and id to each execution record
            execution_with_job = execution.copy()
            if job_id in jobs:
                execution_with_job['job_name'] = jobs[job_id]['name']
            execution_with_job['job_id'] = job_id
            all_executions.append(execution_with_job)

    # Sort by timestamp (newest first) and limit the results
    return sorted(all_executions, key=lambda x: x['timestamp'], reverse=True)[:limit]

def get_execution_log(job_id, execution_timestamp):
    """Get the log for a specific execution"""
    if job_id not in job_logs or job_id not in job_executions:
        return None

    # Find the execution entry
    for execution in job_executions[job_id]:
        if execution['timestamp'] == execution_timestamp:
            # Find the corresponding log entry
            for log in job_logs[job_id]:
                if log['timestamp'] == execution_timestamp:
                    return log

    return None

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
    if job_id and job_id in jobs:
        # Join the job's room
        emit('job_details', get_job(job_id))
