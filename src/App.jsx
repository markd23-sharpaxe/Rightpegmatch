import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { onConnectionStatusChange, getApiConnectionStatus } from './api-client';
import Home from './pages/Home';
import JobListings from './pages/JobListings';
import JobDetails from './pages/JobDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
  const [isConnected, setIsConnected] = useState(getApiConnectionStatus());
  const [user, setUser] = useState(null);
  const location = useLocation();
  
  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((connected) => {
      setIsConnected(connected);
    });
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);
  
  return (
    <div className="app">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Right Peg Match
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link
              to="/jobs"
              className={`text-gray-600 hover:text-blue-600 ${
                location.pathname.startsWith('/jobs') ? 'font-medium text-blue-600' : ''
              }`}
            >
              Jobs
            </Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Profile
                </Link>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    // Handle logout
                    setUser(null);
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className={`text-gray-600 hover:text-blue-600 ${
                    location.pathname === '/login' ? 'font-medium text-blue-600' : ''
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <ConnectionStatus connected={isConnected} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<JobListings />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/register" element={<Register onRegister={setUser} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Right Peg Match. All rights reserved.
              </p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;