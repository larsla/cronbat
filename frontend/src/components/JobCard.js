import React from 'react';
import { Link } from 'react-router-dom';
import { runJob } from '../services/api';

function JobCard({ job }) {
  const handleRunJob = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await runJob(job.id);
    } catch (error) {
      console.error('Failed to run job:', error);
    }
  };

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
    <Link
      to={`/jobs/${job.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {job.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600 truncate max-w-xs">
              {job.command}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(
              job.state
            )}`}
          >
            {job.state}
          </span>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <div className="flex justify-between items-center">
            <div>
              <p>
                <span className="font-medium">Schedule:</span> {job.schedule}
              </p>
              {job.last_run && (
                <p>
                  <span className="font-medium">Last Run:</span>{' '}
                  {new Date(job.last_run).toLocaleString()}
                </p>
              )}
              {job.next_run && (
                <p>
                  <span className="font-medium">Next Run:</span>{' '}
                  {new Date(job.next_run).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={handleRunJob}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-cronbat-600 hover:bg-cronbat-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cronbat-500"
            >
              Run Now
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default JobCard;
