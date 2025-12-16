import { NextRequest, NextResponse } from 'next/server'
import { GoogleCalendarService } from '@/lib/google-calendar'
import { cookies } from 'next/headers'

const config = {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || ''
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.redirect(new URL('/workspaces', request.url))
    }

    try {
        const calendarService = new GoogleCalendarService(config)

        // Exchange code for tokens
        const tokens = await calendarService.getTokensFromCode(code)

        // Store tokens in cookies (in production, use a more secure storage like database)
        const cookieStore = await cookies()
        cookieStore.set('google_access_token', tokens.access_token || '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            sameSite: 'lax'
        })

        if (tokens.refresh_token) {
            cookieStore.set('google_refresh_token', tokens.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                sameSite: 'lax'
            })
        }

        if (tokens.expiry_date) {
            cookieStore.set('google_token_expiry', tokens.expiry_date.toString(), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 30,
                sameSite: 'lax'
            })
        }

        // Redirect back to meetings page
        return NextResponse.redirect(new URL('/workplace/1/meetings', request.url))
    } catch (error) {
        console.error('OAuth callback error:', error)
        return NextResponse.redirect(new URL('/workspaces?error=auth_failed', request.url))
    }
}
