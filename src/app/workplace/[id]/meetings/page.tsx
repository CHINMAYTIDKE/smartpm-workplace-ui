"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarIcon, Plus, Video, Clock, Users as UsersIcon, ExternalLink, Loader2, CalendarDays, Link as LinkIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

interface Meeting {
    id: string
    title: string
    description?: string
    startTime: string
    endTime: string
    meetLink?: string
    attendees?: Array<{ email: string; name?: string }>
    status: string
    workspaceId: string
}

export default function MeetingsPage() {
    const params = useParams()
    const workspaceId = params.id as string

    const [activeTab, setActiveTab] = useState("upcoming")
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    // Dialog states
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
    const [joinDialogOpen, setJoinDialogOpen] = useState(false)

    // Form state
    const [newMeeting, setNewMeeting] = useState({
        title: "",
        description: "",
        date: "",
        startTime: "",
        duration: "30",
        attendees: ""
    })

    const [meetingLink, setMeetingLink] = useState("")

    useEffect(() => {
        checkConnection()
        if (isConnected) {
            fetchMeetings()
        }
    }, [workspaceId, isConnected])

    const checkConnection = async () => {
        try {
            const response = await fetch(`/api/meetings/auth/status`)
            const data = await response.json()
            setIsConnected(data.connected)
        } catch (error) {
            console.error("Failed to check connection:", error)
            setIsConnected(false)
        }
    }

    const fetchMeetings = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/meetings?workspaceId=${workspaceId}`)
            if (response.ok) {
                const data = await response.json()
                // Filter meetings for this workspace only
                const workspaceMeetings = (data.meetings || []).filter(
                    (m: Meeting) => m.workspaceId === workspaceId
                )
                setMeetings(workspaceMeetings)
            }
        } catch (error) {
            console.error("Failed to fetch meetings:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleConnectCalendar = async () => {
        try {
            const response = await fetch('/api/meetings/auth')
            const data = await response.json()

            if (data.authUrl) {
                window.location.href = data.authUrl
            }
        } catch (error) {
            console.error("Failed to connect calendar:", error)
        }
    }

    const handleScheduleMeeting = async () => {
        if (!newMeeting.title || !newMeeting.date || !newMeeting.startTime) {
            return
        }

        setIsLoading(true)
        try {
            const startDateTime = new Date(`${newMeeting.date}T${newMeeting.startTime}`)
            const endDateTime = new Date(startDateTime.getTime() + parseInt(newMeeting.duration) * 60000)

            const response = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    title: newMeeting.title,
                    description: newMeeting.description,
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    attendees: newMeeting.attendees.split(',').map(email => ({ email: email.trim() }))
                })
            })

            if (response.ok) {
                const data = await response.json()
                setMeetings([...meetings, { ...data.meeting, workspaceId }])
                setScheduleDialogOpen(false)
                setNewMeeting({
                    title: "",
                    description: "",
                    date: "",
                    startTime: "",
                    duration: "30",
                    attendees: ""
                })
            }
        } catch (error) {
            console.error("Failed to create meeting:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleInstantMeeting = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/meetings/instant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    title: `Quick Meeting - ${new Date().toLocaleString()}`
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.meeting?.meetLink) {
                    window.open(data.meeting.meetLink, '_blank')
                }
                fetchMeetings()
            }
        } catch (error) {
            console.error("Failed to start instant meeting:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleJoinMeeting = () => {
        if (meetingLink.trim()) {
            window.open(meetingLink, '_blank')
            setJoinDialogOpen(false)
            setMeetingLink("")
        }
    }

    const formatMeetingTime = (startTime: string, endTime: string) => {
        const start = new Date(startTime)
        const end = new Date(endTime)
        return `${format(start, 'MMM d, yyyy')} • ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`
    }

    const now = new Date()
    const upcomingMeetings = meetings.filter(m => new Date(m.startTime) > now)
    const pastMeetings = meetings.filter(m => new Date(m.startTime) <= now)
    const ongoingMeetings = meetings.filter(m => {
        const start = new Date(m.startTime)
        const end = new Date(m.endTime)
        return start <= now && now <= end
    })

    // Filter meetings for selected calendar date
    const selectedDateMeetings = meetings.filter(m => {
        const meetingDate = new Date(m.startTime)
        return meetingDate.toDateString() === selectedDate.toDateString()
    })

    if (!isConnected) {
        return (
            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold">Meetings</h1>
                    </div>
                    <p className="text-muted-foreground">Schedule and manage team meetings with Google Meet</p>
                </div>

                {/* Connection Card */}
                <Card className="max-w-2xl mx-auto mt-20">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Connect Google Calendar</CardTitle>
                        <CardDescription className="text-base">
                            Connect your Google Calendar to schedule meetings and automatically create Google Meet links
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="bg-muted rounded-lg p-4 text-left space-y-2">
                            <p className="text-sm font-medium">Features:</p>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                                <li>• Schedule meetings with team members</li>
                                <li>• Automatic Google Meet link generation</li>
                                <li>• Calendar integration and reminders</li>
                                <li>• Start instant meetings on the fly</li>
                                <li>• Workspace-specific meeting management</li>
                            </ul>
                        </div>
                        <Button onClick={handleConnectCalendar} size="lg" className="w-full">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Connect Google Calendar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold">Meetings</h1>
                    </div>
                    <p className="text-muted-foreground">Schedule and manage team meetings with Google Meet</p>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="upcoming" className="gap-2">
                        <Clock className="w-4 h-4" />
                        Upcoming
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Calendar
                    </TabsTrigger>
                    <TabsTrigger value="actions" className="gap-2">
                        <Video className="w-4 h-4" />
                        Actions
                    </TabsTrigger>
                </TabsList>

                {/* Upcoming Meetings Tab */}
                <TabsContent value="upcoming" className="space-y-6">
                    {/* Ongoing Meetings Alert */}
                    {ongoingMeetings.length > 0 && (
                        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    {ongoingMeetings.length} Meeting{ongoingMeetings.length > 1 ? 's' : ''} In Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {ongoingMeetings.map((meeting) => (
                                    <div key={meeting.id} className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-lg">
                                        <div>
                                            <p className="font-medium">{meeting.title}</p>
                                            <p className="text-sm text-muted-foreground">{formatMeetingTime(meeting.startTime, meeting.endTime)}</p>
                                        </div>
                                        {meeting.meetLink && (
                                            <Button size="sm" asChild>
                                                <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer">
                                                    <Video className="w-4 h-4 mr-1" />
                                                    Join Now
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Upcoming Meetings List */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Upcoming Meetings</CardTitle>
                                <CardDescription>Your scheduled meetings for this workspace</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[500px] pr-4">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-40">
                                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : upcomingMeetings.length === 0 ? (
                                        <div className="text-center py-12">
                                            <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                            <p className="text-muted-foreground">No upcoming meetings scheduled</p>
                                            <p className="text-sm text-muted-foreground mt-1">Create a new meeting to get started</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {upcomingMeetings.map((meeting) => (
                                                <Card key={meeting.id} className="border-l-4 border-l-blue-500">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold mb-1">{meeting.title}</h3>
                                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {formatMeetingTime(meeting.startTime, meeting.endTime)}
                                                                    </span>
                                                                    {meeting.attendees && meeting.attendees.length > 0 && (
                                                                        <span className="flex items-center gap-1">
                                                                            <UsersIcon className="w-3 h-3" />
                                                                            {meeting.attendees.length} attendees
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {meeting.description && (
                                                                    <p className="text-sm text-muted-foreground">{meeting.description}</p>
                                                                )}
                                                            </div>
                                                            {meeting.meetLink && (
                                                                <Button size="sm" asChild>
                                                                    <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer">
                                                                        <Video className="w-4 h-4 mr-1" />
                                                                        Join
                                                                        <ExternalLink className="w-3 h-3 ml-1" />
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Quick Stats Sidebar */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Meeting Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Upcoming</span>
                                        <Badge variant="default">{upcomingMeetings.length}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">In Progress</span>
                                        <Badge variant="secondary">{ongoingMeetings.length}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Completed</span>
                                        <Badge variant="outline">{pastMeetings.length}</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Recent Meetings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {pastMeetings.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No past meetings</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {pastMeetings.slice(0, 3).map((meeting) => (
                                                <div key={meeting.id} className="text-sm p-2 rounded-lg bg-muted">
                                                    <p className="font-medium truncate">{meeting.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(meeting.startTime), 'MMM d, h:mm a')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Calendar View Tab */}
                <TabsContent value="calendar" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>
                                    Meetings on {format(selectedDate, 'MMMM d, yyyy')}
                                </CardTitle>
                                <CardDescription>
                                    {selectedDateMeetings.length} meeting{selectedDateMeetings.length !== 1 ? 's' : ''} scheduled
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {selectedDateMeetings.length === 0 ? (
                                    <div className="text-center py-12">
                                        <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                        <p className="text-muted-foreground">No meetings on this date</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedDateMeetings.map((meeting) => (
                                            <Card key={meeting.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold mb-1">{meeting.title}</h3>
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                {format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
                                                            </p>
                                                            {meeting.description && (
                                                                <p className="text-sm text-muted-foreground">{meeting.description}</p>
                                                            )}
                                                        </div>
                                                        {meeting.meetLink && (
                                                            <Button size="sm" variant="outline" asChild>
                                                                <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer">
                                                                    <Video className="w-4 h-4 mr-1" />
                                                                    Join
                                                                </a>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Select Date</CardTitle>
                                <CardDescription>View meetings by date</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    className="rounded-md border"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Actions Tab */}
                <TabsContent value="actions" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Schedule Meeting */}
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                                    <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <CardTitle>Schedule Meeting</CardTitle>
                                <CardDescription>Plan a meeting for later with your team</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Schedule Now
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Schedule Meeting</DialogTitle>
                                            <DialogDescription>
                                                Create a new meeting with Google Meet link
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Meeting Title *</Label>
                                                <Input
                                                    id="title"
                                                    placeholder="Weekly team sync"
                                                    value={newMeeting.title}
                                                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea
                                                    id="description"
                                                    placeholder="Meeting agenda and topics..."
                                                    value={newMeeting.description}
                                                    onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="date">Date *</Label>
                                                    <Input
                                                        id="date"
                                                        type="date"
                                                        value={newMeeting.date}
                                                        onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="time">Start Time *</Label>
                                                    <Input
                                                        id="time"
                                                        type="time"
                                                        value={newMeeting.startTime}
                                                        onChange={(e) => setNewMeeting({ ...newMeeting, startTime: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="duration">Duration</Label>
                                                <Select value={newMeeting.duration} onValueChange={(value) => setNewMeeting({ ...newMeeting, duration: value })}>
                                                    <SelectTrigger id="duration">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="15">15 minutes</SelectItem>
                                                        <SelectItem value="30">30 minutes</SelectItem>
                                                        <SelectItem value="45">45 minutes</SelectItem>
                                                        <SelectItem value="60">1 hour</SelectItem>
                                                        <SelectItem value="90">1.5 hours</SelectItem>
                                                        <SelectItem value="120">2 hours</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="attendees">Attendees (comma-separated emails)</Label>
                                                <Input
                                                    id="attendees"
                                                    placeholder="john@example.com, jane@example.com"
                                                    value={newMeeting.attendees}
                                                    onChange={(e) => setNewMeeting({ ...newMeeting, attendees: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleScheduleMeeting} disabled={isLoading}>
                                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarIcon className="w-4 h-4 mr-2" />}
                                                Schedule Meeting
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>

                        {/* Instant Meeting */}
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-3">
                                    <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <CardTitle>Instant Meeting</CardTitle>
                                <CardDescription>Start a meeting right now instantly</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={handleInstantMeeting} disabled={isLoading} className="w-full" variant="default">
                                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                                    Start Now
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Join Meeting */}
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
                                    <LinkIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <CardTitle>Join Meeting</CardTitle>
                                <CardDescription>Join an ongoing meeting with a link</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full" variant="outline">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Join with Link
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Join Meeting</DialogTitle>
                                            <DialogDescription>
                                                Enter a meeting link to join
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="meeting-link">Meeting Link</Label>
                                                <Input
                                                    id="meeting-link"
                                                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                                    value={meetingLink}
                                                    onChange={(e) => setMeetingLink(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleJoinMeeting} disabled={!meetingLink.trim()}>
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Join Meeting
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
