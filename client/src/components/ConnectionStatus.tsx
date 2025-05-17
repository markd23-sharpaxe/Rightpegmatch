import React, { useState, useEffect } from 'react';
import { checkApiConnection, onConnectionStatusChange } from '../lib/queryClient';

interface ConnectionStatusProps {
  className?: string;
}

/**
 * ConnectionStatus component
 * 
 * Displays the current connection status to the backend API
 * Will automatically hide when connected after a few seconds
 */
export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // Check connection status immediately
    checkApiConnection().then(status => {
      setIsConnected(status);
    });
    
    // Subscribe to connection status changes
    const unsubscribe = onConnectionStatusChange(connected => {
      setIsConnected(connected);
      setVisible(true); // Always show when status changes
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Hide the indicator after 5 seconds when connected
  useEffect(() => {
    let timeoutId: number | undefined;
    
    if (isConnected) {
      timeoutId = window.setTimeout(() => {
        setVisible(false);
      }, 5000);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isConnected]);
  
  if (!visible || isConnected === null) {
    return null;
  }
  
  return (
    <div className={`p-2 rounded-md text-sm flex items-center justify-between ${className} ${
      isConnected 
        ? 'bg-green-50 text-green-700 border border-green-100'
        : 'bg-red-50 text-red-700 border border-red-100'
    }`}>
      <div className="flex items-center gap-2">
        <div 
          className={`h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span>
          {isConnected 
            ? 'Connected to backend API' 
            : 'Unable to connect to backend API'
          }
        </span>
      </div>
      
      {!isConnected && (
        <button 
          className="text-red-700 hover:underline text-xs"
          onClick={() => checkApiConnection()}
        >
          Try again
        </button>
      )}
      
      {isConnected && (
        <button 
          className="text-green-700 hover:underline text-xs"
          onClick={() => setVisible(false)}
        >
          Dismiss
        </button>
      )}
    </div>
  );
}