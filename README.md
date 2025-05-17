# Right Peg Match - Netlify Frontend (Flat File Structure)

This is the frontend deployment package for Right Peg Match, a remote job marketplace that connects professionals with jobs that match their skills and availability.

## Deployment Instructions

### Quick Deploy with Netlify

1. Deploy this folder to Netlify using one of these methods:
   - Netlify CLI: `netlify deploy`
   - Netlify Drop: Drag and drop this folder to https://app.netlify.com/drop
   - GitHub Integration: Push this code to a GitHub repository and connect it to Netlify

### Environment Variables

Make sure the following environment variable is set in your Netlify deployment settings:

- `VITE_API_URL`: The URL of the Replit backend API
  - Production value: `https://7a407b74-b1a3-43f7-bf8a-d00fad3554e3-00-15b02g7uh8r3y.riker.replit.dev/api`

This variable is already configured in the `netlify.toml` file but can be overridden in the Netlify dashboard if needed.

### Connection Testing

After deployment, you can test the API connection by:

1. Opening the deployed site
2. Checking the connection status indicator in the bottom right corner
3. For more detailed diagnostics, visit `/connection-test.html` on your deployed site

## Files in this Package

- `index.html`: Main landing page
- `connection-test.html`: API connection test and diagnostics tool
- `api-client.js`: API client for connecting to the backend
- `queryClient.js`: Handles API requests and connection status
- `netlify.toml`: Netlify configuration with environment variables and redirect rules