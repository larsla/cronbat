import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { getJob, getJobLogs, getJobExecutions, getExecutionLog, runJob, deleteJob, pauseJob, resumeJob, updateJob } from '../services/api';
import LogTerminal from '../components/LogTerminal';

function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { socket, subscribeToJob } = useSocket();

  const [job, setJob] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [executionLogs, setExecutionLogs] = useState({});
  const [liveLog, setLiveLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch job details and execution history
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const [jobData, executionsData] = await Promise.all([
          getJob(jobId),
          getJobExecutions(jobId)
        ]);

        setJob(jobData);
        setEditedJob({
          name: jobData.name,
          command: jobData.command,
          schedule: jobData.schedule,
          description: jobData.description || ''
        });
        setExecutions(executionsData);
        setLoading(false);

        // Fetch logs for each execution
        const logPromises = executionsData.map(async (execution) => {
          try {
            const logData = await getExecutionLog(jobId, execution.timestamp);
            if (logData) {
              setExecutionLogs(prev => ({
                ...prev,
                [execution.timestamp]: logData
              }));
            }
          } catch (error) {
            console.error(`Failed to fetch log for execution ${execution.timestamp}:`, error);
          }
        });

        await Promise.all(logPromises);
      } catch (err) {
        console.error('Failed to fetch job details:', err);
        setError('Failed to load job details. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  // Subscribe to job updates via socket
  useEffect(() => {
    if (socket && jobId) {
      // Subscribe to this job
      subscribeToJob(jobId);

      // Listen for job details updates
      socket.on('job_details', (data) => {
        setJob(data);
      });

      // Listen for job state changes
      socket.on('job_state_changed', (data) => {
        if (data.id === jobId) {
          setJob((prevJob) => ({
            ...prevJob,
            state: data.state
          }));
        }
      });

      // Listen for job logs
      socket.on('job_log', (data) => {
        if (data.id === jobId) {
          setLiveLog((prevLogs) => [...prevLogs, data.line]);
        }
      });

      // Listen for job completion
      socket.on('job_completed', (data) => {
        if (data.id === jobId) {
          // Refresh executions and logs after job completes
          getJobExecutions(jobId).then(newExecutions => {
            setExecutions(newExecutions);

            // Fetch log for the new execution
            if (newExecutions.length > 0) {
              const latestExecution = newExecutions[0]; // Assuming sorted by timestamp desc
              getExecutionLog(jobId, latestExecution.timestamp)
                .then(logData => {
                  if (logData) {
                    setExecutionLogs(prev => ({
                      ...prev,
                      [latestExecution.timestamp]: logData
                    }));
                  }
                })
                .catch(console.error);
            }
          }).catch(console.error);

          // Clear live logs
          setLiveLog([]);
        }
      });

      // Cleanup listeners on unmount
      return () => {
        socket.off('job_details');
        socket.off('job_state_changed');
        socket.off('job_log');
        socket.off('job_completed');
      };
    }
  }, [socket, jobId, subscribeToJob]);

  const handleRunJob = async () => {
    try {
      await runJob(jobId);
      // Clear live logs when manually running a job
      setLiveLog([]);
    } catch (error) {
      console.error('Failed to run job:', error);
    }
  };

  const handleDeleteJob = async () => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      setIsDeleting(true);
      try {
        await deleteJob(jobId);
        navigate('/');
      } catch (error) {
        console.error('Failed to delete job:', error);
        setIsDeleting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-cronbat-500 rounded-full"></div>
          <div className="mt-4 text-cronbat-700">Loading job details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">Job not found</p>
          </div>
        </div>
      </div>
    );
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.name}</h1>
          {job.is_paused && (
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Paused
            </span>
          )}
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-md text-white font-medium bg-indigo-600 hover:bg-indigo-700"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Job'}
          </button>
          {job.is_paused ? (
            <button
              onClick={async () => {
                try {
                  await resumeJob(jobId);
                  // Update job state locally
                  setJob(prevJob => ({
                    ...prevJob,
                    is_paused: false
                  }));
                } catch (error) {
                  console.error('Failed to resume job:', error);
                  // Try to refresh job data even if there's an error
                  try {
                    const updatedJob = await getJob(jobId);
                    setJob(updatedJob);
                  } catch (refreshError) {
                    console.error('Failed to refresh job data:', refreshError);
                  }
                }
              }}
              className="px-4 py-2 rounded-md text-white font-medium bg-green-600 hover:bg-green-700"
            >
              Resume Job
            </button>
          ) : (
            <button
              onClick={async () => {
                try {
                  await pauseJob(jobId);
                  // Update job state locally
                  setJob(prevJob => ({
                    ...prevJob,
                    is_paused: true
                  }));
                } catch (error) {
                  console.error('Failed to pause job:', error);
                  // Try to refresh job data even if there's an error
                  try {
                    const updatedJob = await getJob(jobId);
                    setJob(updatedJob);
                  } catch (refreshError) {
                    console.error('Failed to refresh job data:', refreshError);
                  }
                }
              }}
              className="px-4 py-2 rounded-md text-white font-medium bg-yellow-600 hover:bg-yellow-700"
            >
              Pause Job
            </button>
          )}
          <button
            onClick={handleRunJob}
            disabled={job.state === 'running' || job.is_paused}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              job.state === 'running' || job.is_paused
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-cronbat-600 hover:bg-cronbat-700'
            }`}
          >
            {job.state === 'running' ? 'Running...' : 'Run Now'}
          </button>
          <button
            onClick={handleDeleteJob}
            disabled={isDeleting}
            className="px-4 py-2 rounded-md text-white font-medium bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete Job'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Edit Job</h2>
              <button
                onClick={async () => {
                  // Validate form
                  if (!editedJob.name.trim()) {
                    alert('Job name cannot be empty');
                    return;
                  }
                  if (!editedJob.command.trim()) {
                    alert('Command cannot be empty');
                    return;
                  }
                  if (!editedJob.schedule.trim()) {
                    alert('Schedule cannot be empty');
                    return;
                  }

                  setIsSaving(true);
                  try {
                    await updateJob(jobId, editedJob);
                    setIsEditing(false);
                    // Refresh job data
                    const updatedJob = await getJob(jobId);
                    setJob(updatedJob);
                  } catch (error) {
                    console.error('Failed to update job:', error);

                    // Even if the PATCH call fails, try to refresh the job data
                    // as the database might have been updated correctly
                    try {
                      const updatedJob = await getJob(jobId);
                      setJob(updatedJob);

                      // If we got updated data and it matches what we tried to set,
                      // consider the update successful despite the error
                      if (updatedJob.name === editedJob.name &&
                          updatedJob.command === editedJob.command &&
                          updatedJob.schedule === editedJob.schedule) {
                        setIsEditing(false);
                        console.log('Job updated successfully despite API error');
                        return;
                      }
                    } catch (refreshError) {
                      console.error('Failed to refresh job data:', refreshError);
                    }

                    // Extract error message from response if available
                    let errorMessage = 'Failed to update job. Please try again.';
                    if (error.response && error.response.data && error.response.data.error) {
                      errorMessage = error.response.data.error;
                    }
                    alert(errorMessage);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="px-4 py-2 rounded-md text-white font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={editedJob?.name || ''}
                  onChange={(e) => setEditedJob({...editedJob, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="command" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Command
                </label>
                <textarea
                  id="command"
                  value={editedJob?.command || ''}
                  onChange={(e) => setEditedJob({...editedJob, command: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
                />
              </div>
              <div>
                <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Schedule (Cron Expression)
                </label>
                <input
                  type="text"
                  id="schedule"
                  value={editedJob?.schedule || ''}
                  onChange={(e) => setEditedJob({...editedJob, schedule: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Format: minute hour day-of-month month day-of-week (e.g., "0 * * * *" for every hour)
                </p>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description (Recommended)
                </label>
                <textarea
                  id="description"
                  value={editedJob?.description || ''}
                  onChange={(e) => setEditedJob({...editedJob, description: e.target.value})}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  A short description will be displayed on the dashboard instead of the command.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Job Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Command:
                    </span>
                    <pre className="mt-1 text-sm text-gray-900 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded whitespace-pre-wrap overflow-auto">
                      {job.command}
                    </pre>
                  </div>
                  {job.trigger_type === 'dependency' ? (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Triggered by:
                      </span>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-300">
                        {job.parent_jobs ? job.parent_jobs.map(p => p.name).join(', ') : 'Other jobs'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Schedule:
                      </span>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-300">{job.schedule}</p>
                    </div>
                  )}
                  {job.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Description:
                      </span>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-300">
                        {job.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Status</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Current State:
                    </span>
                    <p className="mt-1 flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(
                          job.state
                        )}`}
                      >
                        {job.state}
                      </span>
                      {job.is_paused && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Paused
                        </span>
                      )}
                    </p>
                  </div>
                  {job.last_run && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Last Run:
                      </span>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-300">
                        {new Date(job.last_run).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {job.next_run && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Next Run:
                      </span>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-300">
                        {new Date(job.next_run).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Logs</h2>
        {job.state === 'running' ? (
          // Show live logs when job is running
          <LogTerminal logs={[]} liveLog={liveLog} />
        ) : (
          // Show logs from the most recent execution
          executions.length > 0 && executionLogs[executions[0].timestamp] ? (
            <LogTerminal
              logs={[executionLogs[executions[0].timestamp]]}
              liveLog={[]}
            />
          ) : (
            <LogTerminal logs={[]} liveLog={[]} />
          )
        )}

        {executions.length > 1 && (
          <div className="mt-4">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Previous Executions</h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-60 overflow-y-auto">
                {executions.slice(1).map((execution) => (
                  <div
                    key={execution.timestamp}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={async () => {
                      if (!executionLogs[execution.timestamp]) {
                        try {
                          const logData = await getExecutionLog(jobId, execution.timestamp);
                          if (logData) {
                            setExecutionLogs(prev => ({
                              ...prev,
                              [execution.timestamp]: logData
                            }));
                          }
                        } catch (error) {
                          console.error(`Failed to fetch log for execution ${execution.timestamp}:`, error);
                        }
                      }

                      // Update the displayed log
                      setExecutions(prev => {
                        const newExecutions = [...prev];
                        const clickedIndex = newExecutions.findIndex(e => e.timestamp === execution.timestamp);
                        if (clickedIndex > 0) {
                          const clickedExecution = newExecutions.splice(clickedIndex, 1)[0];
                          newExecutions.unshift(clickedExecution);
                        }
                        return newExecutions;
                      });
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-900 dark:text-gray-300">
                        {new Date(execution.timestamp).toLocaleString()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(
                            execution.state
                          )}`}
                        >
                          {execution.state}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {execution.duration ? `${execution.duration.toFixed(1)}s` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDetails;
