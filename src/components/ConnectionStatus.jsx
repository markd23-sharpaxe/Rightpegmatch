import React, { useState, useEffect } from 'react';

/**
 * ConnectionStatus component displays the current API connection status
 * and provides helpful information when disconnected
 */
function ConnectionStatus({ connected }) {
  const [visible, setVisible] = useState(true);
  
  // Hide the connection status after 5 seconds when connected
  useEffect(() => {
    let timeoutId;
    
    if (connected) {
      timeoutId = setTimeout(() => {
        setVisible(false);
      }, 5000);
    } else {
      setVisible(true);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [connected]);
  
  if (!visible) return null;
  
  return (
    <div 
      className={`connection-status ${connected ? 'online' : 'offline'} 
                  mb-4 p-3 rounded-md flex items-center justify-between`}
    >
      <div className="flex items-center">
        <div 
          className={`h-2 w-2 rounded-full mr-2 ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span>
          {connected 
            ? 'Connected to backend API' 
            : 'Unable to connect to backend API'
          }
        </span>
      </div>
      
      {!connected && (
        <div className="text-sm">
          <span>
            The server may be down or restarting. 
            <button 
              className="ml-2 underline"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
          </span>
        </div>
      )}
      
      {connected && (
        <button 
          className="text-sm opacity-50 hover:opacity-100"
          onClick={() => setVisible(false)}
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

export default ConnectionStatus;