# Auth0 Setup Guide for RESCURE

This guide will help you set up Auth0 authentication with Google Sign-In for the RESCURE platform.

## Prerequisites

- An Auth0 account (sign up at https://auth0.com)
- A Google Cloud Platform account with OAuth credentials

## Step 1: Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Click on **Applications** → **Applications** in the sidebar
3. Click **Create Application**
4. Name it "RESCURE" and select **Regular Web Application**
5. Click **Create**

## Step 2: Configure Application Settings

In your Auth0 application settings:

### Basic Information
- Note down your **Domain**, **Client ID**, and **Client Secret**

### Application URIs
Add the following URLs:

**Allowed Callback URLs:**
```
http://localhost:3000/api/auth/callback
https://your-production-domain.com/api/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:3000
https://your-production-domain.com
```

**Allowed Web Origins:**
```
http://localhost:3000
https://your-production-domain.com
```

Click **Save Changes**

## Step 3: Enable Google Social Connection

1. Go to **Authentication** → **Social** in the Auth0 Dashboard
2. Click on **Google**
3. Toggle to enable Google connection
4. Enter your Google OAuth credentials:
   - **Client ID** from Google Cloud Console
   - **Client Secret** from Google Cloud Console
5. Configure these settings:
   - **Attributes**: Email, Profile
   - **Permissions**: email, profile
6. Click **Save Changes**

### Getting Google OAuth Credentials

If you don't have Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add Authorized redirect URIs:
   ```
   https://YOUR-AUTH0-DOMAIN.auth0.com/login/callback
   ```
7. Copy the Client ID and Client Secret

## Step 4: Configure Environment Variables

Create a `.env.local` file in your project root and add:

```env
# Auth0 Configuration
AUTH0_SECRET='your-generated-secret-here'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://YOUR-DOMAIN.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
```

### Generate AUTH0_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -hex 32
```

Or use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Update Production Settings

When deploying to production:

1. Update `AUTH0_BASE_URL` to your production URL
2. Add production URLs to Auth0 Application URIs
3. Ensure all environment variables are set in your hosting platform

## Step 6: Test Authentication

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `/login`
3. Click "Continue with Google"
4. You should be redirected to Auth0's Universal Login
5. Select Google and authorize
6. You'll be redirected back to your app

## Troubleshooting

### "Callback URL mismatch" error
- Verify your callback URLs in Auth0 match exactly (including http/https)
- Check that `AUTH0_BASE_URL` matches your current environment

### "Invalid state" error
- Clear your browser cookies
- Verify `AUTH0_SECRET` is set and hasn't changed
- Check that your app is running on the configured base URL

### User not syncing to database
- Check Prisma connection
- Verify database migrations are up to date
- Check server logs for sync errors

### Google connection not working
- Verify Google OAuth credentials in Auth0
- Check Google Cloud Console redirect URIs
- Ensure Google connection is enabled in Auth0

## Additional Auth0 Features

### Customize Login Page
1. Go to **Branding** → **Universal Login**
2. Customize colors, logo, and text
3. Preview changes

### Add Email/Password Login
1. Go to **Authentication** → **Database**
2. Enable Username-Password-Authentication
3. Configure password policies

### Enable Multi-Factor Authentication
1. Go to **Security** → **Multi-factor Auth**
2. Enable factors (SMS, Email, OTP)
3. Configure policies

## Security Best Practices

1. **Never commit** `.env.local` or Auth0 secrets to version control
2. **Rotate secrets** regularly in production
3. **Enable MFA** for admin accounts
4. **Monitor logs** in Auth0 Dashboard for suspicious activity
5. **Set up** brute force protection in Auth0
6. **Configure** anomaly detection in Auth0 settings

## Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 Next.js SDK](https://github.com/auth0/nextjs-auth0)
- [Auth0 Community](https://community.auth0.com/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

## Support

For issues specific to RESCURE's Auth0 integration, check:
- `src/lib/auth.ts` - Main auth configuration
- `src/app/api/auth/[...auth0]/route.ts` - Auth0 API routes
- `src/app/(auth)/login/page.tsx` - Login page
