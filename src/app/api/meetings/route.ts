import { NextRequest, NextResponse } from 'next/server'
import { getMeetingsCollection } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const workspaceId = searchParams.get('workspaceId')

        if (!workspaceId) {
            return NextResponse.json(
                { error: 'Workspace ID is required' },
                { status: 400 }
            )
        }

        const meetingsCollection = await getMeetingsCollection()

        // Get all meetings for this workspace (no date filtering to show all)
        const meetings = await meetingsCollection
            .find({ workspaceId })
            .sort({ startTime: 1 })
            .toArray()

        // Transform to match expected format
        const formattedMeetings = meetings.map((meeting: any) => ({
            id: meeting._id.toString(),
            title: meeting.title,
            description: meeting.description,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            meetLink: meeting.meetLink,
            attendees: meeting.attendees || [],
            status: meeting.status || 'scheduled',
            workspaceId: meeting.workspaceId
        }))

        return NextResponse.json({ meetings: formattedMeetings })
    } catch (error: any) {
        console.error('Failed to fetch meetings:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch meetings', meetings: [] },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { workspaceId, title, description, startTime, endTime, attendees, meetLink } = body

        if (!workspaceId || !title || !startTime || !endTime) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const meetingsCollection = await getMeetingsCollection()

        // Create meeting object - use provided meet link or default to your link
        const newMeeting = {
            workspaceId,
            title,
            description: description || '',
            startTime,
            endTime,
            attendees: attendees || [],
            meetLink: meetLink || 'https://meet.google.com/krf-ronw-yom', // Real Google Meet link!
            status: 'scheduled',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        const result = await meetingsCollection.insertOne(newMeeting)

        const meeting = {
            id: result.insertedId.toString(),
            ...newMeeting
        }

        return NextResponse.json({ meeting })
    } catch (error: any) {
        console.error('Failed to create meeting:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create meeting' },
            { status: 500 }
        )
    }
}
