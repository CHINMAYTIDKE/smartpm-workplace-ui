import { NextRequest, NextResponse } from 'next/server'
import { GoogleCalendarService } from '@/lib/google-calendar'
import { cookies } from 'next/headers'

const config = {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || ''
}

async function getCalendarService() {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('google_access_token')?.value
    const refreshToken = cookieStore.get('google_refresh_token')?.value

    if (!accessToken) {
        throw new Error('Not authenticated')
    }

    const calendarService = new GoogleCalendarService(config)
    calendarService.setTokens({
        access_token: accessToken,
        refresh_token: refreshToken
    })

    return calendarService
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const calendarService = await getCalendarService()

        const event = await calendarService.getEvent(id)

        const meeting = {
            id: event.id,
            title: event.summary || 'Untitled Meeting',
            description: event.description,
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri,
            attendees: event.attendees?.map((a: any) => ({
                email: a.email,
                name: a.displayName
            })),
            status: event.status
        }

        return NextResponse.json({ meeting })
    } catch (error: any) {
        console.error('Failed to fetch meeting:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch meeting' },
            { status: error.message === 'Not authenticated' ? 401 : 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const calendarService = await getCalendarService()

        const event = await calendarService.updateEvent(id, body)

        const meeting = {
            id: event.id,
            title: event.summary || 'Untitled Meeting',
            description: event.description,
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri,
            attendees: event.attendees?.map((a: any) => ({
                email: a.email,
                name: a.displayName
            })),
            status: event.status
        }

        return NextResponse.json({ meeting })
    } catch (error: any) {
        console.error('Failed to update meeting:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update meeting' },
            { status: error.message === 'Not authenticated' ? 401 : 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const calendarService = await getCalendarService()

        await calendarService.deleteEvent(id)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Failed to delete meeting:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete meeting' },
            { status: error.message === 'Not authenticated' ? 401 : 500 }
        )
    }
}
