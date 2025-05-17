import { useEffect, useState } from 'react';
import { Route, Switch } from 'wouter';
import { fetchCurrentUser, testApiConnection, getApiConnectionStatus } from './api';
import { createApiStatusIndicator } from './api-connection-status';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState({ isConnected: null, errorMessage: null });

  useEffect(() => {
    // Initialize API status indicator
    const statusIndicator = createApiStatusIndicator({
      position: 'bottom-right',
      showDetails: true,
      autoHide: true
    });

    // Test API connection
    testApiConnection().then(isConnected => {
      setApiStatus(getApiConnectionStatus());
    });

    // Check API connection every 30 seconds
    const intervalId = setInterval(() => {
      testApiConnection().then(() => {
        setApiStatus(getApiConnectionStatus());
      });
    }, 30000);

    return () => {
      clearInterval(intervalId);
      if (statusIndicator && statusIndicator.remove) {
        statusIndicator.remove();
      }
    };
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await fetchCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-indigo-600">Right Peg Match</h1>
          </div>
          <nav className="flex space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Welcome, {user.username}!</span>
                <button 
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                  onClick={async () => {
                    try {
                      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
                      setUser(null);
                    } catch (error) {
                      console.error('Failed to logout:', error);
                    }
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <a href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                Login / Register
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Switch>
          <Route path="/">
            <HomePage />
          </Route>
          <Route path="/login">
            {user ? <Redirect to="/" /> : <LoginPage onLogin={setUser} />}
          </Route>
          <Route>
            <NotFoundPage />
          </Route>
        </Switch>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Right Peg Match. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function HomePage() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  
  useEffect(() => {
    // Get initial connection status
    setConnectionStatus(getApiConnectionStatus());
    
    // Update status when it changes
    const checkInterval = setInterval(() => {
      setConnectionStatus(getApiConnectionStatus());
    }, 5000);
    
    return () => clearInterval(checkInterval);
  }, []);
  
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Find Your Perfect Remote Job Match
      </h1>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
        Connect with global remote opportunities that match your skills and experience.
      </p>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 max-w-3xl mx-auto">
        <p className="text-lg text-gray-800 mb-4">
          Right Peg Match is connecting to the Replit backend at:<br />
          <code className="bg-gray-100 px-2 py-1 rounded text-indigo-600">
            {import.meta.env.VITE_API_URL || "https://remote-match-maker-markdurno-markdurno.replit.app/api"}
          </code>
        </p>
        
        <div className="mt-4 mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${
            connectionStatus?.isConnected ? 'bg-green-100 text-green-800' : 
            connectionStatus?.isConnected === false ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
              connectionStatus?.isConnected ? 'bg-green-500' : 
              connectionStatus?.isConnected === false ? 'bg-red-500' : 'bg-yellow-500'
            }`}></span>
            <span>
              {connectionStatus?.isConnected ? 'API Connected' : 
               connectionStatus?.isConnected === false ? 'API Disconnected' : 'Checking connection...'}
            </span>
          </div>
          
          {connectionStatus?.errorMessage && (
            <p className="text-red-600 text-sm mt-2">
              Error: {connectionStatus.errorMessage}
            </p>
          )}
          
          {connectionStatus?.lastConnectionTime && connectionStatus.isConnected && (
            <p className="text-green-600 text-sm mt-2">
              Last successful connection: {connectionStatus.lastConnectionTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="flex justify-center mt-4">
          <button 
            onClick={() => testApiConnection().then(() => setConnectionStatus(getApiConnectionStatus()))}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Test API Connection
          </button>
        </div>
        
        <p className="text-gray-600 mt-4">
          This frontend is deployed on Netlify and communicates with the Replit backend via API calls.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">API Diagnostic Tools</h2>
        <div className="flex justify-center space-x-4">
          <a 
            href="/api-test.html" 
            target="_blank"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Open API Test Page
          </a>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Login to Your Account
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Login functionality will connect to the Replit backend
      </p>
      <div className="text-center">
        <a href="/" className="text-indigo-600 hover:text-indigo-800 text-sm">
          Back to Home
        </a>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
      <p className="text-xl text-gray-600 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <a href="/" className="text-indigo-600 hover:text-indigo-800">
        Go back home
      </a>
    </div>
  );
}

function Redirect({ to }) {
  useEffect(() => {
    window.location.href = to;
  }, [to]);
  return null;
}

export default App;