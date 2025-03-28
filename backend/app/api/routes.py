from flask import jsonify, request
from app.api import bp
from app.scheduler import (
    scheduler, get_jobs, get_job, add_job, update_job, remove_job, run_job,
    get_job_logs, get_job_executions, get_all_executions, get_execution_log
)

@bp.route('/jobs', methods=['GET'])
def get_all_jobs():
    """Get all scheduled jobs"""
    return jsonify(get_jobs())

@bp.route('/jobs/<job_id>', methods=['GET'])
def get_single_job(job_id):
    """Get a specific job by ID"""
    job = get_job(job_id)
    if job:
        return jsonify(job)
    return jsonify({"error": "Job not found"}), 404

@bp.route('/jobs', methods=['POST'])
def create_job():
    """Create a new scheduled job"""
    data = request.get_json()

    if not data or not all(k in data for k in ('name', 'command', 'schedule')):
        return jsonify({"error": "Missing required fields"}), 400

    job_id = add_job(
        name=data['name'],
        command=data['command'],
        schedule=data['schedule'],
        description=data.get('description', '')
    )

    return jsonify({"job_id": job_id}), 201

@bp.route('/jobs/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a scheduled job"""
    success = remove_job(job_id)
    if success:
        return jsonify({"message": "Job deleted"}), 200
    return jsonify({"error": "Job not found"}), 404

@bp.route('/jobs/<job_id>', methods=['PATCH'])
def update_job_route(job_id):
    """Update job properties"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    success = update_job(job_id, data)
    if success:
        return jsonify({"message": "Job updated"}), 200
    return jsonify({"error": "Job not found"}), 404

@bp.route('/jobs/<job_id>/run', methods=['POST'])
def trigger_job(job_id):
    """Manually trigger a job to run"""
    success = run_job(job_id)
    if success:
        return jsonify({"message": "Job triggered"}), 200
    return jsonify({"error": "Job not found or is paused"}), 404

@bp.route('/jobs/<job_id>/pause', methods=['POST'])
def pause_job(job_id):
    """Pause a job"""
    success = update_job(job_id, {"is_paused": True})
    if success:
        return jsonify({"message": "Job paused"}), 200
    return jsonify({"error": "Job not found"}), 404

@bp.route('/jobs/<job_id>/resume', methods=['POST'])
def resume_job(job_id):
    """Resume a paused job"""
    success = update_job(job_id, {"is_paused": False})
    if success:
        return jsonify({"message": "Job resumed"}), 200
    return jsonify({"error": "Job not found"}), 404

@bp.route('/jobs/<job_id>/logs', methods=['GET'])
def job_logs(job_id):
    """Get logs for a specific job"""
    logs = get_job_logs(job_id)
    if logs is not None:
        return jsonify(logs)
    return jsonify({"error": "Job not found"}), 404

@bp.route('/jobs/<job_id>/executions', methods=['GET'])
def job_executions(job_id):
    """Get execution history for a specific job"""
    executions = get_job_executions(job_id)
    return jsonify(executions)

@bp.route('/executions', methods=['GET'])
def all_executions():
    """Get execution history for all jobs"""
    executions = get_all_executions()
    return jsonify(executions)

@bp.route('/jobs/<job_id>/executions/<timestamp>/log', methods=['GET'])
def execution_log(job_id, timestamp):
    """Get log for a specific execution"""
    log = get_execution_log(job_id, timestamp)
    if log is not None:
        return jsonify(log)
    return jsonify({"error": "Execution log not found"}), 404
