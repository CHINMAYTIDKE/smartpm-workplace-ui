import { NextRequest, NextResponse } from 'next/server'

// Simple status check - returns true by default for MongoDB mode
export async function GET(request: NextRequest) {
    try {
        // In MongoDB mode, we're always "connected"
        return NextResponse.json({
            connected: true,
            mode: 'mongodb' // Indicate we're using local storage
        })
    } catch (error) {
        return NextResponse.json({ connected: true, mode: 'mongodb' })
    }
}
