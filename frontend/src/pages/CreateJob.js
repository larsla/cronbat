import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob, getJobs, createDependency } from '../services/api';

function CreateJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    command: '',
    schedule: '',
    description: '',
    trigger_type: 'schedule'
  });
  const [selectedParentJobs, setSelectedParentJobs] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch available jobs for dependencies
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsData = await getJobs();
        setJobs(jobsData);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }

    // Handle trigger type change
    if (name === 'trigger_type') {
      if (value === 'dependency') {
        setFormData(prev => ({
          ...prev,
          schedule: ''
        }));
      }
    }
  };

  const handleParentJobChange = (e) => {
    const jobId = e.target.value;
    const isChecked = e.target.checked;

    if (isChecked) {
      setSelectedParentJobs(prev => [...prev, jobId]);
    } else {
      setSelectedParentJobs(prev => prev.filter(id => id !== jobId));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.command.trim()) {
      newErrors.command = 'Command is required';
    }

    if (formData.trigger_type === 'schedule') {
      if (!formData.schedule.trim()) {
        newErrors.schedule = 'Schedule is required for scheduled jobs';
      } else if (!isValidCronExpression(formData.schedule)) {
        newErrors.schedule = 'Invalid cron expression';
      }
    } else if (formData.trigger_type === 'dependency' && selectedParentJobs.length === 0) {
      newErrors.parent_jobs = 'At least one parent job must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidCronExpression = (cron) => {
    // Basic cron validation - 5 or 6 space-separated fields
    const fields = cron.trim().split(/\s+/);
    return fields.length >= 5 && fields.length <= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the job
      const jobData = {
        ...formData,
        // If it's a dependency-triggered job, we don't need a schedule
        schedule: formData.trigger_type === 'dependency' ? '0 0 31 2 *' : formData.schedule
      };

      const response = await createJob(jobData);
      const newJobId = response.job_id;

      // If it's a dependency-triggered job, create the dependencies
      if (formData.trigger_type === 'dependency' && selectedParentJobs.length > 0) {
        const dependencyPromises = selectedParentJobs.map(parentId =>
          createDependency(parentId, newJobId)
        );

        await Promise.all(dependencyPromises);
      }

      navigate(`/jobs/${newJobId}`);
    } catch (error) {
      console.error('Failed to create job:', error);
      setErrors((prev) => ({
        ...prev,
        submit: 'Failed to create job. Please try again.'
      }));
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Job</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {errors.submit && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
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
                  <p className="text-sm text-red-700">{errors.submit}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Job Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-cronbat-500 focus:ring-cronbat-500'
                  }`}
                  placeholder="Daily Backup"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="command"
                  className="block text-sm font-medium text-gray-700"
                >
                  Command
                </label>
                <input
                  type="text"
                  name="command"
                  id="command"
                  value={formData.command}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    errors.command
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-cronbat-500 focus:ring-cronbat-500'
                  }`}
                  placeholder="bash /path/to/script.sh"
                />
                {errors.command && (
                  <p className="mt-2 text-sm text-red-600">{errors.command}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trigger Type
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      id="trigger-schedule"
                      name="trigger_type"
                      type="radio"
                      value="schedule"
                      checked={formData.trigger_type === 'schedule'}
                      onChange={handleChange}
                      className="h-4 w-4 text-cronbat-600 focus:ring-cronbat-500 border-gray-300"
                    />
                    <label htmlFor="trigger-schedule" className="ml-3 block text-sm font-medium text-gray-700">
                      Schedule (Cron)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="trigger-dependency"
                      name="trigger_type"
                      type="radio"
                      value="dependency"
                      checked={formData.trigger_type === 'dependency'}
                      onChange={handleChange}
                      className="h-4 w-4 text-cronbat-600 focus:ring-cronbat-500 border-gray-300"
                    />
                    <label htmlFor="trigger-dependency" className="ml-3 block text-sm font-medium text-gray-700">
                      After successful job execution
                    </label>
                  </div>
                </div>
              </div>

              {formData.trigger_type === 'schedule' && (
                <div>
                  <label
                    htmlFor="schedule"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Schedule (Cron Expression)
                  </label>
                  <input
                    type="text"
                    name="schedule"
                    id="schedule"
                    value={formData.schedule}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm ${
                      errors.schedule
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-cronbat-500 focus:ring-cronbat-500'
                    }`}
                    placeholder="0 0 * * *"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Format: minute hour day-of-month month day-of-week
                  </p>
                  {errors.schedule && (
                    <p className="mt-2 text-sm text-red-600">{errors.schedule}</p>
                  )}
                </div>
              )}

              {formData.trigger_type === 'dependency' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Run after successful completion of:
                  </label>
                  <div className="mt-2 border border-gray-300 rounded-md p-4 max-h-60 overflow-y-auto">
                    {isLoading ? (
                      <div className="text-center py-4">
                        <svg className="animate-spin h-5 w-5 text-cronbat-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">Loading jobs...</p>
                      </div>
                    ) : jobs.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">No jobs available to select as dependencies.</p>
                    ) : (
                      <div className="space-y-2">
                        {jobs.map(job => (
                          <div key={job.id} className="flex items-start">
                            <input
                              id={`job-${job.id}`}
                              type="checkbox"
                              value={job.id}
                              onChange={handleParentJobChange}
                              checked={selectedParentJobs.includes(job.id)}
                              className="h-4 w-4 text-cronbat-600 focus:ring-cronbat-500 border-gray-300 rounded mt-1"
                            />
                            <label htmlFor={`job-${job.id}`} className="ml-3 text-sm">
                              <span className="font-medium text-gray-700">{job.name}</span>
                              <p className="text-gray-500">{job.command}</p>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.parent_jobs && (
                    <p className="mt-2 text-sm text-red-600">{errors.parent_jobs}</p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cronbat-500 focus:ring-cronbat-500"
                  placeholder="Daily backup of database files"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cronbat-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cronbat-600 hover:bg-cronbat-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cronbat-500"
                >
                  {isSubmitting ? 'Creating...' : 'Create Job'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateJob;
