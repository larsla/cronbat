import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, getAllDependencies } from '../services/api';
import JobCard from '../components/JobCard';

function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, dependenciesData] = await Promise.all([
          getJobs(),
          getAllDependencies()
        ]);
        setJobs(jobsData);
        setDependencies(dependenciesData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create a job map for easier lookup
  const jobMap = jobs.reduce((map, job) => {
    map[job.id] = job;
    return map;
  }, {});

  // Organize jobs into rows based on dependencies
  const organizeJobs = () => {
    // Create a map of job IDs to their dependency level
    const jobLevels = {};
    const jobsWithParents = new Set();

    // First, identify all jobs that are triggered by other jobs
    dependencies.forEach(dep => {
      jobsWithParents.add(dep.child_job_id);
    });

    // Jobs with no parents (level 0)
    const rootJobs = jobs.filter(job => !jobsWithParents.has(job.id));
    rootJobs.forEach(job => {
      jobLevels[job.id] = 0;
    });

    // Assign levels to the rest of the jobs
    let changed = true;
    while (changed) {
      changed = false;
      dependencies.forEach(dep => {
        if (jobLevels[dep.parent_job_id] !== undefined && jobLevels[dep.child_job_id] === undefined) {
          jobLevels[dep.child_job_id] = jobLevels[dep.parent_job_id] + 1;
          changed = true;
        }
      });
    }

    // Group jobs by level
    const rows = {};
    Object.keys(jobLevels).forEach(jobId => {
      const level = jobLevels[jobId];
      if (!rows[level]) rows[level] = [];
      rows[level].push(jobId);
    });

    // Add any remaining jobs to level 0
    jobs.forEach(job => {
      if (jobLevels[job.id] === undefined) {
        if (!rows[0]) rows[0] = [];
        rows[0].push(job.id);
        jobLevels[job.id] = 0;
      }
    });

    return { rows, jobLevels };
  };

  const { rows, jobLevels } = organizeJobs();

  // Render arrows between dependent jobs
  const renderArrows = () => {
    return dependencies.map((dep, index) => {
      const parentJob = jobMap[dep.parent_job_id];
      const childJob = jobMap[dep.child_job_id];

      if (!parentJob || !childJob) return null;

      // Calculate positions based on job levels
      const parentLevel = jobLevels[dep.parent_job_id];
      const childLevel = jobLevels[dep.child_job_id];

      // Only render arrows between adjacent levels for simplicity
      if (childLevel - parentLevel !== 1) return null;

      return (
        <div
          key={`arrow-${index}`}
          className="absolute border-t-2 border-cronbat-500"
          style={{
            left: '50%',
            width: '50px',
            top: `calc(${parentLevel * 200 + 100}px)`,
            transform: 'translateX(-50%)'
          }}
        >
          <div
            className="absolute w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-cronbat-500"
            style={{
              right: '-8px',
              top: '-4px',
              transform: 'rotate(90deg)'
            }}
          />
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-cronbat-500 rounded-full"></div>
          <div className="mt-4 text-cronbat-700">Loading jobs...</div>
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Dashboard</h1>
        <Link
          to="/jobs/create"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cronbat-600 hover:bg-cronbat-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cronbat-500"
        >
          Create New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new job.
          </p>
          <div className="mt-6">
            <Link
              to="/jobs/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cronbat-600 hover:bg-cronbat-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cronbat-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create New Job
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Render job dependency arrows */}
          {dependencies.length > 0 && renderArrows()}

          {/* Render jobs by level */}
          {Object.keys(rows).sort((a, b) => parseInt(a) - parseInt(b)).map(level => (
            <div key={`level-${level}`} className="mb-8">
              <h2 className="text-lg font-medium text-gray-700 mb-4">
                {level === '0' ? 'Independent Jobs' : `Level ${level} Jobs`}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rows[level].map(jobId => (
                  <JobCard key={jobId} job={jobMap[jobId]} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
