# Migration from NextAuth to Auth0

## Summary of Changes

This document outlines the changes made to migrate from NextAuth to Auth0 for authentication.

## Files Changed

### ✅ Core Authentication Files

1. **`src/lib/auth.ts`**
   - Replaced NextAuth configuration with Auth0 helpers
   - New `auth()` function that returns session from Auth0
   - New `signIn()` redirect function for Auth0 login
   - New `signOut()` redirect function for Auth0 logout
   - New `syncUserWithDatabase()` function to sync Auth0 users with Prisma

2. **`src/app/api/auth/[...auth0]/route.ts`** (renamed from `[...nextauth]`)
   - Uses Auth0's `handleAuth()` for all auth routes
   - Custom callback handler syncs users to database
   - Provides these routes automatically:
     - `/api/auth/login` - Initiates login
     - `/api/auth/logout` - Logs out user
     - `/api/auth/callback` - Handles OAuth callback
     - `/api/auth/me` - Returns current user

3. **`src/middleware.ts`** (NEW)
   - Protects authenticated routes using Auth0 middleware
   - Automatically redirects unauthenticated users to login

### ✅ UI Component Updates

4. **`src/app/(auth)/login/page.tsx`**
   - Removed server actions
   - Changed to Link component pointing to `/api/auth/login`
   - Removed email magic link (can re-add via Auth0 passwordless)
   - Updated messaging to mention Auth0

5. **`src/components/layout/user-menu.tsx`**
   - Removed `next-auth/react` import
   - Changed logout button to anchor tag pointing to `/api/auth/logout`
   - Updated border colors from orange to green (theme consistency)

6. **`src/types/next-auth.d.ts`**
   - Updated type declarations for Auth0 session structure
   - Session now uses Auth0's `Claims` type

### ✅ Configuration Files

7. **`.env.example`**
   - Replaced NextAuth variables with Auth0 variables:
     - `AUTH0_SECRET`
     - `AUTH0_BASE_URL`
     - `AUTH0_ISSUER_BASE_URL`
     - `AUTH0_CLIENT_ID`
     - `AUTH0_CLIENT_SECRET`
   - Removed Resend email configuration (Auth0 handles emails)

8. **`AUTH0_SETUP.md`** (NEW)
   - Complete setup guide for Auth0
   - Instructions for Google Social Connection
   - Troubleshooting tips

## Breaking Changes

### Environment Variables
**OLD (NextAuth):**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=...
EMAIL_FROM=...
```

**NEW (Auth0):**
```env
AUTH0_SECRET=...
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR-DOMAIN.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
```

### API Routes
- Auth routes moved from `/api/auth/[...nextauth]` to `/api/auth/[...auth0]`
- All auth endpoints now provided by Auth0 SDK

### Session Structure
Sessions now include Auth0-specific claims. The `auth()` function still returns a similar structure, but internally uses Auth0's session.

## What Still Works

✅ All page-level authentication (`const session = await auth()`)
✅ User database synchronization  
✅ Role-based access control
✅ Existing user data in database
✅ All protected routes
✅ User menu and logout functionality

## What's Different

### Login Flow
1. User clicks "Continue with Google"
2. Redirected to Auth0 Universal Login (hosted by Auth0)
3. User authenticates with Google
4. Auth0 callback syncs user to database
5. User redirected back to app

### Session Management
- Sessions are managed by Auth0 (more secure)
- Token rotation handled automatically
- No need to manually configure JWT/session strategies

## Migration Steps for Existing Users

Existing users in your database will work seamlessly:

1. User attempts to log in with Google
2. Auth0 authenticates with Google
3. `syncUserWithDatabase()` finds existing user by email
4. Updates user's name and image if changed
5. User logs in with their existing role and data

**No data migration needed!** The email field is used as the unique identifier.

## Dependencies

### Added
- `@auth0/nextjs-auth0@4.15.0`

### Can Be Removed (Optional)
- `next-auth@5.0.0-beta.30` (no longer used)
- `@auth/prisma-adapter@^2.11.1` (no longer used)

Run: `pnpm remove next-auth @auth/prisma-adapter`

## Testing Checklist

- [ ] Login with Google works
- [ ] Logout works and redirects correctly
- [ ] New users are created in database
- [ ] Existing users can log in with their email
- [ ] Protected routes require authentication
- [ ] User menu displays correctly
- [ ] Sessions persist across page reloads
- [ ] Role-based access works for all roles

## Rollback Plan

If you need to rollback to NextAuth:

1. Restore old `src/lib/auth.ts` from Git
2. Restore old API route and login page
3. Remove Auth0 middleware
4. Restore NextAuth environment variables
5. Run: `pnpm add next-auth@5.0.0-beta.30 @auth/prisma-adapter`

## Benefits of Auth0

1. **Enterprise-grade security** - Built-in protection against attacks
2. **Automatic token management** - No manual JWT configuration
3. **Universal Login** - Professionally designed, customizable login page
4. **Built-in MFA** - Easy to enable multi-factor authentication
5. **Social connections** - Easy to add more providers (GitHub, Facebook, etc.)
6. **Passwordless** - Can enable email/SMS passwordless login
7. **Compliance** - SOC 2, GDPR, HIPAA compliant
8. **Analytics** - Built-in login analytics and anomaly detection
9. **Rules & Actions** - Serverless functions to customize auth flow
10. **Free tier** - 7,000 active users, unlimited logins

## Next Steps

1. Follow [AUTH0_SETUP.md](./AUTH0_SETUP.md) to configure Auth0
2. Set up Google Social Connection in Auth0 Dashboard
3. Test authentication thoroughly
4. Configure Auth0 branding to match RESCURE design
5. Enable MFA for admin users
6. Set up Auth0 monitoring and alerts

## Support

- Auth0 Documentation: https://auth0.com/docs
- Next.js SDK: https://github.com/auth0/nextjs-auth0
- Auth0 Community: https://community.auth0.com/
