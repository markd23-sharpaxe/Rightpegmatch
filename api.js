// API utilities for connecting to your Replit backend

const API_URL = import.meta.env.VITE_API_URL || 'https://remote-match-maker-markdurno-markdurno.replit.app/api';

/**
 * Make an API request with proper error handling
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'An unknown error occurred',
    }));
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json();
}

/**
 * Fetch jobs from the backend
 */
export async function fetchJobs() {
  return apiRequest('/jobs');
}

/**
 * Fetch a single job by ID
 */
export async function fetchJob(id) {
  return apiRequest(`/jobs/${id}`);
}

/**
 * Fetch current user (if logged in)
 */
export async function fetchCurrentUser() {
  return apiRequest('/user').catch(() => null);
}