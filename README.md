# Right Peg Match Frontend

This is a simplified frontend for the Right Peg Match platform that connects with the Replit backend.

## Deployment Instructions

### Deploying to Netlify

1. **Connect to GitHub**
   - Push these files to a GitHub repository
   - Log in to Netlify and click "Add new site" → "Import an existing project"
   - Select your GitHub repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Deploy site"

3. **Environment Variables**
   - After deployment, go to "Site settings" → "Environment variables"
   - Add the following environment variable:
     - Key: `VITE_API_URL`
     - Value: `https://remote-match-maker-markdurno-markdurno.replit.app/api`

4. **Force Redeploy**
   - After adding the environment variables, go to "Deploys" and click "Trigger deploy" to apply the changes

### Custom Domain Setup

1. **Add Custom Domain**
   - In Netlify, go to "Site settings" → "Domain management" → "Add custom domain"
   - Enter your domain (e.g., rightpegmatch.com)
   - Follow Netlify's instructions to set up DNS records with your domain provider (e.g., GoDaddy)

2. **SSL/TLS Certificate**
   - Netlify automatically provisions SSL certificates via Let's Encrypt
   - Ensure HTTPS is enabled in your site settings

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

## Connection with Replit Backend

This frontend connects to the Replit backend at:
`https://remote-match-maker-markdurno-markdurno.replit.app/api`

The connection is managed through API calls defined in `api.js`.