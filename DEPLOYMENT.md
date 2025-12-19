# Deployment Guide

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com
2. **Node.js**: v20 or higher
3. **Wrangler CLI**: Installed via npm (included in dev dependencies)
4. **Google Cloud Service Account**: With Gmail API access

## Gmail API Setup

### 1. Create Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Create a service account with Gmail API permissions
5. Download the JSON key file

### 2. Configure Service Account

The service account needs the `https://www.googleapis.com/auth/gmail.send` scope.

Save the following from your service account JSON:
- `client_email` (e.g., `cfsendmail@project.iam.gserviceaccount.com`)
- `private_key` (the entire RSA private key including headers)

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Local Environment

Create a `.dev.vars` file in the project root for local development:

```bash
PERSONAL_EMAIL=your-personal@example.com
WORK_EMAIL=your-work@example.com
GMAIL_SERVICE_ACCOUNT_EMAIL=cfsendmail@project.iam.gserviceaccount.com
GMAIL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here...\n-----END PRIVATE KEY-----\n"
PINCODE=1404
FROM_EMAIL=your-gmail@gmail.com
FROM_NAME=MailRelay
```

### 3. Run Locally

```bash
npm run dev
```

Visit `http://localhost:8787` to test locally.

## Production Deployment

### Deployment Architecture

This project uses **GitHub Actions** for automated deployment:
- Pushing to `main` branch triggers automatic deployment
- GitHub Actions uses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets
- Wrangler CLI is NOT needed locally for production deployment
- All deployment happens via CI/CD pipeline

### Option 1: GitHub Actions (Recommended - Automatic)

#### Setup GitHub Secrets

Go to your repository Settings → Secrets and variables → Actions, and add:

1. **CLOUDFLARE_API_TOKEN**
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Create token with "Edit Cloudflare Workers" permissions
   - Copy and paste into GitHub secret

2. **CLOUDFLARE_ACCOUNT_ID**
   - Find at https://dash.cloudflare.com
   - Look in the URL or Workers & Pages section
   - Copy your Account ID

#### Configure Worker Secrets in Cloudflare Dashboard

After first deployment, set secrets via Cloudflare Dashboard:

1. Go to Workers & Pages → mailrelay → Settings → Variables
2. Add the following **Environment Variables** (encrypted):
   - `PERSONAL_EMAIL`: your-personal@example.com
   - `WORK_EMAIL`: your-work@example.com
   - `GMAIL_SERVICE_ACCOUNT_EMAIL`: cfsendmail@project.iam.gserviceaccount.com
   - `GMAIL_PRIVATE_KEY`: The entire private key from service account JSON (including BEGIN/END lines)
   - `PINCODE`: 1404 (or your chosen pincode)
   - `FROM_EMAIL`: your-gmail@gmail.com
   - `FROM_NAME`: MailRelay

**Note**: The private key should include newlines. Copy it exactly as it appears in the JSON file.

#### Deploy

1. Create a pull request to `main` branch
2. Merge the PR
3. GitHub Actions will automatically deploy to Cloudflare Workers
4. Monitor the deployment in the Actions tab

### Option 2: Manual Deployment (Requires Cloudflare Authentication)

**Important**: Manual deployment requires `CLOUDFLARE_API_TOKEN` to be set locally or wrangler authentication.

If you need to deploy manually:

1. Authenticate wrangler:
   ```bash
   npx wrangler login
   # OR set token:
   export CLOUDFLARE_API_TOKEN=your_token
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

3. Set secrets via wrangler CLI:
   ```bash
   echo "cfsendmail@sendmailsw.iam.gserviceaccount.com" | npx wrangler secret put GMAIL_SERVICE_ACCOUNT_EMAIL
   npx wrangler secret put GMAIL_PRIVATE_KEY  # Then paste the entire private key
   echo "1404" | npx wrangler secret put PINCODE
   echo "your-personal@example.com" | npx wrangler secret put PERSONAL_EMAIL
   echo "your-work@example.com" | npx wrangler secret put WORK_EMAIL
   echo "your-gmail@gmail.com" | npx wrangler secret put FROM_EMAIL
   echo "MailRelay" | npx wrangler secret put FROM_NAME
   ```

## Deployment Workflow - Lessons Learned

### Key Insights

1. **GitHub Actions is the primary deployment method**
   - Don't try to deploy locally unless absolutely necessary
   - The CI/CD pipeline has all the tokens configured
   - Merge to `main` triggers automatic deployment

2. **Local wrangler requires authentication**
   - Running `npm run deploy` locally requires either:
     - `npx wrangler login` (interactive browser auth)
     - `CLOUDFLARE_API_TOKEN` environment variable set
   - This is separate from GitHub Actions secrets

3. **Service account authentication**
   - Gmail API uses service account JWT-based auth
   - No OAuth2 refresh tokens needed
   - Private key must be stored as-is with newlines
   - JWT is signed using Web Crypto API (RS256)

4. **Environment variables vs Secrets**
   - Cloudflare Workers stores all sensitive data as encrypted secrets
   - Set via Cloudflare Dashboard or `wrangler secret put`
   - These are separate from GitHub Actions secrets
   - GitHub Actions secrets are only used for deployment authentication

## Verification

After deployment:

1. Visit your worker URL: `https://mailrelay.saw.workers.dev`
2. You should see the MailRelay web form
3. Test with pincode in URL: `https://mailrelay.saw.workers.dev?pincode=1404`
4. Test the API endpoint:

```bash
curl -X POST https://mailrelay.saw.workers.dev/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "pincode": "1404",
    "destination": "personal",
    "subject": "Test Email",
    "message": "Testing the API"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "destination": "personal"
  }
}
```

## Troubleshooting

### Deployment fails in GitHub Actions

- Check GitHub Actions logs in the Actions tab
- Verify `CLOUDFLARE_API_TOKEN` has "Edit Cloudflare Workers" permissions
- Verify `CLOUDFLARE_ACCOUNT_ID` is correct
- Check that the token hasn't expired

### Worker runs but emails don't send

- Check Cloudflare Workers logs in Dashboard → Workers & Pages → mailrelay → Logs
- Verify all environment variables are set correctly
- Check `GMAIL_SERVICE_ACCOUNT_EMAIL` is correct
- Verify `GMAIL_PRIVATE_KEY` includes the BEGIN/END headers and preserves newlines
- Ensure service account has Gmail API send permissions
- Check Gmail API is enabled in Google Cloud Console

### Local development issues

- Ensure `.dev.vars` file exists with all required variables
- The private key in `.dev.vars` should have actual `\n` in the string or use multiline format
- Run `npx wrangler login` if authentication fails
- Check that dependencies are installed: `npm install`

### "Invalid pincode" errors

- Verify the `PINCODE` environment variable is set in Cloudflare Workers
- Check that you're using the correct pincode value (default: 1404)
- Case-sensitive: ensure pincode matches exactly

### Gmail API errors

- "Invalid JWT": Check that the private key is formatted correctly
- "Permission denied": Verify service account has `gmail.send` scope
- "API not enabled": Enable Gmail API in Google Cloud Console

## Monitoring

Monitor your worker:

1. **Cloudflare Dashboard**
   - Go to Workers & Pages → mailrelay
   - View real-time logs
   - Check request metrics

2. **GitHub Actions**
   - Monitor deployment status in Actions tab
   - View build and deployment logs

3. **Error Tracking**
   - All errors are logged to Cloudflare Workers logs
   - Check logs for detailed error messages with context
