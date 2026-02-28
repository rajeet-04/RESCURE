import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
    // We'll use a placeholder if not set, but warn
    console.warn('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')
