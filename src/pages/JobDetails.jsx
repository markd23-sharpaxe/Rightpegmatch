import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { fetchJob } from '../api-client';

function JobDetails() {
  const { id } = useParams();
  
  // Fetch job details
  const { data: job, error, isLoading } = useQuery(
    ['job', id],
    () => fetchJob(id),
    {
      onError: (err) => {
        console.error(`Failed to fetch job ${id}:`, err);
      }
    }
  );
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-40 bg-gray-200 rounded mb-6"></div>
          <div className="h-20 bg-gray-200 rounded mb-6"></div>
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }
  
  // Show friendly error message
  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>There was a problem loading the job details. Please try again later.</p>
          <p className="text-sm mt-2">Technical details: {error.message}</p>
          <Link to="/jobs" className="text-red-700 underline mt-4 inline-block">
            Back to job listings
          </Link>
        </div>
      </div>
    );
  }
  
  // Handle case when job is not found
  if (!job) {
    return (
      <div className="py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>Job not found. It may have been removed or is no longer available.</p>
          <Link to="/jobs" className="text-yellow-700 underline mt-4 inline-block">
            Back to job listings
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-8">
      <Link to="/jobs" className="text-blue-600 hover:underline mb-4 inline-flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to job listings
      </Link>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-lg text-gray-600 mt-1">{job.company}</p>
            <div className="flex items-center mt-2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{job.location || 'Remote'}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-medium text-gray-900">
              {job.salary || 'Competitive salary'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Posted {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'recently'}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 mb-6">
          {job.skills && job.skills.map((skill, index) => (
            <span 
              key={index}
              className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold mb-4">Job Description</h2>
          <div className="prose max-w-none">
            {job.description ? (
              <div dangerouslySetInnerHTML={{ __html: job.description }} />
            ) : (
              <p>No description provided for this position.</p>
            )}
          </div>
        </div>
        
        {job.requirements && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Requirements</h2>
            <ul className="list-disc pl-5 space-y-2">
              {job.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}
        
        {job.benefits && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Benefits</h2>
            <ul className="list-disc pl-5 space-y-2">
              {job.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">Interested in this position?</h2>
        <p className="text-blue-700 mb-4">
          Apply now to connect with {job.company} and explore this opportunity.
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => alert('Application functionality will be implemented soon!')}
        >
          Apply for this Position
        </button>
      </div>
    </div>
  );
}

export default JobDetails;