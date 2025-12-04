import { google } from 'googleapis'

export interface GoogleCalendarConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
}

export interface CalendarEvent {
    id?: string
    summary: string
    description?: string
    start: {
        dateTime: string
        timeZone?: string
    }
    end: {
        dateTime: string
        timeZone?: string
    }
    attendees?: Array<{
        email: string
        displayName?: string
    }>
    conferenceData?: {
        createRequest?: {
            requestId: string
            conferenceSolutionKey: {
                type: string
            }
        }
    }
}

export class GoogleCalendarService {
    private oauth2Client: any

    constructor(config: GoogleCalendarConfig) {
        this.oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            config.redirectUri
        )
    }

    /**
     * Generate OAuth authorization URL
     */
    getAuthUrl(): string {
        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ]

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        })
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokensFromCode(code: string) {
        const { tokens } = await this.oauth2Client.getToken(code)
        this.oauth2Client.setCredentials(tokens)
        return tokens
    }

    /**
     * Set tokens for authenticated requests
     */
    setTokens(tokens: any) {
        this.oauth2Client.setCredentials(tokens)
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken() {
        const { credentials } = await this.oauth2Client.refreshAccessToken()
        return credentials
    }

    /**
     * List calendar events
     */
    async listEvents(options: {
        calendarId?: string
        timeMin?: string
        timeMax?: string
        maxResults?: number
    }) {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

        const response = await calendar.events.list({
            calendarId: options.calendarId || 'primary',
            timeMin: options.timeMin || new Date().toISOString(),
            timeMax: options.timeMax,
            maxResults: options.maxResults || 50,
            singleEvents: true,
            orderBy: 'startTime'
        })

        return response.data.items || []
    }

    /**
     * Create a calendar event with Google Meet link
     */
    async createEvent(event: CalendarEvent, calendarId: string = 'primary') {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

        // Add Google Meet conference data
        const eventWithMeet = {
            ...event,
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            }
        }

        const response = await calendar.events.insert({
            calendarId,
            requestBody: eventWithMeet,
            conferenceDataVersion: 1
        })

        return response.data
    }

    /**
     * Get a specific event
     */
    async getEvent(eventId: string, calendarId: string = 'primary') {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

        const response = await calendar.events.get({
            calendarId,
            eventId
        })

        return response.data
    }

    /**
     * Update an event
     */
    async updateEvent(eventId: string, event: Partial<CalendarEvent>, calendarId: string = 'primary') {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

        const response = await calendar.events.patch({
            calendarId,
            eventId,
            requestBody: event
        })

        return response.data
    }

    /**
     * Delete an event
     */
    async deleteEvent(eventId: string, calendarId: string = 'primary') {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

        await calendar.events.delete({
            calendarId,
            eventId
        })
    }

    /**
     * Create an instant meeting (starting now)
     */
    async createInstantMeeting(title: string, duration: number = 60) {
        const now = new Date()
        const end = new Date(now.getTime() + duration * 60000) // duration in minutes

        return this.createEvent({
            summary: title,
            description: 'Instant meeting created from FlowTrack',
            start: {
                dateTime: now.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: end.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        })
    }
}

// Helper function to check if token needs refresh
export function isTokenExpired(expiryDate: number): boolean {
    return Date.now() >= expiryDate
}
