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

  // Group jobs by workflow (connected jobs)
  const organizeJobs = () => {
    // Create a map of parent-child relationships
    const childToParent = {};
    const parentToChildren = {};

    dependencies.forEach(dep => {
      if (!childToParent[dep.child_job_id]) {
        childToParent[dep.child_job_id] = [];
      }
      childToParent[dep.child_job_id].push(dep.parent_job_id);

      if (!parentToChildren[dep.parent_job_id]) {
        parentToChildren[dep.parent_job_id] = [];
      }
      parentToChildren[dep.parent_job_id].push(dep.child_job_id);
    });

    // Find root jobs (jobs with no parents)
    const rootJobs = jobs.filter(job => !childToParent[job.id] || childToParent[job.id].length === 0);

    // Group jobs into workflows
    const workflows = [];
    const processedJobs = new Set();

    // Process each root job and its children
    rootJobs.forEach(rootJob => {
      if (processedJobs.has(rootJob.id)) return;

      const workflow = [rootJob.id];
      processedJobs.add(rootJob.id);

      // Add all children to the workflow
      const addChildren = (parentId) => {
        const children = parentToChildren[parentId] || [];
        children.forEach(childId => {
          if (!processedJobs.has(childId)) {
            workflow.push(childId);
            processedJobs.add(childId);
            addChildren(childId);
          }
        });
      };

      addChildren(rootJob.id);
      workflows.push(workflow);
    });

    // Add any remaining jobs as individual workflows
    jobs.forEach(job => {
      if (!processedJobs.has(job.id)) {
        workflows.push([job.id]);
        processedJobs.add(job.id);
      }
    });

    return { workflows, parentToChildren };
  };

  const { workflows, parentToChildren } = organizeJobs();

  // Render arrows between dependent jobs
  const renderArrows = () => {
    return dependencies.map((dep, index) => {
      const parentJob = jobMap[dep.parent_job_id];
      const childJob = jobMap[dep.child_job_id];

      if (!parentJob || !childJob) return null;

      return (
        <div
          key={`arrow-${index}`}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-cronbat-500"
          >
            <path
              d="M5 12H19M19 12L13 6M19 12L13 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
          to="/jobs/new"
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
              to="/jobs/new"
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
          {/* We don't need the separate renderArrows function anymore since we're rendering arrows inline */}

          {/* Render jobs by workflow */}
          {workflows.map((workflow, index) => (
            <div key={`workflow-${index}`} className="mb-8">
              <h2 className="text-lg font-medium text-gray-700 mb-4">
                {workflow.length === 1 && (!parentToChildren[workflow[0]] || parentToChildren[workflow[0]].length === 0)
                  ? 'Independent Jobs'
                  : `Workflow ${index + 1}`}
              </h2>
              <div className="flex flex-wrap items-center">
                {workflow.map((jobId, jobIndex) => (
                  <React.Fragment key={jobId}>
                    <div className="mb-4 mr-2">
                      <JobCard job={jobMap[jobId]} />
                    </div>
                    {/* Add arrow if this job has children and it's not the last job */}
                    {parentToChildren[jobId] && parentToChildren[jobId].length > 0 && jobIndex < workflow.length - 1 && (
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center mb-4 mr-2">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-cronbat-500"
                        >
                          <path
                            d="M5 12H19M19 12L13 6M19 12L13 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
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
