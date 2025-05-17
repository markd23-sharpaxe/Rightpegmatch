// API Diagnostic Utilities for debugging connection issues
// Include this file in your Netlify project to help diagnose API connection issues

/**
 * Tests and diagnoses connectivity to your API
 */
export async function testApiConnectivity(apiUrl) {
  const results = {
    success: false,
    apiUrl: apiUrl,
    corsStatus: null,
    endpoints: {},
    errors: [],
    recommendations: []
  };

  console.log('🔍 Testing API connectivity to:', apiUrl);

  // 1. Basic API URL validation
  if (!apiUrl || typeof apiUrl !== 'string') {
    results.errors.push('Invalid API URL: URL must be a non-empty string');
    results.recommendations.push('Check your environment variables and make sure VITE_API_URL is properly set');
    return results;
  }

  // Clean the API URL
  const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  results.apiUrl = cleanApiUrl;

  // 2. Test CORS and base connectivity
  try {
    const testEndpoints = [
      { path: '/jobs', name: 'Jobs API' },
      { path: '/user', name: 'User API' }
    ];

    // Test each endpoint
    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing ${endpoint.name} at ${cleanApiUrl}${endpoint.path}`);
        
        const response = await fetch(`${cleanApiUrl}${endpoint.path}`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });

        results.endpoints[endpoint.path] = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };

        if (response.ok) {
          try {
            const data = await response.json();
            results.endpoints[endpoint.path].dataReceived = true;
            results.endpoints[endpoint.path].dataCount = Array.isArray(data) ? data.length : 'N/A';
          } catch (e) {
            results.endpoints[endpoint.path].dataReceived = false;
            results.endpoints[endpoint.path].parseError = e.message;
          }
        }
      } catch (endpointError) {
        results.endpoints[endpoint.path] = {
          error: endpointError.message,
          ok: false
        };
        
        if (endpointError.message.includes('CORS')) {
          results.corsStatus = 'failed';
          results.errors.push(`CORS error accessing ${endpoint.path}: ${endpointError.message}`);
          results.recommendations.push('Add appropriate CORS headers to your API server');
        }
      }
    }

    // All endpoints tested, check overall success 
    const anyEndpointSucceeded = Object.values(results.endpoints).some(e => e.ok);
    if (anyEndpointSucceeded) {
      results.success = true;
      results.corsStatus = 'success';
    } else {
      results.success = false;
      results.errors.push('All API endpoints failed');
      
      if (results.corsStatus !== 'failed') {
        results.corsStatus = 'unknown';
        results.recommendations.push('Check if the API server is running and accessible');
      }
    }

  } catch (error) {
    results.success = false;
    results.errors.push(`General connectivity error: ${error.message}`);
    
    if (error.message.includes('Failed to fetch')) {
      results.recommendations.push('Check if the API server is running');
      results.recommendations.push('Verify there are no network issues or firewalls blocking access');
    }
  }

  // Final recommendations if we have errors but no specific recommendations yet
  if (results.errors.length > 0 && results.recommendations.length === 0) {
    results.recommendations.push('Check network connectivity');
    results.recommendations.push('Verify API server is running');
    results.recommendations.push('Ensure CORS is properly configured on the API server');
  }

  console.log('API Connectivity Test Results:', results);
  return results;
}

/**
 * Renders diagnostic results to a HTML element
 */
export function renderDiagnosticResults(results, targetElement) {
  if (!targetElement) return;
  
  const container = document.createElement('div');
  container.className = 'api-diagnostics';
  
  // Style
  container.innerHTML = `
    <style>
      .api-diagnostics {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        max-width: 800px;
      }
      .api-diagnostics h2 {
        margin-top: 0;
        color: #111827;
      }
      .api-diagnostics .success {
        color: #047857;
        font-weight: bold;
      }
      .api-diagnostics .error {
        color: #B91C1C;
        font-weight: bold;
      }
      .api-diagnostics .warning {
        color: #D97706;
        font-weight: bold;
      }
      .api-diagnostics table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }
      .api-diagnostics th, .api-diagnostics td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid #e5e7eb;
      }
      .api-diagnostics th {
        background-color: #f3f4f6;
      }
      .api-diagnostics ul {
        padding-left: 20px;
      }
    </style>
  `;
  
  // Header
  const header = document.createElement('h2');
  header.textContent = 'API Connectivity Diagnostic Results';
  container.appendChild(header);
  
  // Overall Status
  const status = document.createElement('p');
  status.innerHTML = `Overall Status: <span class="${results.success ? 'success' : 'error'}">${results.success ? 'Connected' : 'Connection Issues'}</span>`;
  container.appendChild(status);
  
  // API URL
  const apiUrl = document.createElement('p');
  apiUrl.innerHTML = `API URL: <code>${results.apiUrl || 'Not specified'}</code>`;
  container.appendChild(apiUrl);
  
  // CORS Status
  if (results.corsStatus) {
    const cors = document.createElement('p');
    cors.innerHTML = `CORS Status: <span class="${results.corsStatus === 'success' ? 'success' : 'error'}">${
      results.corsStatus === 'success' ? 'Working' : 
      results.corsStatus === 'failed' ? 'Failed' : 'Unknown'
    }</span>`;
    container.appendChild(cors);
  }
  
  // Endpoints Table
  if (Object.keys(results.endpoints).length > 0) {
    const endpointSection = document.createElement('div');
    
    const title = document.createElement('h3');
    title.textContent = 'Endpoint Tests';
    endpointSection.appendChild(title);
    
    const table = document.createElement('table');
    
    // Header row
    const headerRow = document.createElement('tr');
    ['Endpoint', 'Status', 'Result', 'Details'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Data rows
    Object.entries(results.endpoints).forEach(([path, data]) => {
      const row = document.createElement('tr');
      
      // Endpoint
      const endpointCell = document.createElement('td');
      endpointCell.innerHTML = `<code>${path}</code>`;
      row.appendChild(endpointCell);
      
      // Status
      const statusCell = document.createElement('td');
      statusCell.textContent = data.status || 'Error';
      row.appendChild(statusCell);
      
      // Result
      const resultCell = document.createElement('td');
      if (data.ok) {
        resultCell.innerHTML = `<span class="success">Success</span>`;
      } else {
        resultCell.innerHTML = `<span class="error">Failed</span>`;
      }
      row.appendChild(resultCell);
      
      // Details
      const detailsCell = document.createElement('td');
      if (data.error) {
        detailsCell.textContent = data.error;
      } else if (data.dataReceived) {
        detailsCell.textContent = `Received data (${data.dataCount} items)`;
      } else if (data.parseError) {
        detailsCell.textContent = `Response received but JSON parse error: ${data.parseError}`;
      } else {
        detailsCell.textContent = data.statusText || 'Unknown error';
      }
      row.appendChild(detailsCell);
      
      table.appendChild(row);
    });
    
    endpointSection.appendChild(table);
    container.appendChild(endpointSection);
  }
  
  // Errors List
  if (results.errors.length > 0) {
    const errorSection = document.createElement('div');
    
    const title = document.createElement('h3');
    title.textContent = 'Errors';
    errorSection.appendChild(title);
    
    const list = document.createElement('ul');
    results.errors.forEach(error => {
      const item = document.createElement('li');
      item.textContent = error;
      list.appendChild(item);
    });
    
    errorSection.appendChild(list);
    container.appendChild(errorSection);
  }
  
  // Recommendations
  if (results.recommendations.length > 0) {
    const recSection = document.createElement('div');
    
    const title = document.createElement('h3');
    title.textContent = 'Recommendations';
    recSection.appendChild(title);
    
    const list = document.createElement('ul');
    results.recommendations.forEach(rec => {
      const item = document.createElement('li');
      item.textContent = rec;
      list.appendChild(item);
    });
    
    recSection.appendChild(list);
    container.appendChild(recSection);
  }

  targetElement.innerHTML = '';
  targetElement.appendChild(container);
}