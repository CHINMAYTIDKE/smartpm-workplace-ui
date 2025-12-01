"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ArrowLeft, Plus, Loader2, Calendar, Users, CheckCircle2,
    Clock, TrendingUp, User, Trophy, Target
} from "lucide-react"
import { fetchWithAuth } from "@/lib/utils/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

interface Task {
    id: string
    title: string
    description: string
    status: "todo" | "in-progress" | "completed"
    priority: "low" | "medium" | "high"
    assignee: { name: string; email: string; photoURL: string | null } | null
    assignedTo: string | null
    dueDate: Date | null
    createdAt: Date
    completedAt: Date | null
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
    tasksCompleted: number
    tasksAssigned: number
    completionRate: number
}

export default function ProjectDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const workspaceId = params.id as string
    const projectId = params.projectId as string

    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [members, setMembers] = useState<WorkspaceMember[]>([])
    const [memberStats, setMemberStats] = useState<MemberStats[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [createTaskOpen, setCreateTaskOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        priority: "medium",
        dueDate: ""
    })

    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [assigning, setAssigning] = useState(false)

    useEffect(() => {
        if (projectId && workspaceId) {
            fetchProjectData()
        }
    }, [projectId, workspaceId])

    const fetchProjectData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch project details
            const projectRes = await fetchWithAuth(`/api/projects/${projectId}`)
            const projectData = await projectRes.json()

            if (!projectRes.ok) {
                throw new Error(projectData.error || "Failed to fetch project")
            }

            setProject(projectData.project)

            // Fetch tasks
            const tasksRes = await fetchWithAuth(`/api/projects/${projectId}/tasks`)
            const tasksData = await tasksRes.json()

            if (!tasksRes.ok) {
                throw new Error(tasksData.error || "Failed to fetch tasks")
            }

            setTasks(tasksData.tasks || [])

            // Fetch workspace members
            const membersRes = await fetchWithAuth(`/api/workspaces/${workspaceId}/members`)
            const membersData = await membersRes.json()

            if (!membersRes.ok) {
                throw new Error(membersData.error || "Failed to fetch members")
            }

            setMembers(membersData.members || [])

            // Calculate member statistics
            calculateMemberStats(tasksData.tasks || [], membersData.members || [])
        } catch (err: any) {
            console.error("Error fetching project data:", err)
            setError(err.message || "Failed to load project")
            toast.error(err.message || "Failed to load project")
        } finally {
            setLoading(false)
        }
    }

    const calculateMemberStats = (taskList: Task[], memberList: WorkspaceMember[]) => {
        const stats: MemberStats[] = memberList.map(member => {
            const assignedTasks = taskList.filter(t => t.assignedTo === member.id)
            const completedTasks = assignedTasks.filter(t => t.status === "completed")

            return {
                userId: member.id,
                name: member.name,
                email: member.email,
                photoURL: member.photoURL,
                tasksAssigned: assignedTasks.length,
                tasksCompleted: completedTasks.length,
                completionRate: assignedTasks.length > 0
                    ? Math.round((completedTasks.length / assignedTasks.length) * 100)
                    : 0
            }
        })

        // Sort by tasks completed (descending)
        stats.sort((a, b) => b.tasksCompleted - a.tasksCompleted)
        setMemberStats(stats.filter(s => s.tasksAssigned > 0))
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

            if (!response.ok) {
                throw new Error(data.error || "Failed to create task")
            }

            toast.success("Task created successfully!")
            setCreateTaskOpen(false)
            setNewTask({ title: "", description: "", priority: "medium", dueDate: "" })
            await fetchProjectData()
        } catch (err: any) {
            console.error("Error creating task:", err)
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

            if (!response.ok) {
                throw new Error(data.error || "Failed to assign task")
            }

            toast.success("Task assigned successfully!")
            setAssignDialogOpen(false)
            setSelectedTask(null)
            await fetchProjectData()
        } catch (err: any) {
            console.error("Error assigning task:", err)
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

            if (!response.ok) {
                throw new Error(data.error || "Failed to update task")
            }

            toast.success("Task updated!")
            await fetchProjectData()
        } catch (err: any) {
            console.error("Error updating task:", err)
            toast.error(err.message || "Failed to update task")
        }
    }

    const isAdmin = members.find(m => m.id === user?.uid)?.role === "owner" ||
        members.find(m => m.id === user?.uid)?.role === "admin"

    const todoTasks = tasks.filter(t => t.status === "todo")
    const inProgressTasks = tasks.filter(t => t.status === "in-progress")
    const completedTasks = tasks.filter(t => t.status === "completed")

    const formatDate = (date: Date | null) => {
        if (!date) return "No due date"
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
                            <Badge variant="outline" className="capitalize">
                                {project.status.replace('-', ' ')}
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

            {/* Project Stats */}
            <div className="grid gap-4 md:grid-cols-4">
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
                        <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progress}%</div>
                        <Progress value={progress} className="h-2 mt-2" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Tasks Kanban Board */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="kanban">
                        <TabsList>
                            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
                            <TabsTrigger value="list">List View</TabsTrigger>
                        </TabsList>

                        <TabsContent value="kanban" className="space-y-4 mt-6">
                            <div className="grid gap-4 md:grid-cols-3">
                                {/* To Do Column */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">To Do</h3>
                                        <Badge variant="secondary">{todoTasks.length}</Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {todoTasks.map(task => (
                                            <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm">{task.title}</CardTitle>
                                                    {task.description && (
                                                        <CardDescription className="text-xs line-clamp-2">
                                                            {task.description}
                                                        </CardDescription>
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
                                                        {task.assignee ? (
                                                            <Avatar className="w-6 h-6">
                                                                <AvatarImage src={task.assignee.photoURL || undefined} />
                                                                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                                                    {task.assignee.name.substring(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ) : (
                                                            isAdmin && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 text-xs"
                                                                    onClick={() => {
                                                                        setSelectedTask(task)
                                                                        setAssignDialogOpen(true)
                                                                    }}
                                                                >
                                                                    Assign
                                                                </Button>
                                                            )
                                                        )}
                                                    </div>
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
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {todoTasks.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-8">No tasks</p>
                                        )}
                                    </div>
                                </div>

                                {/* In Progress Column */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">In Progress</h3>
                                        <Badge variant="default">{inProgressTasks.length}</Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {inProgressTasks.map(task => (
                                            <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow border-blue-200">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm">{task.title}</CardTitle>
                                                    {task.description && (
                                                        <CardDescription className="text-xs line-clamp-2">
                                                            {task.description}
                                                        </CardDescription>
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
                                                        {task.assignee ? (
                                                            <Avatar className="w-6 h-6">
                                                                <AvatarImage src={task.assignee.photoURL || undefined} />
                                                                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                                                    {task.assignee.name.substring(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ) : (
                                                            isAdmin && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 text-xs"
                                                                    onClick={() => {
                                                                        setSelectedTask(task)
                                                                        setAssignDialogOpen(true)
                                                                    }}
                                                                >
                                                                    Assign
                                                                </Button>
                                                            )
                                                        )}
                                                    </div>
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
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {inProgressTasks.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-8">No tasks</p>
                                        )}
                                    </div>
                                </div>

                                {/* Completed Column */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Completed</h3>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{completedTasks.length}</Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {completedTasks.map(task => (
                                            <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow border-green-200 bg-green-50/30">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm line-through text-muted-foreground">{task.title}</CardTitle>
                                                    {task.description && (
                                                        <CardDescription className="text-xs line-clamp-2">
                                                            {task.description}
                                                        </CardDescription>
                                                    )}
                                                </CardHeader>
                                                <CardContent className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="outline" className="text-xs">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            Done
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
                                                    {task.completedAt && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Completed {formatDate(task.completedAt)}
                                                        </p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {completedTasks.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-8">No tasks</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="list" className="mt-6">
                            <Card>
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {tasks.map(task => (
                                            <div key={task.id} className="p-4 hover:bg-accent/50 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1">
                                                        <h4 className={`font-medium mb-1 ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                            {task.title}
                                                        </h4>
                                                        {task.description && (
                                                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={task.status === 'completed' ? 'outline' : task.status === 'in-progress' ? 'default' : 'secondary'} className="text-xs capitalize">
                                                                {task.status.replace('-', ' ')}
                                                            </Badge>
                                                            <Badge variant={
                                                                task.priority === "high" ? "destructive" :
                                                                    task.priority === "medium" ? "default" : "outline"
                                                            } className="text-xs capitalize">
                                                                {task.priority}
                                                            </Badge>
                                                            {task.assignee && (
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <User className="w-3 h-3" />
                                                                    {task.assignee.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isAdmin && !task.assignee && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedTask(task)
                                                                setAssignDialogOpen(true)
                                                            }}
                                                        >
                                                            Assign
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {tasks.length === 0 && (
                                            <div className="p-12 text-center text-muted-foreground">
                                                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No tasks yet. Create your first task to get started!</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Member Statistics Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Top Contributors
                            </CardTitle>
                            <CardDescription>Members who completed the most tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {memberStats.slice(0, 5).map((stat, index) => (
                                <div key={stat.userId} className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={stat.photoURL || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                            {stat.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{stat.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {stat.tasksCompleted} tasks completed
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {stat.completionRate}%
                                    </Badge>
                                </div>
                            ))}
                            {memberStats.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No task assignments yet
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Team Members</CardTitle>
                            <CardDescription>{members.length} members</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {members.map(member => {
                                const stats = memberStats.find(s => s.userId === member.id)
                                return (
                                    <div key={member.id} className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={member.photoURL || undefined} />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                                {member.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{member.name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                                        </div>
                                        {stats && (
                                            <Badge variant="outline" className="text-xs">
                                                {stats.tasksAssigned} tasks
                                            </Badge>
                                        )}
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                </div>
            </div>

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
                    <div className="space-y-4 py-4">
                        <div className="space-y-3">
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
                                    {memberStats.find(s => s.userId === member.id)?.tasksAssigned && (
                                        <Badge variant="secondary" className="text-xs">
                                            {memberStats.find(s => s.userId === member.id)?.tasksAssigned} tasks
                                        </Badge>
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={assigning}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
