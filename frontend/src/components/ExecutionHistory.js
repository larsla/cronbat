import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllExecutions } from '../services/api';

function ExecutionHistory({ onExecutionSelect }) {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExecution, setSelectedExecution] = useState(null);

  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        const data = await getAllExecutions();
        setExecutions(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch executions:', err);
        setError('Failed to load execution history. Please try again later.');
        setLoading(false);
      }
    };

    fetchExecutions();
  }, []);

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

  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-cronbat-500 rounded-full"></div>
          <div className="mt-2 text-sm text-cronbat-700">Loading history...</div>
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

  if (executions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <h3 className="text-base font-medium text-gray-900">No execution history</h3>
        <p className="mt-1 text-sm text-gray-500">
          Run a job to see its execution history here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-base font-medium text-gray-900">Execution History</h3>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {executions.map((execution) => (
          <div
            key={`${execution.job_id}-${execution.timestamp}`}
            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
              selectedExecution &&
              selectedExecution.job_id === execution.job_id &&
              selectedExecution.timestamp === execution.timestamp
                ? 'bg-gray-50'
                : ''
            }`}
            onClick={() => {
              setSelectedExecution(execution);
              if (onExecutionSelect) {
                onExecutionSelect(execution);
              }
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <Link
                  to={`/jobs/${execution.job_id}`}
                  className="text-sm font-medium text-cronbat-600 hover:text-cronbat-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {execution.job_name || 'Unknown Job'}
                </Link>
                <div className="text-xs text-gray-500">
                  {new Date(execution.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStateColor(
                    execution.state
                  )}`}
                >
                  {execution.state}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDuration(execution.duration)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExecutionHistory;
