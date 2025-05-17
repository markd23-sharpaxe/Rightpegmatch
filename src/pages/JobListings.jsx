import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { fetchJobs } from '../api-client';

function JobListings() {
  const [filters, setFilters] = useState({
    search: '',
    remote: true,
    category: 'all'
  });
  
  // Fetch jobs with React Query
  const { data: jobs, error, isLoading } = useQuery(
    ['jobs', filters],
    () => fetchJobs(filters),
    {
      // Fall back to empty array if the API call fails
      onError: (err) => {
        console.error('Failed to fetch jobs:', err);
      }
    }
  );
  
  // Update filters
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-6">Remote Job Listings</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col space-y-4 w-full max-w-2xl">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show friendly error message if there was a problem
  if (error) {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-6">Remote Job Listings</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>There was a problem loading the job listings. Please try again later.</p>
          <p className="text-sm mt-2">Technical details: {error.message}</p>
        </div>
      </div>
    );
  }
  
  // Fallback to empty array if API data fails
  const jobListings = jobs || [];
  
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Remote Job Listings</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-md shadow-sm mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search job title or skills..."
              className="input"
            />
          </div>
          
          <div className="w-40">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="all">All Categories</option>
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="management">Management</option>
              <option value="support">Support</option>
            </select>
          </div>
          
          <div className="w-40 flex items-end">
            <label className="flex items-center mb-1">
              <input
                type="checkbox"
                name="remote"
                checked={filters.remote}
                onChange={handleFilterChange}
                className="mr-2 h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Remote Only</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Job listings */}
      {jobListings.length === 0 ? (
        <div className="bg-white rounded-md p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No job listings found</h3>
          <p className="text-gray-500">
            Try adjusting your filters or check back later for new opportunities.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobListings.map((job) => (
            <Link 
              key={job.id} 
              to={`/jobs/${job.id}`}
              className="block bg-white rounded-md p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {job.title}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    {job.company} • {job.location || 'Remote'}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills && job.skills.slice(0, 3).map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills && job.skills.length > 3 && (
                      <span className="text-gray-500 text-xs px-2 py-1">
                        +{job.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-gray-700 font-medium">
                    {job.salary || 'Competitive salary'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Posted {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'recently'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default JobListings;