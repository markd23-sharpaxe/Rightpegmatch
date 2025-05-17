// API utilities for connecting to your Replit backend

// Store API connectivity status
let isConnected = null;
let connectionTestInProgress = false;
let lastConnectionTime = null;
let connectionErrorMessage = null;

// Try to get the API URL from various sources with explicit logging for debugging
let API_URL;

// Look for the API URL in various places
function determineApiUrl() {
  try {
    // Check for query parameter (highest priority for testing)
    const queryParams = new URLSearchParams(window.location.search);
    const queryApiUrl = queryParams.get('api_url');
    
    // Check for environment variables
    const envApiUrl = import.meta.env?.VITE_API_URL;
    
    // Check for localStorage (for saved overrides)
    let localStorageApiUrl = null;
    try {
      localStorageApiUrl = localStorage.getItem('custom_api_url');
    } catch (e) {
      console.warn('Could not access localStorage:', e);
    }
    
    // Log all potential sources
    console.log('API URL Sources:');
    console.log('- Query parameter:', queryApiUrl);
    console.log('- Environment variable:', envApiUrl);
    console.log('- Local storage:', localStorageApiUrl);
    
    // Use first available in priority order
    const selectedUrl = queryApiUrl || envApiUrl || localStorageApiUrl || 'https://remote-match-maker-markdurno-markdurno.replit.app/api';
    console.log('Selected API URL:', selectedUrl);
    
    // Clean up URL (remove trailing slash if present)
    return selectedUrl.endsWith('/') ? selectedUrl.slice(0, -1) : selectedUrl;
  } catch (error) {
    console.error('Error determining API URL:', error);
    return 'https://remote-match-maker-markdurno-markdurno.replit.app/api';
  }
}

// Set initial API URL
API_URL = determineApiUrl();

/**
 * Tests if the API is accessible
 */
export async function testApiConnection() {
  if (connectionTestInProgress) return;
  
  connectionTestInProgress = true;
  
  try {
    console.log(`Testing API connection to ${API_URL}/jobs`);
    const start = Date.now();
    
    const response = await fetch(`${API_URL}/jobs`, {
      method: 'HEAD',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const elapsed = Date.now() - start;
    
    if (response.ok) {
      isConnected = true;
      lastConnectionTime = new Date();
      connectionErrorMessage = null;
      console.log(`✅ API connection successful (${elapsed}ms)`);
    } else {
      isConnected = false;
      connectionErrorMessage = `API returned status ${response.status} ${response.statusText}`;
      console.error(`❌ API connection failed: ${connectionErrorMessage}`);
    }
  } catch (error) {
    isConnected = false;
    connectionErrorMessage = error.message;
    console.error('❌ API connection error:', error);
    
    // Add more debugging info
    if (error.message.includes('Failed to fetch')) {
      console.error('👉 This likely indicates a network error, CORS issue, or the API server is down');
    } else if (error.message.includes('NetworkError')) {
      console.error('👉 This is likely a CORS error. Check that the API server allows requests from this origin');
    } 
  } finally {
    connectionTestInProgress = false;
  }
  
  return isConnected;
}

// Test connection as soon as loaded
testApiConnection();

/**
 * Make an API request with proper error handling
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  console.log(`📡 Sending API request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      mode: 'cors', // Explicitly request CORS mode
    });

    // Update our connection status if this worked
    if (response.ok) {
      isConnected = true;
      lastConnectionTime = new Date();
      connectionErrorMessage = null;
      console.log(`✅ API request succeeded: ${url}`);
    } else {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      isConnected = false;
      connectionErrorMessage = `API returned status ${response.status} ${response.statusText}`;
      
      // Try to parse error response
      const errorData = await response.json().catch(() => ({
        message: 'An unknown error occurred',
      }));
      throw new Error(errorData.message || 'Request failed');
    }

    return response.json();
  } catch (error) {
    console.error('📡 API request error:', error);
    isConnected = false;
    connectionErrorMessage = error.message;
    
    // Add more debugging info
    if (error.message.includes('Failed to fetch')) {
      console.error('👉 This likely indicates a network error, CORS issue, or the API server is down');
    } else if (error.message.includes('NetworkError')) {
      console.error('👉 This is likely a CORS error. Check that the API server allows requests from this origin');
    }
    
    throw error;
  }
}

/**
 * Get the API connection status
 */
export function getApiConnectionStatus() {
  return {
    isConnected,
    lastConnectionTime,
    errorMessage: connectionErrorMessage
  };
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