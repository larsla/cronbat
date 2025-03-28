import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { getJob, getJobLogs, getJobExecutions, getExecutionLog, runJob, deleteJob, pauseJob, resumeJob } from '../services/api';
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

  // Fetch job details and execution history
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const [jobData, executionsData] = await Promise.all([
          getJob(jobId),
          getJobExecutions(jobId)
        ]);

        setJob(jobData);
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
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">{job.name}</h1>
          {job.is_paused && (
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Paused
            </span>
          )}
        </div>
        <div className="flex space-x-4">
          {job.is_paused ? (
            <button
              onClick={async () => {
                try {
                  await resumeJob(jobId);
                } catch (error) {
                  console.error('Failed to resume job:', error);
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
                } catch (error) {
                  console.error('Failed to pause job:', error);
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

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Job Details
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Command:
                  </span>
                  <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                    {job.command}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Schedule:
                  </span>
                  <p className="mt-1 text-sm text-gray-900">{job.schedule}</p>
                </div>
                {job.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Description:
                    </span>
                    <p className="mt-1 text-sm text-gray-900">
                      {job.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Status</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Paused
                      </span>
                    )}
                  </p>
                </div>
                {job.last_run && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Last Run:
                    </span>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(job.last_run).toLocaleString()}
                    </p>
                  </div>
                )}
                {job.next_run && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Next Run:
                    </span>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(job.next_run).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Logs</h2>
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
            <h3 className="text-md font-medium text-gray-900 mb-2">Previous Executions</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                {executions.slice(1).map((execution) => (
                  <div
                    key={execution.timestamp}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
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
                      <div className="text-sm text-gray-900">
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
                        <span className="text-xs text-gray-500">
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
