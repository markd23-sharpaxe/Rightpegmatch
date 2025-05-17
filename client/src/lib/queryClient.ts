import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get the base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Track connection status
let isConnected = false;
let connectionCheckedAt = 0;
let connectionListeners: Array<(connected: boolean) => void> = [];

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * JSONP Request - Make an API request using JSONP technique
 * This bypasses CORS by using script tags
 */
export function jsonpRequest<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    // Create a unique callback name with a timestamp
    const callbackName = 'jsonpCallback_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    
    // Process the path to ensure proper formatting
    const endpoint = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    // Add the callback to window
    (window as any)[callbackName] = function(data: T) {
      // Clean up
      document.body.removeChild(script);
      delete (window as any)[callbackName];
      
      // Resolve with data
      resolve(data);
    };
    
    // Prepare query params
    const queryParams = `callback=${callbackName}&t=${Date.now()}`; // Cache busting
    
    // Create script element
    const script = document.createElement('script');
    script.src = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${queryParams}`;
    
    // Set timeout (10 seconds)
    const timeoutId = setTimeout(() => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
        delete (window as any)[callbackName];
        reject(new Error('Request timed out after 10 seconds'));
      }
    }, 10000);
    
    // Handle load error
    script.onerror = () => {
      clearTimeout(timeoutId);
      document.body.removeChild(script);
      delete (window as any)[callbackName];
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
export function imageRequest(path: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Process the path to ensure proper formatting
    const endpoint = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    img.onload = function() {
      resolve(true);
    };
    
    img.onerror = function() {
      // Even on error, this confirms the server is reachable
      // We just can't read the response data
      resolve(true);
    };
    
    // Set source with cache-busting query param
    img.src = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
    
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
 * Proxy Request - Make a request through a CORS proxy
 * This is a fallback method when direct requests fail
 */
export async function proxyRequest<T>(path: string): Promise<T> {
  const CORS_PROXY = 'https://api.allorigins.win/get?url=';
  
  // Process the path to ensure proper formatting
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const url = encodeURIComponent(fullUrl);
  
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
      return data.contents as unknown as T;
    }
  }
  
  throw new Error('Invalid response from proxy');
}

/**
 * Enhanced API request that tries multiple connection strategies
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Construct the full URL if it's a relative path
  const fullUrl = url.startsWith('http') 
    ? url
    : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
    
  try {
    // First try standard request
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    isConnected = true;
    notifyConnectionListeners(true);
    return res;
  } catch (error) {
    console.error(`Standard API request failed: ${error}`);
    isConnected = false;
    notifyConnectionListeners(false);
    
    // For non-GET requests or requests with data, we can't use alternative methods
    if (method !== 'GET' || data) {
      throw error;
    }
    
    // Try alternative methods for GET requests
    try {
      // Create a Response-like object from alternative methods
      const result = await createResponseFromAlternativeMethods(url);
      isConnected = true;
      notifyConnectionListeners(true);
      return result;
    } catch (fallbackError) {
      console.error(`All connection methods failed: ${fallbackError}`);
      isConnected = false;
      notifyConnectionListeners(false);
      throw error; // Throw the original error
    }
  }
}

/**
 * Create a Response-like object from alternative connection methods
 */
async function createResponseFromAlternativeMethods(url: string): Promise<Response> {
  // Try JSONP first
  try {
    const jsonpData = await jsonpRequest<any>(url);
    return new Response(JSON.stringify(jsonpData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (jsonpError) {
    console.log('JSONP request failed:', jsonpError);
  }
  
  // Then try proxy
  try {
    const proxyData = await proxyRequest<any>(url);
    return new Response(JSON.stringify(proxyData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (proxyError) {
    console.log('Proxy request failed:', proxyError);
  }
  
  // Image request can only check connectivity, not return data
  try {
    const connected = await imageRequest('/ping-image');
    if (connected) {
      throw new Error('Connection works but cannot retrieve data');
    }
  } catch (imageError) {
    console.log('Image request failed:', imageError);
  }
  
  throw new Error('All alternative connection methods failed');
}

/**
 * Check API connection status by trying ping endpoints
 */
export async function checkApiConnection(): Promise<boolean> {
  // Only check every 30 seconds at most
  const now = Date.now();
  if (now - connectionCheckedAt < 30000 && connectionCheckedAt > 0) {
    return isConnected;
  }
  
  connectionCheckedAt = now;
  
  try {
    // Try multiple connection methods in sequence
    try {
      // Standard fetch first
      await fetch(`${API_BASE_URL}/ping-test?t=${Date.now()}`, {
        method: 'GET',
        credentials: 'include'
      });
      isConnected = true;
      notifyConnectionListeners(true);
      return true;
    } catch (fetchError) {
      // Then try JSONP
      try {
        await jsonpRequest('/ping-jsonp');
        isConnected = true;
        notifyConnectionListeners(true);
        return true;
      } catch (jsonpError) {
        // Then try image loading
        try {
          await imageRequest('/ping-image');
          isConnected = true;
          notifyConnectionListeners(true);
          return true;
        } catch (imageError) {
          isConnected = false;
          notifyConnectionListeners(false);
          return false;
        }
      }
    }
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
export function getConnectionStatus(): boolean {
  return isConnected;
}

/**
 * Subscribe to connection status changes
 */
export function onConnectionStatusChange(callback: (connected: boolean) => void): () => void {
  connectionListeners.push(callback);
  
  // Return an unsubscribe function
  return function unsubscribe() {
    connectionListeners = connectionListeners.filter(cb => cb !== callback);
  };
}

/**
 * Notify all listeners of connection status changes
 */
function notifyConnectionListeners(status: boolean): void {
  connectionListeners.forEach(callback => {
    try {
      callback(status);
    } catch (error) {
      console.error('Error in connection status listener:', error);
    }
  });
}

/**
 * Start monitoring the API connection
 */
export function startConnectionMonitoring(intervalMs = 30000): void {
  // Check immediately
  checkApiConnection();
  
  // Then check periodically
  setInterval(checkApiConnection, intervalMs);
}

// Enhanced query function that uses multiple connection strategies
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      let url = '';
      if (Array.isArray(queryKey) && queryKey.length > 0) {
        url = queryKey[0] as string;
      } else {
        throw new Error('Invalid query key - expected an array with at least one element');
      }
      
      try {
        // First try standard fetch
        const fullUrl = url.startsWith('http') 
          ? url
          : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
        
        const res = await fetch(fullUrl, {
          credentials: "include",
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        await throwIfResNotOk(res);
        isConnected = true;
        notifyConnectionListeners(true);
        return await res.json();
      } catch (fetchError) {
        console.log('Standard fetch failed, trying alternative methods:', fetchError);
        isConnected = false;
        notifyConnectionListeners(false);
        
        // Try alternative methods
        // First try JSONP as it's most reliable for cross-origin
        try {
          const data = await jsonpRequest<T>(url);
          isConnected = true;
          notifyConnectionListeners(true);
          return data;
        } catch (jsonpError) {
          console.log('JSONP request failed:', jsonpError);
          
          // Then try proxy as last resort
          try {
            const data = await proxyRequest<T>(url);
            isConnected = true;
            notifyConnectionListeners(true);
            return data;
          } catch (proxyError) {
            console.log('Proxy request failed:', proxyError);
            throw fetchError; // Throw original error after all methods fail
          }
        }
      }
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  };

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

// Start connection monitoring
startConnectionMonitoring();
