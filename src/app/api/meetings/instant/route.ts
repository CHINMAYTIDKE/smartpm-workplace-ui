import { NextRequest, NextResponse } from 'next/server'
import { getMeetingsCollection } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { workspaceId, title } = body

        if (!workspaceId) {
            return NextResponse.json(
                { error: 'Workspace ID is required' },
                { status: 400 }
            )
        }

        const meetingsCollection = await getMeetingsCollection()

        // Create instant meeting (starts now, 60 minutes duration)
        const now = new Date()
        const endTime = new Date(now.getTime() + 60 * 60000)

        const newMeeting = {
            workspaceId,
            title: title || `Quick Meeting - ${now.toLocaleString()}`,
            description: 'Instant meeting created from smartPM',
            startTime: now.toISOString(),
            endTime: endTime.toISOString(),
            attendees: [],
            meetLink: 'https://meet.google.com/krf-ronw-yom', // Real Google Meet link!
            status: 'scheduled',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        }

        const result = await meetingsCollection.insertOne(newMeeting)

        const meeting = {
            id: result.insertedId.toString(),
            ...newMeeting
        }

        return NextResponse.json({ meeting })
    } catch (error: any) {
        console.error('Failed to create instant meeting:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create instant meeting' },
            { status: 500 }
        )
    }
}
