import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getJobs = async () => {
  try {
    const response = await api.get('/jobs');
    return response.data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

export const getJob = async (jobId) => {
  try {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching job ${jobId}:`, error);
    throw error;
  }
};

export const createJob = async (jobData) => {
  try {
    const response = await api.post('/jobs', jobData);
    return response.data;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

export const deleteJob = async (jobId) => {
  try {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting job ${jobId}:`, error);
    throw error;
  }
};

export const updateJob = async (jobId, data) => {
  try {
    const response = await api.patch(`/jobs/${jobId}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating job ${jobId}:`, error);
    throw error;
  }
};

export const runJob = async (jobId) => {
  try {
    const response = await api.post(`/jobs/${jobId}/run`);
    return response.data;
  } catch (error) {
    console.error(`Error running job ${jobId}:`, error);
    throw error;
  }
};

export const pauseJob = async (jobId) => {
  try {
    const response = await api.post(`/jobs/${jobId}/pause`);
    return response.data;
  } catch (error) {
    console.error(`Error pausing job ${jobId}:`, error);
    throw error;
  }
};

export const resumeJob = async (jobId) => {
  try {
    const response = await api.post(`/jobs/${jobId}/resume`);
    return response.data;
  } catch (error) {
    console.error(`Error resuming job ${jobId}:`, error);
    throw error;
  }
};

export const getJobLogs = async (jobId) => {
  try {
    const response = await api.get(`/jobs/${jobId}/logs`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching logs for job ${jobId}:`, error);
    throw error;
  }
};

export const getJobExecutions = async (jobId) => {
  try {
    const response = await api.get(`/jobs/${jobId}/executions`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching executions for job ${jobId}:`, error);
    throw error;
  }
};

export const getAllExecutions = async () => {
  try {
    const response = await api.get('/executions');
    return response.data;
  } catch (error) {
    console.error('Error fetching all executions:', error);
    throw error;
  }
};

export const getExecutionLog = async (jobId, timestamp) => {
  try {
    const response = await api.get(`/jobs/${jobId}/executions/${timestamp}/log`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching execution log for job ${jobId}:`, error);
    throw error;
  }
};

// Job Dependencies API

export const getAllDependencies = async () => {
  try {
    const response = await api.get('/dependencies');
    return response.data;
  } catch (error) {
    console.error('Error fetching all dependencies:', error);
    throw error;
  }
};

export const getJobDependencies = async (jobId) => {
  try {
    const response = await api.get(`/jobs/${jobId}/dependencies`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching dependencies for job ${jobId}:`, error);
    throw error;
  }
};

export const createDependency = async (parentJobId, childJobId) => {
  try {
    const response = await api.post('/dependencies', {
      parent_job_id: parentJobId,
      child_job_id: childJobId
    });
    return response.data;
  } catch (error) {
    console.error(`Error creating dependency between jobs ${parentJobId} and ${childJobId}:`, error);
    throw error;
  }
};

export const deleteDependency = async (parentJobId, childJobId) => {
  try {
    const response = await api.delete(`/dependencies/${parentJobId}/${childJobId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting dependency between jobs ${parentJobId} and ${childJobId}:`, error);
    throw error;
  }
};

export default api;
