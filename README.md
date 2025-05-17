# Right Peg Match - GitHub Netlify Deployment

This repository contains the frontend files for Right Peg Match, a remote job marketplace application.

## Deployment

This project is configured for deployment on Netlify directly from GitHub:

1. Create a new site in Netlify
2. Connect to this GitHub repository
3. The netlify.toml file handles all configuration

## API Connection

The frontend connects to a Replit backend API at:
`https://7a407b74-b1a3-43f7-bf8a-d00fad3554e3-00-15b02g7uh8r3y.riker.replit.dev/api`

## Environment Variables

The netlify.toml file already sets the correct environment variable:
`VITE_API_URL=https://7a407b74-b1a3-43f7-bf8a-d00fad3554e3-00-15b02g7uh8r3y.riker.replit.dev/api`