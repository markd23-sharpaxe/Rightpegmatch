// API client for connecting to the Replit backend
import { apiRequest, getConnectionStatus, checkApiConnection } from './queryClient.js';

// API Connection Status Monitor
let connectionMonitorInterval = null;
let connectionCallbacks = [];

// Initialize connection monitoring
function startConnectionMonitoring(intervalMs = 30000) {
  if (connectionMonitorInterval) {
    clearInterval(connectionMonitorInterval);
  }
  
  // First check immediately
  checkApiConnection().then(isConnected => {
    notifyConnectionCallbacks(isConnected);
  });
  
  // Set up recurring checks
  connectionMonitorInterval = setInterval(() => {
    checkApiConnection().then(isConnected => {
      notifyConnectionCallbacks(isConnected);
    });
  }, intervalMs);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (connectionMonitorInterval) {
      clearInterval(connectionMonitorInterval);
    }
  });
}

// Notify connection status callbacks
function notifyConnectionCallbacks(isConnected) {
  connectionCallbacks.forEach(callback => {
    try {
      callback(isConnected);
    } catch (error) {
      console.error('Error in connection status callback:', error);
    }
  });
}

// Register a callback for connection status changes
export function onConnectionStatusChange(callback) {
  connectionCallbacks.push(callback);
  
  // If we haven't started monitoring yet, initialize it
  if (!connectionMonitorInterval) {
    startConnectionMonitoring();
  }
  
  // Return a function to unregister the callback
  return () => {
    connectionCallbacks = connectionCallbacks.filter(cb => cb !== callback);
  };
}

// API Data Fetching Functions

/**
 * Fetch jobs from the backend
 */
export async function fetchJobs(options = {}) {
  const queryParams = new URLSearchParams();
  
  // Add any filtering parameters
  if (options.query) queryParams.append('query', options.query);
  if (options.jobType) queryParams.append('jobType', options.jobType);
  if (options.minHours) queryParams.append('minHours', options.minHours);
  if (options.maxHours) queryParams.append('maxHours', options.maxHours);
  if (options.timeZoneOverlap) queryParams.append('timeZoneOverlap', options.timeZoneOverlap);
  
  const queryString = queryParams.toString();
  const endpoint = `/jobs${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiRequest('GET', endpoint);
  return response.json();
}

/**
 * Fetch a single job by ID
 */
export async function fetchJob(id) {
  const response = await apiRequest('GET', `/jobs/${id}`);
  return response.json();
}

/**
 * Fetch current user (if logged in)
 */
export async function fetchCurrentUser() {
  try {
    const response = await apiRequest('GET', '/user');
    return response.json();
  } catch (error) {
    if (error.message.includes('401')) {
      return null;
    }
    throw error;
  }
}

/**
 * Log in a user
 */
export async function login(username, password) {
  const response = await apiRequest('POST', '/auth/login', { username, password });
  return response.json();
}

/**
 * Register a new user
 */
export async function register(userData) {
  const response = await apiRequest('POST', '/auth/register', userData);
  return response.json();
}

/**
 * Log out the current user
 */
export async function logout() {
  const response = await apiRequest('POST', '/auth/logout');
  return response.json();
}

// Start connection monitoring when this module is imported
startConnectionMonitoring();