import { NextRequest, NextResponse } from 'next/server'
import { GoogleCalendarService } from '@/lib/google-calendar'
import { cookies } from 'next/headers'

const config = {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || ''
}

export async function GET(request: NextRequest) {
    try {
        const calendarService = new GoogleCalendarService(config)

        // Generate authorization URL
        const authUrl = calendarService.getAuthUrl()

        return NextResponse.json({ authUrl })
    } catch (error) {
        console.error('Auth error:', error)
        return NextResponse.json(
            { error: 'Failed to generate auth URL' },
            { status: 500 }
        )
    }
}
