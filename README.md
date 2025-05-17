# Right Peg Match - Frontend for Netlify

This is the frontend application for the Right Peg Match platform, designed to be deployed on Netlify and connect to a Replit backend.

## Features

- Reliable API connectivity using multiple connection strategies
- Complete job listing interface
- User authentication (login/register)
- Job details and application process
- Mobile-responsive design

## How it Works

This frontend application uses a multi-strategy approach to ensure reliable connectivity with the Replit backend:

1. **JSONP Connection** - Uses script tag insertion to bypass CORS restrictions
2. **Image Connection** - Uses image loading which has fewer CORS restrictions
3. **Standard Fetch** - Uses standard fetch requests when CORS is working properly
4. **Proxy Connection** - Falls back to a CORS proxy as a last resort

## Deployment Instructions

1. Upload this project to GitHub
2. Connect Netlify to your GitHub repository
3. Configure the following environment variables in Netlify:
   - `VITE_API_URL`: Your Replit backend URL (e.g., `https://your-replit-app.replit.dev/api`)

## Local Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- React
- React Router
- React Query
- Tailwind CSS
- Vite