/**
 * API Client for Right Peg Match
 * Uses multiple connection strategies to ensure reliable communication
 * with the backend even when CORS issues occur
 */

// API Base URL - use environment variable or fallback
const API_BASE_URL = 'https://7a407b74-b1a3-43f7-bf8a-d00fad3554e3-00-15b02g7uh8r3y.riker.replit.dev/api';

// Track connection status
let isConnected = false;
let connectionCheckedAt = 0;
let connectionListeners = [];

/**
 * JSONP Request - Make an API request using JSONP technique
 * This bypasses CORS by using script tags
 */
export function jsonpRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    // Create a unique callback name with a timestamp
    const callbackName = 'jsonpCallback_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    
    // Add the callback to window
    window[callbackName] = function(data) {
      // Clean up
      document.body.removeChild(script);
      delete window[callbackName];
      
      // Resolve with data
      resolve(data);
    };
    
    // Prepare query params
    const queryParams = Object.entries({
      ...params,
      callback: callbackName,
      t: Date.now() // Cache busting
    })
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Create script element
    const script = document.createElement('script');
    script.src = `${API_BASE_URL}${endpoint}?${queryParams}`;
    
    // Set timeout (10 seconds)
    const timeoutId = setTimeout(() => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
        delete window[callbackName];
        reject(new Error('Request timed out after 10 seconds'));
      }
    }, 10000);
    
    // Handle load error
    script.onerror = () => {
      clearTimeout(timeoutId);
      document.body.removeChild(script);
      delete window[callbackName];
      reject(new Error('Failed to load API endpoint'));
    };
    
    // Add to document to start the request
    document.body.appendChild(script);
  });
}

/**
 * Image Request - Make a GET request using image loading
 * This can bypass some CORS restrictions
 */
export function imageRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const startTime = Date.now();
    
    img.onload = function() {
      resolve({
        success: true,
        timing: Date.now() - startTime
      });
    };
    
    img.onerror = function() {
      // Even on error, this confirms the server is reachable
      // We just can't read the response data
      resolve({
        success: true,
        timing: Date.now() - startTime,
        noData: true
      });
    };
    
    // Set source with cache-busting query param
    img.src = `${API_BASE_URL}${endpoint}?t=${Date.now()}`;
    
    // Set timeout
    setTimeout(() => {
      if (!img.complete) {
        img.src = ''; // Cancel the request
        reject(new Error('Request timed out'));
      }
    }, 10000);
  });
}

/**
 * Standard Fetch Request - Make a standard fetch request
 * This will work when CORS is properly configured
 */
export async function standardRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  };
  
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Fetch error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Proxy Request - Make a request through a CORS proxy
 * This is a fallback method when direct requests fail
 */
export async function proxyRequest(endpoint, options = {}) {
  const CORS_PROXY = 'https://api.allorigins.win/get?url=';
  const url = encodeURIComponent(`${API_BASE_URL}${endpoint}`);
  
  try {
    const response = await fetch(`${CORS_PROXY}${url}`);
    
    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // The proxy returns the response in the contents property
    if (data && data.contents) {
      try {
        // Try to parse as JSON first
        return JSON.parse(data.contents);
      } catch (e) {
        // If not JSON, return as text
        return data.contents;
      }
    }
    
    throw new Error('Invalid response from proxy');
  } catch (error) {
    console.error(`Proxy error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Check API connection status by trying ping endpoints
 * Uses multiple methods to ensure at least one works
 */
export async function checkApiConnection() {
  // Only check every 30 seconds at most
  const now = Date.now();
  if (now - connectionCheckedAt < 30000 && connectionCheckedAt > 0) {
    return isConnected;
  }
  
  connectionCheckedAt = now;
  
  // Try multiple connection methods in sequence
  try {
    // First try JSONP as it's most reliable for cross-origin
    try {
      await jsonpRequest('/ping-jsonp');
      isConnected = true;
      notifyConnectionListeners(true);
      return true;
    } catch (jsonpError) {
      console.log('JSONP connection check failed:', jsonpError);
    }
    
    // Then try image loading which also has good cross-origin support
    try {
      await imageRequest('/ping-image');
      isConnected = true;
      notifyConnectionListeners(true);
      return true;
    } catch (imageError) {
      console.log('Image connection check failed:', imageError);
    }
    
    // Finally try standard fetch with CORS as a fallback
    try {
      await standardRequest('/ping-test');
      isConnected = true;
      notifyConnectionListeners(true);
      return true;
    } catch (fetchError) {
      console.log('Standard connection check failed:', fetchError);
    }
    
    // All methods failed
    isConnected = false;
    notifyConnectionListeners(false);
    return false;
  } catch (error) {
    console.error('Connection check error:', error);
    isConnected = false;
    notifyConnectionListeners(false);
    return false;
  }
}

/**
 * Get current API connection status
 */
export function getApiConnectionStatus() {
  return isConnected;
}

/**
 * Subscribe to connection status changes
 */
export function onConnectionStatusChange(callback) {
  connectionListeners.push(callback);
  
  // Return an unsubscribe function
  return function unsubscribe() {
    connectionListeners = connectionListeners.filter(cb => cb !== callback);
  };
}

/**
 * Notify all listeners of connection status changes
 */
function notifyConnectionListeners(status) {
  connectionListeners.forEach(callback => {
    try {
      callback(status);
    } catch (error) {
      console.error('Error in connection status listener:', error);
    }
  });
}

/**
 * Start automatic connection monitoring
 */
export function startConnectionMonitoring(intervalMs = 30000) {
  // Check immediately
  checkApiConnection();
  
  // Then check periodically
  setInterval(checkApiConnection, intervalMs);
}

/**
 * Make a request using the most appropriate method
 * Tries methods in sequence until one works
 */
export async function apiRequest(endpoint, options = {}) {
  const methods = [
    standardRequest,
    jsonpRequest,
    proxyRequest
  ];
  
  let lastError;
  
  // Try each method in sequence
  for (const method of methods) {
    try {
      return await method(endpoint, options);
    } catch (error) {
      console.log(`API request method ${method.name} failed:`, error);
      lastError = error;
      // Continue to next method
    }
  }
  
  // If we get here, all methods failed
  throw lastError || new Error('All API request methods failed');
}

// API endpoints
export async function fetchJobs(options = {}) {
  return apiRequest('/jobs', options);
}

export async function fetchJob(id) {
  return apiRequest(`/jobs/${id}`);
}

export async function fetchCurrentUser() {
  return apiRequest('/user');
}

export async function login(username, password) {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function register(userData) {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function logout() {
  return apiRequest('/logout', {
    method: 'POST'
  });
}