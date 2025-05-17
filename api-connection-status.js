// API Connection Status Indicator Component
// Include this in your project to display API connection status

/**
 * Creates and injects an API status indicator into the page
 * @param {Object} options - Configuration options
 * @param {string} options.apiUrl - The API URL to test
 * @param {boolean} options.showDetails - Whether to show detailed information
 * @param {string} options.position - Position of the indicator ('top-right', 'bottom-right', etc.)
 */
export function createApiStatusIndicator(options = {}) {
  const {
    apiUrl = null,
    showDetails = true,
    position = 'top-right',
    autoHide = true,
    testEndpoint = '/jobs'
  } = options;
  
  // Create the status indicator element
  const container = document.createElement('div');
  container.className = 'api-status-indicator';
  container.dataset.position = position;
  
  // Set styles
  container.style.position = 'fixed';
  container.style.zIndex = '9999';
  container.style.padding = '10px';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  container.style.color = 'white';
  container.style.borderRadius = '4px';
  container.style.fontSize = '14px';
  container.style.transition = 'opacity 0.3s ease';
  
  // Set position
  if (position.includes('top')) {
    container.style.top = '10px';
  } else {
    container.style.bottom = '10px';
  }
  
  if (position.includes('right')) {
    container.style.right = '10px';
  } else {
    container.style.left = '10px';
  }
  
  // Set initial content
  container.innerHTML = `
    <div class="api-status-content">
      <div class="api-status-header">
        <span class="api-status-indicator-dot" style="
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: gray;
          margin-right: 6px;
        "></span>
        <span class="api-status-text">Testing API connection...</span>
      </div>
      <div class="api-status-details" style="
        margin-top: 8px;
        font-size: 12px;
        ${showDetails ? '' : 'display: none;'}
      ">
        <div>API URL: <code>${apiUrl || 'Using environment settings'}</code></div>
        <div class="api-status-message"></div>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(container);
  
  // Function to update the status
  function updateStatus(status, message = '') {
    const indicator = container.querySelector('.api-status-indicator-dot');
    const statusText = container.querySelector('.api-status-text');
    const statusMessage = container.querySelector('.api-status-message');
    
    if (status === 'connected') {
      indicator.style.backgroundColor = '#00c853'; // green
      statusText.textContent = 'API Connected';
      
      // Auto-hide after 5 seconds if requested
      if (autoHide) {
        setTimeout(() => {
          container.style.opacity = '0.2';
        }, 5000);
        
        // Show on hover
        container.addEventListener('mouseenter', () => {
          container.style.opacity = '1';
        });
        
        container.addEventListener('mouseleave', () => {
          container.style.opacity = '0.2';
        });
      }
    } else if (status === 'disconnected') {
      indicator.style.backgroundColor = '#f44336'; // red
      statusText.textContent = 'API Disconnected';
      container.style.opacity = '1'; // Always visible when disconnected
    } else if (status === 'testing') {
      indicator.style.backgroundColor = '#ffab00'; // amber
      statusText.textContent = 'Testing API connection...';
    }
    
    if (message) {
      statusMessage.textContent = message;
    }
  }
  
  // Function to test the API connection
  async function testConnection() {
    updateStatus('testing');
    
    try {
      const targetUrl = apiUrl 
        ? `${apiUrl}${testEndpoint}` 
        : `${window.API_URL || import.meta.env?.VITE_API_URL || ''}${testEndpoint}`;
        
      console.log(`Testing API connection to: ${targetUrl}`);
      
      const response = await fetch(targetUrl, {
        method: 'HEAD',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        updateStatus('connected', `Connected successfully (${new Date().toLocaleTimeString()})`);
        return true;
      } else {
        updateStatus('disconnected', `Error: Server returned ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error('API connection test failed:', error);
      updateStatus('disconnected', `Error: ${error.message}`);
      return false;
    }
  }
  
  // Initial test
  testConnection();
  
  // Periodic testing every 30 seconds
  const intervalId = setInterval(testConnection, 30000);
  
  // Return the API for controlling the indicator
  return {
    testNow: testConnection,
    remove: () => {
      clearInterval(intervalId);
      document.body.removeChild(container);
    },
    show: () => {
      container.style.display = 'block';
    },
    hide: () => {
      container.style.display = 'none';
    },
    setDetails: (visible) => {
      container.querySelector('.api-status-details').style.display = visible ? 'block' : 'none';
    }
  };
}

// Auto-initialize if the script is loaded directly
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Check if we should auto-initialize
    const autoInit = document.querySelector('script[data-api-status-auto-init="true"]');
    if (autoInit) {
      window.apiStatusIndicator = createApiStatusIndicator();
    }
  });
}