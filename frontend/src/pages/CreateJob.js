import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '../services/api';

function CreateJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    command: '',
    schedule: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.command.trim()) {
      newErrors.command = 'Command is required';
    }

    if (!formData.schedule.trim()) {
      newErrors.schedule = 'Schedule is required';
    } else if (!isValidCronExpression(formData.schedule)) {
      newErrors.schedule = 'Invalid cron expression';
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
      const response = await createJob(formData);
      navigate(`/jobs/${response.job_id}`);
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
