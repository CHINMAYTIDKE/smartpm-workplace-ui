"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft, Plus, Loader2, Calendar, Users, CheckCircle2,
    Clock, Trophy, User, Target, MessageSquare, Lock, ExternalLink,
    BarChart3, TrendingUp, Check, X
} from "lucide-react"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchWithAuth } from "@/lib/utils/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

interface Remark {
    id: string
    userId: string
    userName: string
    userPhoto: string | null
    message: string
    link: string | null
    createdAt: Date
}

interface Task {
    id: string
    title: string
    description: string
    status: "todo" | "in-progress" | "pending-verification" | "completed"
    priority: "low" | "medium" | "high"
    assignee: { name: string; email: string; photoURL: string | null } | null
    assignedTo: string | null
    claimedBy: string | null
    dueDate: Date | null
    createdAt: Date
    completedAt: Date | null
    remarks: Remark[]
}

interface WorkspaceMember {
    id: string
    name: string
    email: string
    photoURL: string | null
    role: string
}

interface Project {
    id: string
    name: string
    description: string
    priority: string
    status: string
    dueDate: Date | null
    members: string[]
}

interface MemberStats {
    userId: string
    name: string
    email: string
    photoURL: string | null
    tasksTotal: number
    tasksCompleted: number
    tasksInProgress: number
    tasksTodo: number
    completionRate: number
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export default function ProjectDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const workspaceId = params.id as string
    const projectId = params.projectId as string

    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [members, setMembers] = useState<WorkspaceMember[]>([])
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [createTaskOpen, setCreateTaskOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", dueDate: "" })

    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [assigning, setAssigning] = useState(false)

    const [remarksDialogOpen, setRemarksDialogOpen] = useState(false)
    const [remarkText, setRemarkText] = useState("")
    const [remarkLink, setRemarkLink] = useState("")
    const [addingRemark, setAddingRemark] = useState(false)

    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
    const [verifying, setVerifying] = useState(false)

    useEffect(() => {
        if (projectId && workspaceId) {
            fetchProjectData()
            fetchAnalytics()
        }
    }, [projectId, workspaceId])

    const fetchProjectData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [projectRes, tasksRes, membersRes] = await Promise.all([
                fetchWithAuth(`/api/projects/${projectId}`),
                fetchWithAuth(`/api/projects/${projectId}/tasks`),
                fetchWithAuth(`/api/workspaces/${workspaceId}/members`)
            ])

            const [projectData, tasksData, membersData] = await Promise.all([
                projectRes.json(),
                tasksRes.json(),
                membersRes.json()
            ])

            if (!projectRes.ok) throw new Error(projectData.error || "Failed to fetch project")
            if (!tasksRes.ok) throw new Error(tasksData.error || "Failed to fetch tasks")
            if (!membersRes.ok) throw new Error(membersData.error || "Failed to fetch members")

            setProject(projectData.project)
            setTasks(tasksData.tasks || [])
            setMembers(membersData.members || [])
        } catch (err: any) {
            setError(err.message || "Failed to load project")
            toast.error(err.message || "Failed to load project")
        } finally {
            setLoading(false)
        }
    }

    const fetchAnalytics = async () => {
        try {
            const response = await fetchWithAuth(`/api/workspaces/${workspaceId}/analytics`)
            const data = await response.json()
            if (response.ok) {
                setAnalytics(data)
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err)
        }
    }

    const handleCreateTask = async () => {
        if (!newTask.title.trim()) {
            toast.error("Please enter a task title")
            return
        }

        try {
            setCreating(true)
            const response = await fetchWithAuth(`/api/projects/${projectId}/tasks`, {
                method: "POST",
                body: JSON.stringify(newTask),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to create task")

            toast.success("Task created successfully!")
            setCreateTaskOpen(false)
            setNewTask({ title: "", description: "", priority: "medium", dueDate: "" })
            await fetchProjectData()
            await fetchAnalytics()
        } catch (err: any) {
            toast.error(err.message || "Failed to create task")
        } finally {
            setCreating(false)
        }
    }

    const handleAssignTask = async (assignedTo: string) => {
        if (!selectedTask) return

        try {
            setAssigning(true)
            const response = await fetchWithAuth(`/api/tasks/${selectedTask.id}/assign`, {
                method: "PATCH",
                body: JSON.stringify({ assignedTo }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to assign task")

            toast.success("Task assigned successfully!")
            setAssignDialogOpen(false)
            setSelectedTask(null)
            await fetchProjectData()
        } catch (err: any) {
            toast.error(err.message || "Failed to assign task")
        } finally {
            setAssigning(false)
        }
    }

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            const response = await fetchWithAuth(`/api/tasks/${taskId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to update task")

            toast.success("Task updated!")
            await fetchProjectData()
            await fetchAnalytics()
        } catch (err: any) {
            toast.error(err.message || "Failed to update task")
        }
    }

    const handleAddRemark = async () => {
        if (!selectedTask || !remarkText.trim()) {
            toast.error("Please enter a remark")
            return
        }

        try {
            setAddingRemark(true)
            const response = await fetchWithAuth(`/api/tasks/${selectedTask.id}/remarks`, {
                method: "POST",
                body: JSON.stringify({ message: remarkText, link: remarkLink }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to add remark")

            toast.success("Remark added!")
            setRemarkText("")
            setRemarkLink("")
            await fetchProjectData()
        } catch (err: any) {
            toast.error(err.message || "Failed to add remark")
        } finally {
            setAddingRemark(false)
        }
    }

    const handleVerifyTask = async (approved: boolean) => {
        if (!selectedTask) return

        try {
            setVerifying(true)
            const response = await fetchWithAuth(`/api/tasks/${selectedTask.id}/verify`, {
                method: "PATCH",
                body: JSON.stringify({ approved }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to verify task")

            toast.success(approved ? "Task approved!" : "Task sent back for revision")
            setVerifyDialogOpen(false)
            setSelectedTask(null)
            await fetchProjectData()
            await fetchAnalytics()
        } catch (err: any) {
            toast.error(err.message || "Failed to verify task")
        } finally {
            setVerifying(false)
        }
    }

    const isAdmin = members.find(m => m.id === user?.uid)?.role === "owner" ||
        members.find(m => m.id === user?.uid)?.role === "admin"

    const todoTasks = tasks.filter(t => t.status === "todo")
    const inProgressTasks = tasks.filter(t => t.status === "in-progress")
    const pendingTasks = tasks.filter(t => t.status === "pending-verification")
    const completedTasks = tasks.filter(t => t.status === "completed")

    const formatDate = (date: Date | null) => {
        if (!date) return "No due date"
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const canModifyTask = (task: Task) => {
        // Admin can always modify
        if (isAdmin) return true

        // If task is claimed, only the claimer can modify it
        if (task.status === "in-progress" && task.claimedBy) {
            return task.claimedBy === user?.uid
        }

        // If task is not claimed (todo), anyone can modify
        if (task.status === "todo") return true

        // For other statuses, check if user is the assignee or claimer
        return task.assignedTo === user?.uid || task.claimedBy === user?.uid
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="p-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Card className="border-destructive">
                    <CardContent className="pt-6 text-center">
                        <p className="text-destructive mb-4">{error || "Project not found"}</p>
                        <Button onClick={fetchProjectData} variant="outline">Try Again</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

    const TaskCard = ({ task }: { task: Task }) => {
        const isClaimed = task.claimedBy && task.status === "in-progress"
        const isClaimedByMe = task.claimedBy === user?.uid
        const canModify = canModifyTask(task)
        const claimer = isClaimed ? members.find(m => m.id === task.claimedBy) : null

        return (
            <Card className={`cursor-pointer hover:shadow-md transition-shadow ${task.status === "completed" ? "border-green-200 bg-green-50/30" :
                task.status === "pending-verification" ? "border-yellow-200 bg-yellow-50/30" :
                    task.status === "in-progress" ? "border-blue-200" : ""
                }`}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                        <CardTitle className={`text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                        </CardTitle>
                        {isClaimed && (
                            <Badge variant={isClaimedByMe ? "default" : "secondary"} className="text-xs gap-1">
                                <Lock className="w-3 h-3" />
                                {isClaimedByMe ? "You're working" : claimer?.name}
                            </Badge>
                        )}
                    </div>
                    {task.description && (
                        <CardDescription className="text-xs line-clamp-2">{task.description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Badge variant={
                            task.priority === "high" ? "destructive" :
                                task.priority === "medium" ? "default" : "outline"
                        } className="text-xs capitalize">
                            {task.priority}
                        </Badge>
                        {task.assignee && (
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={task.assignee.photoURL || undefined} />
                                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                    {task.assignee.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        )}
                    </div>

                    {canModify ? (
                        <Select
                            value={task.status}
                            onValueChange={(value) => handleStatusChange(task.id, value)}
                        >
                            <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="completed">Mark Complete</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Being worked on
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        {/* Remarks Button - Show for task owner or admin */}
                        {(isClaimedByMe || task.assignedTo === user?.uid) && (
                            <Button
                                size="sm"
                                variant={task.remarks?.length > 0 ? "default" : "outline"}
                                className="h-7 text-xs w-full"
                                onClick={() => {
                                    setSelectedTask(task)
                                    setRemarksDialogOpen(true)
                                }}
                            >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {task.remarks?.length > 0
                                    ? `View ${task.remarks.length} Remark${task.remarks.length > 1 ? 's' : ''}`
                                    : 'Add Remarks'}
                            </Button>
                        )}

                        {/* Helper text for members */}
                        {(isClaimedByMe || task.assignedTo === user?.uid) && task.status === "in-progress" && (
                            <p className="text-[10px] text-muted-foreground text-center">
                                💡 Add proof before completing
                            </p>
                        )}

                        {/* Verify Button for Admins */}
                        {isAdmin && task.status === "pending-verification" && (
                            <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs w-full bg-yellow-600 hover:bg-yellow-700"
                                onClick={() => {
                                    setSelectedTask(task)
                                    setVerifyDialogOpen(true)
                                }}
                            >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Review & Verify
                            </Button>
                        )}

                        {/* Assign Button for Admins */}
                        {isAdmin && !task.assignee && task.status === "todo" && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs w-full"
                                onClick={() => {
                                    setSelectedTask(task)
                                    setAssignDialogOpen(true)
                                }}
                            >
                                <User className="w-3 h-3 mr-1" />
                                Assign Member
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Projects
                </Button>

                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold">{project.name}</h1>
                            <Badge variant={
                                project.priority === "high" ? "destructive" :
                                    project.priority === "medium" ? "default" : "secondary"
                            } className="capitalize">
                                {project.priority}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">{project.description}</p>
                    </div>

                    <Button onClick={() => setCreateTaskOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create Task
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progress}%</div>
                        <Progress value={progress} className="h-2 mt-2" />
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="tasks" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* To Do */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">To Do</h3>
                                <Badge variant="secondary">{todoTasks.length}</Badge>
                            </div>
                            <div className="space-y-3">
                                {todoTasks.map(task => <TaskCard key={task.id} task={task} />)}
                                {todoTasks.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-8">No tasks</p>
                                )}
                            </div>
                        </div>

                        {/* In Progress */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">In Progress</h3>
                                <Badge variant="default">{inProgressTasks.length}</Badge>
                            </div>
                            <div className="space-y-3">
                                {inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)}
                                {inProgressTasks.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-8">No tasks</p>
                                )}
                            </div>
                        </div>

                        {/* Pending Verification */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Pending Review</h3>
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">{pendingTasks.length}</Badge>
                            </div>
                            <div className="space-y-3">
                                {pendingTasks.map(task => <TaskCard key={task.id} task={task} />)}
                                {pendingTasks.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-8">No tasks</p>
                                )}
                            </div>
                        </div>

                        {/* Completed */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Completed</h3>
                                <Badge variant="outline" className="bg-green-50 text-green-700">{completedTasks.length}</Badge>
                            </div>
                            <div className="space-y-3">
                                {completedTasks.map(task => <TaskCard key={task.id} task={task} />)}
                                {completedTasks.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-8">No tasks</p>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    {analytics && analytics.memberStats && analytics.memberStats.length > 0 ? (
                        <>
                            {/* Top Contributors */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                        Top Contributors
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-5">
                                        {analytics.memberStats.slice(0, 5).map((stat: MemberStats, index: number) => (
                                            <Card key={stat.userId} className="relative overflow-hidden">
                                                {index === 0 && (
                                                    <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-2 py-1 text-xs font-bold rounded-bl">
                                                        #1
                                                    </div>
                                                )}
                                                <CardContent className="pt-6 text-center">
                                                    <Avatar className="w-16 h-16 mx-auto mb-3">
                                                        <AvatarImage src={stat.photoURL || undefined} />
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                                            {stat.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <p className="font-semibold truncate">{stat.name}</p>
                                                    <div className="text-2xl font-bold text-green-600 my-2">{stat.tasksCompleted}</div>
                                                    <p className="text-xs text-muted-foreground">tasks completed</p>
                                                    <Badge variant="secondary" className="mt-2">
                                                        {stat.completionRate}% rate
                                                    </Badge>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Charts */}
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Tasks by Member */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Tasks by Member</CardTitle>
                                        <CardDescription>Completed vs Total Tasks</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={analytics.memberStats}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="tasksCompleted" fill="#10b981" name="Completed" />
                                                <Bar dataKey="tasksInProgress" fill="#3b82f6" name="In Progress" />
                                                <Bar dataKey="tasksTodo" fill="#94a3b8" name="To Do" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Completion Rate */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Completion Rate</CardTitle>
                                        <CardDescription>Member productivity comparison</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={analytics.memberStats}
                                                    dataKey="tasksCompleted"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label={(entry) => `${entry.name}: ${entry.tasksCompleted}`}
                                                >
                                                    {analytics.memberStats.map((_: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Weekly Trend */}
                                {analytics.weeklyData && (
                                    <Card className="md:col-span-2">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Completion Trend</CardTitle>
                                            <CardDescription>Tasks completed over the last 4 weeks</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <LineChart data={analytics.weeklyData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="week" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} name="Tasks Completed" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>No analytics data available yet</p>
                                <p className="text-sm">Start assigning and completing tasks to see insights</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create Task Dialog */}
            <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>Add a new task to this project</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-title">Task Title</Label>
                            <Input
                                id="task-title"
                                placeholder="e.g., Design landing page"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="task-description">Description</Label>
                            <Textarea
                                id="task-description"
                                placeholder="Task details..."
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="task-priority">Priority</Label>
                                <Select
                                    value={newTask.priority}
                                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                                >
                                    <SelectTrigger id="task-priority">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="task-due-date">Due Date</Label>
                                <Input
                                    id="task-due-date"
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateTaskOpen(false)} disabled={creating}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateTask} disabled={creating}>
                            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Create Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Task Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Task</DialogTitle>
                        <DialogDescription>
                            Assign "{selectedTask?.title}" to a team member
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        {members.map(member => (
                            <Button
                                key={member.id}
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleAssignTask(member.id)}
                                disabled={assigning}
                            >
                                <Avatar className="w-8 h-8 mr-3">
                                    <AvatarImage src={member.photoURL || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                        {member.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-left flex-1">
                                    <p className="font-medium">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Remarks Dialog */}
            <Dialog open={remarksDialogOpen} onOpenChange={setRemarksDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Task Remarks</DialogTitle>
                        <DialogDescription>
                            {selectedTask?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                        {selectedTask?.remarks && selectedTask.remarks.length > 0 ? (
                            <div className="space-y-3">
                                {selectedTask.remarks.map((remark) => (
                                    <div key={remark.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={remark.userPhoto || undefined} />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                                {remark.userName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium text-sm">{remark.userName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(remark.createdAt)}
                                                </p>
                                            </div>
                                            <p className="text-sm">{remark.message}</p>
                                            {remark.link && (
                                                <a
                                                    href={remark.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    View Link
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-6">No remarks yet</p>
                        )}

                        <Separator />

                        <div className="space-y-3">
                            <Label htmlFor="remark-message">Add Remark</Label>
                            <Textarea
                                id="remark-message"
                                placeholder="Add a status update or note..."
                                value={remarkText}
                                onChange={(e) => setRemarkText(e.target.value)}
                                rows={3}
                            />
                            <div className="space-y-2">
                                <Label htmlFor="remark-link">Link (optional)</Label>
                                <Input
                                    id="remark-link"
                                    placeholder="https://... (proof of work, design, etc.)"
                                    value={remarkLink}
                                    onChange={(e) => setRemarkLink(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleAddRemark}
                                disabled={addingRemark}
                                className="w-full"
                            >
                                {addingRemark ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                                Add Remark
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Verify Task Dialog */}
            <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Task Completion</DialogTitle>
                        <DialogDescription>
                            {selectedTask?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                            <h4 className="font-semibold text-sm">Task Remarks:</h4>
                            {selectedTask?.remarks && selectedTask.remarks.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedTask.remarks.map((remark) => (
                                        <div key={remark.id} className="text-sm">
                                            <p className="font-medium">{remark.userName}:</p>
                                            <p className="text-muted-foreground">{remark.message}</p>
                                            {remark.link && (
                                                <a
                                                    href={remark.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    {remark.link}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No remarks provided</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => handleVerifyTask(false)}
                            disabled={verifying}
                            className="gap-2"
                        >
                            <X className="w-4 h-4" />
                            Reject
                        </Button>
                        <Button
                            onClick={() => handleVerifyTask(true)}
                            disabled={verifying}
                            className="gap-2"
                        >
                            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
