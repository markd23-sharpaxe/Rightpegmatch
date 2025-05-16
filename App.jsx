import { useState, useEffect } from 'react'
import { Route, Switch, Link } from 'wouter'
import { useQuery } from '@tanstack/react-query'

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://remote-match-maker-markdurno-markdurno.replit.app/api'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-xl font-bold">Right Peg Match</div>
          <nav>
            <ul className="flex space-x-4">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li><Link href="/jobs" className="hover:underline">Jobs</Link></li>
              <li><Link href="/about" className="hover:underline">About</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/jobs" component={JobsPage} />
          <Route path="/about" component={AboutPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p>&copy; {new Date().getFullYear()} Right Peg Match. All rights reserved.</p>
            <p className="mt-2 text-gray-400">
              Find the perfect remote job match for your skills and availability.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Page Components
function HomePage() {
  return (
    <div className="space-y-8">
      <section className="bg-blue-50 rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">Find Your Perfect Remote Job Match</h1>
        <p className="text-xl text-gray-600 mb-6">
          Connect with employers looking for your unique skills and availability.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/jobs">
            <a className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium">
              Browse Jobs
            </a>
          </Link>
          <a href="#how-it-works" className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-6 py-2 rounded-md font-medium">
            How It Works
          </a>
        </div>
      </section>

      <section id="how-it-works" className="py-8">
        <h2 className="text-2xl font-bold text-center mb-8">How Right Peg Match Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 font-bold text-xl mb-3">1. Create Your Profile</div>
            <p className="text-gray-600">Add your skills, experience, and availability preferences to get matched with the right opportunities.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 font-bold text-xl mb-3">2. Get Matched</div>
            <p className="text-gray-600">Our AI-powered system finds jobs that align with your skills and schedule requirements.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 font-bold text-xl mb-3">3. Apply & Connect</div>
            <p className="text-gray-600">Apply to matched positions and connect directly with employers looking for someone like you.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function JobsPage() {
  // Example of fetching data from your Replit backend
  const { data: jobs, isLoading, error } = useQuery({ 
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/jobs`)
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      return response.json()
    }
  })

  if (isLoading) return <div className="text-center py-10">Loading jobs...</div>
  if (error) return <div className="text-center py-10 text-red-600">Error loading jobs: {error.message}</div>
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Available Jobs</h1>
      
      {jobs && jobs.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-blue-700">{job.title}</h2>
              <p className="text-gray-500 mb-3">{job.companyName}</p>
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded mr-2">
                  {job.salaryType === 'hourly' ? `$${job.hourlyRate}/hr` : `$${job.salaryAmount}/${job.salaryType}`}
                </span>
                <span className="inline-block bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
                  {job.hoursPerWeek} hrs/week
                </span>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-3">{job.description || "No description provided."}</p>
              <Link href={`/jobs/${job.id}`}>
                <a className="text-blue-600 hover:text-blue-800 font-medium">View Details &rarr;</a>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-100 rounded-lg">
          <p className="text-gray-600">No jobs found. Please check back later.</p>
        </div>
      )}
    </div>
  )
}

function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">About Right Peg Match</h1>
      <p className="text-gray-700 mb-4">
        Right Peg Match is a specialized job marketplace designed to connect skilled professionals with remote work opportunities that perfectly match their abilities and availability.
      </p>
      <p className="text-gray-700 mb-4">
        Our platform uses advanced AI-powered matching algorithms to ensure that job seekers find positions that align with their skills, experience, and schedule preferences, while employers connect with candidates who are the right fit for their needs.
      </p>
      <p className="text-gray-700 mb-8">
        Whether you're looking for full-time remote work, part-time gigs, or project-based opportunities, Right Peg Match helps you find the perfect professional match.
      </p>
      
      <div className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-blue-800 mb-3">Our Mission</h2>
        <p className="text-gray-700">
          To revolutionize how remote professionals connect with global work opportunities by creating perfect matches based on skills, experience, and availability.
        </p>
      </div>
    </div>
  )
}

function NotFoundPage() {
  return (
    <div className="text-center py-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">Page not found</p>
      <Link href="/">
        <a className="text-blue-600 hover:text-blue-800 font-medium">
          &larr; Return to Home
        </a>
      </Link>
    </div>
  )
}

export default App