import { Auth0Client } from '@auth0/nextjs-auth0/server'

// Infer Vercel URL natively so that the callback points to the correct domain instead of localhost:3000
const getBaseUrl = () => {
    if (process.env.AUTH0_BASE_URL && process.env.AUTH0_BASE_URL !== 'http://localhost:3000') {
        return process.env.AUTH0_BASE_URL
    }
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    if (process.env.VERCEL_BRANCH_URL) return `https://${process.env.VERCEL_BRANCH_URL}`
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    return process.env.AUTH0_BASE_URL || 'http://localhost:3000'
}

export const auth0 = new Auth0Client({
    appBaseUrl: getBaseUrl()
})
