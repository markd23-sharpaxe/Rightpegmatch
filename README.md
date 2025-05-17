# Right Peg Match - Netlify Frontend (Flat File Structure)

This is the frontend deployment package for Right Peg Match, a remote job marketplace that connects professionals with jobs that match their skills and availability.

## Deployment Instructions

### Deploy with Netlify (GitHub Integration)

1. Push this code to a GitHub repository
2. Log in to Netlify and click "Add new site" → "Import an existing project"
3. Connect your GitHub account and select this repository
4. Configure your build settings:
   - All settings should be automatically detected from the netlify.toml file
   - No build command is needed as this is a static site

### Alternative: Quick Deploy with Netlify Drop

If you prefer not to use GitHub:
1. Go to https://app.netlify.com/drop
2. Drag and drop this folder to the Netlify Drop interface
3. Configure your site settings after deployment

### Environment Variables

Make sure the following environment variable is set in your Netlify deployment settings:

- `VITE_API_URL`: The URL of the Replit backend API
  - Production value: `https://7a407b74-b1a3-43f7-bf8a-d00fad3554e3-00-15b02g7uh8r3y.riker.replit.dev/api`

This variable is already configured in the `netlify.toml` file but can be overridden in the Netlify dashboard if needed:
1. Go to Site settings → Build & deploy → Environment variables
2. Add or update the VITE_API_URL variable with your API endpoint

### Connection Testing

After deployment, you can test the API connection by:

1. Opening the deployed site
2. Checking the connection status indicator in the bottom right corner
3. For more detailed diagnostics, visit `/connection-test.html` on your deployed site

## Troubleshooting

If you encounter API connectivity issues:
1. Check that your Replit backend is running
2. Verify the API URL in the environment variable is correct
3. Look for CORS issues in the browser's developer console
4. Try the connection test tool at `/connection-test.html`

## Files in this Package

- `index.html`: Main landing page
- `connection-test.html`: API connection test and diagnostics tool
- `api-client.js`: API client for connecting to the backend
- `queryClient.js`: Handles API requests and connection status
- `netlify.toml`: Netlify configuration with environment variables and redirect rules
- `package.json`: Simple Node.js package configuration for Netlify