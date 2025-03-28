import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import JobDetails from './pages/JobDetails';
import CreateJob from './pages/CreateJob';
import ExecutionHistory from './pages/ExecutionHistory';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="jobs/new" element={<CreateJob />} />
          <Route path="jobs/:jobId" element={<JobDetails />} />
          <Route path="executions" element={<ExecutionHistory />} />
        </Route>
      </Routes>
    </SocketProvider>
  );
}

export default App;
