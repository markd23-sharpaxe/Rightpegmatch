# Right Peg Match - Netlify Deployment Package

This package is structured specifically for Netlify deployment with a prebuilt distribution.

## Structure

- `dist/` - Contains all the site files ready for deployment
- `netlify.toml` - Configuration file for Netlify

## How to Deploy

1. Upload this entire folder to a GitHub repository
2. Connect Netlify to your GitHub repository
3. Netlify will automatically detect the configuration from netlify.toml
4. No build command will be run, as the files are already prebuilt

## API Connection

The frontend connects to the Replit backend API at:
`https://7a407b74-b1a3-43f7-bf8a-d00fad3554e3-00-15b02g7uh8r3y.riker.replit.dev/api`

This is configured in the netlify.toml file via the environment variable:
`VITE_API_URL=https://7a407b74-b1a3-43f7-bf8a-d00fad3554e3-00-15b02g7uh8r3y.riker.replit.dev/api`