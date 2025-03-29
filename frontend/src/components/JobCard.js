import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { runJob, pauseJob, resumeJob, getJob } from '../services/api';

function JobCard({ job }) {
  const [isPaused, setIsPaused] = useState(job.is_paused);

  const handleRunJob = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await runJob(job.id);
    } catch (error) {
      console.error('Failed to run job:', error);
    }
  };

  const handlePauseJob = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await pauseJob(job.id);
      setIsPaused(true);
    } catch (error) {
      console.error('Failed to pause job:', error);
      // Try to refresh the job state
      try {
        const updatedJob = await getJob(job.id);
        setIsPaused(updatedJob.is_paused);
      } catch (refreshError) {
        console.error('Failed to refresh job data:', refreshError);
      }
    }
  };

  const handleResumeJob = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await resumeJob(job.id);
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to resume job:', error);
      // Try to refresh the job state
      try {
        const updatedJob = await getJob(job.id);
        setIsPaused(updatedJob.is_paused);
      } catch (refreshError) {
        console.error('Failed to refresh job data:', refreshError);
      }
    }
  };

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
    <Link
      to={`/jobs/${job.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {job.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs">
              {job.command}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isPaused && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Paused
              </span>
            )}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(
                job.state
              )}`}
            >
              {job.state}
            </span>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex justify-between items-center">
            <div>
              {job.trigger_type === 'dependency' ? (
                <p>
                  <span className="font-medium dark:text-gray-300">Triggered by:</span>{' '}
                  {job.parent_jobs ? job.parent_jobs.map(p => p.name).join(', ') : 'Other jobs'}
                </p>
              ) : (
                <p>
                  <span className="font-medium dark:text-gray-300">Schedule:</span> {job.schedule}
                </p>
              )}
              {job.last_run && (
                <p>
                  <span className="font-medium dark:text-gray-300">Last Run:</span>{' '}
                  {new Date(job.last_run).toLocaleString()}
                </p>
              )}
              {job.next_run && (
                <p>
                  <span className="font-medium dark:text-gray-300">Next Run:</span>{' '}
                  {new Date(job.next_run).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {isPaused ? (
                <button
                  onClick={handleResumeJob}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={handlePauseJob}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Pause
                </button>
              )}
              <button
                onClick={handleRunJob}
                disabled={isPaused}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                  isPaused
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-cronbat-600 hover:bg-cronbat-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cronbat-500'
                }`}
              >
                Run Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default JobCard;
