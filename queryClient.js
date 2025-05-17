// API client with improved connectivity and error handling
import { QueryClient } from "@tanstack/react-query";

// Helper to determine API URL with multiple fallbacks
function determineApiUrl() {
  try {
    // Check URL parameters first (highest priority for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const urlParamApiUrl = urlParams.get('api_url');
    if (urlParamApiUrl) {
      console.log('Using API URL from URL parameter:', urlParamApiUrl);
      return urlParamApiUrl;
    }
    
    // Check environment variables
    if (import.meta.env?.VITE_API_URL) {
      console.log('Using API URL from environment variable:', import.meta.env.VITE_API_URL);
      return import.meta.env.VITE_API_URL;
    }
    
    // Check localStorage (for saved user preferences)
    try {
      const savedApiUrl = localStorage.getItem('api_url');
      if (savedApiUrl) {
        console.log('Using API URL from localStorage:', savedApiUrl);
        return savedApiUrl;
      }
    } catch (e) {
      console.warn('Could not access localStorage:', e);
    }
    
    // Fallback to hardcoded URL
    console.log('Using hardcoded API URL fallback');
    return 'https://7a407b74-b1a3-43f7-bf8a-d00fad3554e3-00-15b02g7uh8r3y.riker.replit.dev/api';
  } catch (error) {
    console.error('Error determining API URL, using fallback:', error);
    return 'https://7a407b74-b1a3-43f7-bf8a-d00fad3554e3-00-15b02g7uh8r3y.riker.replit.dev/api';
  }
}

// Get the base URL from environment variables with fallback
const API_BASE_URL = determineApiUrl();

// Remove trailing slash if present
const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Log the API URL for debugging
console.log('API Base URL:', baseUrl);

// Track connection status
let connectionStatus = {
  lastChecked: null,
  isConnected: null,
  error: null
};

// Throw error for non-ok responses
async function throwIfResNotOk(res) {
  if (!res.ok) {
    // Try to parse error message from response
    let errorMessage;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || `${res.status}: ${res.statusText}`;
    } catch (e) {
      errorMessage = `${res.status}: ${res.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
}

// General API request function with error handling and connection tracking
export async function apiRequest(method, url, data) {
  // Construct the full URL if it's a relative path
  const fullUrl = url.startsWith('http') 
    ? url
    : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    
  console.log(`📡 API ${method} request to: ${fullUrl}`);
  
  try {
    const startTime = Date.now();
    
    // Configure fetch options with proper CORS settings
    const options = {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      mode: "cors" // Explicit CORS mode
    };
    
    // Make the request
    const res = await fetch(fullUrl, options);
    
    // Calculate response time for logging
    const responseTime = Date.now() - startTime;
    
    // Update connection status
    connectionStatus = {
      lastChecked: new Date(),
      isConnected: res.ok,
      error: res.ok ? null : `HTTP ${res.status}: ${res.statusText}`
    };
    
    // Log response details
    if (res.ok) {
      console.log(`✅ API request succeeded (${responseTime}ms): ${fullUrl}`);
    } else {
      console.error(`❌ API request failed (${responseTime}ms): ${fullUrl} - ${res.status} ${res.statusText}`);
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Update connection status on error
    connectionStatus = {
      lastChecked: new Date(),
      isConnected: false,
      error: error.message
    };
    
    // Provide helpful debugging information
    console.error(`❌ API request error: ${error.message}`);
    
    if (error.message.includes('Failed to fetch')) {
      console.error('  → This may indicate a network error, CORS issue, or the API server is down');
      console.error('  → Check that the Replit server is running and accessible');
    } else if (error.message.includes('NetworkError')) {
      console.error('  → This is likely a CORS error. Check that the API server allows requests from this origin');
    }
    
    throw error;
  }
}

// Query function for React Query
const getQueryFn = (options) => async ({ queryKey }) => {
  try {
    let url = '';
    if (Array.isArray(queryKey) && queryKey.length > 0) {
      url = queryKey[0];
    } else {
      throw new Error('Invalid query key - expected an array with at least one element');
    }
    
    const res = await apiRequest('GET', url);
    
    // Special handling for 401 Unauthorized
    if (options.on401 === "returnNull" && res.status === 401) {
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Query error:', error);
    
    // Special handling for 401 Unauthorized
    if (options.on401 === "returnNull" && error.message.includes('401')) {
      return null;
    }
    
    throw error;
  }
};

// Preconfigured React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Export connection status check function
export function getConnectionStatus() {
  return connectionStatus;
}

// Simple API connection check
export async function checkApiConnection() {
  try {
    const response = await fetch(`${baseUrl}/ping`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    
    connectionStatus = {
      lastChecked: new Date(),
      isConnected: response.ok,
      error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
    };
    
    return connectionStatus.isConnected;
  } catch (error) {
    connectionStatus = {
      lastChecked: new Date(),
      isConnected: false,
      error: error.message
    };
    
    return false;
  }
}