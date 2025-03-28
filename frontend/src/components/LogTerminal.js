import React, { useEffect, useRef } from 'react';

function LogTerminal({ logs, liveLog = [] }) {
  const terminalRef = useRef(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, liveLog]);

  // Combine historical logs with live logs
  const allLogs = [...(logs || []), ...liveLog];

  return (
    <div className="bg-gray-900 rounded-lg shadow-inner overflow-hidden">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
        <h3 className="text-sm font-medium text-gray-200">Terminal Output</h3>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      <div
        ref={terminalRef}
        className="log-terminal p-4 h-80 overflow-y-auto font-mono text-sm text-gray-300"
      >
        {allLogs.length > 0 ? (
          <div>
            {allLogs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {typeof log === 'string'
                  ? log
                  : log.output || 'No output available'}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic">No logs available</div>
        )}
      </div>
    </div>
  );
}

export default LogTerminal;
