import React, { useState, useEffect } from 'react';
import { getExecutionLog } from '../services/api';
import LogTerminal from './LogTerminal';

function ExecutionLogViewer({ jobId, timestamp }) {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId || !timestamp) {
      setLog(null);
      return;
    }

    const fetchLog = async () => {
      setLoading(true);
      try {
        const data = await getExecutionLog(jobId, timestamp);
        setLog(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch execution log:', err);
        setError('Failed to load execution log. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
  }, [jobId, timestamp]);

  if (!jobId || !timestamp) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Select an execution to view its logs</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-cronbat-500 rounded-full"></div>
          <div className="mt-2 text-sm text-cronbat-700">Loading logs...</div>
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

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-medium text-gray-900">Execution Log</h3>
        <div className="text-xs text-gray-500">
          {new Date(timestamp).toLocaleString()}
        </div>
      </div>
      <LogTerminal logs={log ? [log] : []} />
    </div>
  );
}

export default ExecutionLogViewer;
