import React, { useState } from 'react';
import ExecutionHistoryList from '../components/ExecutionHistory';
import ExecutionLogViewer from '../components/ExecutionLogViewer';

function ExecutionHistoryPage() {
  const [selectedExecution, setSelectedExecution] = useState(null);

  const handleExecutionSelect = (execution) => {
    setSelectedExecution(execution);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Execution History</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ExecutionHistoryList onExecutionSelect={handleExecutionSelect} />
        </div>
        <div>
          {selectedExecution ? (
            <ExecutionLogViewer
              jobId={selectedExecution.job_id}
              timestamp={selectedExecution.timestamp}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">Select an execution to view its logs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExecutionHistoryPage;
