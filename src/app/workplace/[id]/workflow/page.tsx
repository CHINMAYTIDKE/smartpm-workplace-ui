"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Zap, ArrowRight, Clock, Users, Mail, MessageSquare, CheckCircle2, Loader2, XCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Workflow, AITask } from "@/lib/models/workflow"

const triggerTypes = [
  { icon: Clock, label: "Schedule", description: "Run at specific times" },
  { icon: CheckCircle2, label: "Task Event", description: "When tasks change status" },
  { icon: Users, label: "Team Event", description: "When team members join/leave" },
  { icon: MessageSquare, label: "Comment Added", description: "When someone comments" },
]

const actionTypes = [
  { icon: Mail, label: "Send Email", description: "Send email notifications" },
  { icon: MessageSquare, label: "Slack Message", description: "Post to Slack channel" },
  { icon: Users, label: "Assign Task", description: "Auto-assign to team member" },
  { icon: Zap, label: "Webhook", description: "Trigger external service" },
]

const AI_TASK_STATUS_CONFIG = {
  'in-progress': { color: 'bg-blue-500', icon: Loader2, label: 'In Progress' },
  'completed': { color: 'bg-green-500', icon: CheckCircle2, label: 'Completed' },
  'failed': { color: 'bg-red-500', icon: XCircle, label: 'Failed' },
  'cancelled': { color: 'bg-gray-500', icon: AlertCircle, label: 'Cancelled' },
  'pending': { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
}

export default function WorkflowPage() {
  const params = useParams()
  const workspaceId = params?.id as string
  const { user } = useAuth()

  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [aiTasks, setAITasks] = useState<AITask[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [testingWorkflow, setTestingWorkflow] = useState<string | null>(null)
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    trigger: "",
    action: ""
  })

  // Check user role
  useEffect(() => {
    const checkRole = async () => {
      if (user && workspaceId) {
        try {
          const response = await fetch(`/api/workspaces/${workspaceId}/role?userId=${user.uid}`)
          const data = await response.json()
          setIsAdmin(data.role === 'admin' || data.role === 'owner')
        } catch (error) {
          console.error('Error checking role:', error)
          setIsAdmin(false)
        } finally {
          setCheckingRole(false)
        }
      }
    }
    checkRole()
  }, [user, workspaceId])

  // Fetch workflows and AI tasks
  useEffect(() => {
    if (workspaceId && isAdmin) {
      fetchWorkflows()
      fetchAITasks()

      // Poll for AI task updates every 3 seconds
      const interval = setInterval(fetchAITasks, 3000)
      return () => clearInterval(interval)
    }
  }, [workspaceId, isAdmin])

  const fetchWorkflows = async () => {
    if (!user) {
      console.log('fetchWorkflows: No user available')
      return
    }
    try {
      console.log('Fetching workflows for workspace:', workspaceId, 'user:', user.uid)
      const response = await fetch(`/api/workflows?workspaceId=${workspaceId}&userId=${user.uid}`)
      const data = await response.json()

      if (!response.ok) {
        console.error('Failed to fetch workflows:', data.error)
        alert(`Error fetching workflows: ${data.error}`)
        return
      }

      console.log('Fetched workflows:', data.workflows)
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error('Error fetching workflows:', error)
      alert('Failed to load workflows. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAITasks = async () => {
    try {
      const response = await fetch(`/api/workflows/ai-tasks?workspaceId=${workspaceId}`)
      const data = await response.json()
      setAITasks(data.aiTasks || [])
    } catch (error) {
      console.error('Error fetching AI tasks:', error)
    }
  }

  const handleToggleWorkflow = async (id: string, currentStatus: boolean) => {
    if (!user) return
    try {
      await fetch('/api/workflows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus, userId: user.uid })
      })

      // Update local state
      setWorkflows(prev => prev.map(w =>
        w.id === id ? { ...w, isActive: !currentStatus } : w
      ))
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const handleCreateWorkflow = async () => {
    if (!user || !newWorkflow.name || !newWorkflow.trigger || !newWorkflow.action) {
      alert('Please fill in all fields')
      return
    }

    try {
      console.log('Creating workflow:', {
        workspaceId,
        name: newWorkflow.name,
        trigger: newWorkflow.trigger,
        action: newWorkflow.action,
        createdBy: user.uid
      })

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: newWorkflow.name,
          description: '',
          trigger: {
            type: newWorkflow.trigger.split('-')[0],
            config: {}
          },
          action: {
            type: newWorkflow.action,
            config: {}
          },
          createdBy: user.uid
        })
      })

      const result = await response.json()
      console.log('Create workflow response:', response.status, result)

      if (response.ok) {
        console.log('Workflow created successfully, ID:', result.id)
        setCreateDialogOpen(false)
        setNewWorkflow({ name: "", trigger: "", action: "" })

        // Wait a bit for Firestore to update, then fetch
        setTimeout(() => {
          console.log('Fetching workflows after creation...')
          fetchWorkflows()
        }, 500)

        alert('✅ Workflow created successfully!')
      } else {
        console.error('Failed to create workflow:', result.error)
        alert(`Failed to create workflow: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
      alert('Failed to create workflow. Check console for details.')
    }
  }

  const handleTestWorkflow = async (workflowId: string) => {
    if (!user) return
    try {
      setTestingWorkflow(workflowId)
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          context: { workspaceId },
          userId: user.uid
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(`✅ ${result.message}`)
        fetchWorkflows() // Refresh to update run count
      } else {
        alert(`❌ ${result.error || 'Failed to execute workflow'}`)
      }
    } catch (error) {
      console.error('Error testing workflow:', error)
      alert('Failed to execute workflow')
    } finally {
      setTestingWorkflow(null)
    }
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return
    }

    try {
      const response = await fetch(`/api/workflows?id=${workflowId}&userId=${user.uid}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setWorkflows(prev => prev.filter(w => w.id !== workflowId))
        alert('✅ Workflow deleted successfully')
      } else {
        alert('Failed to delete workflow')
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('Failed to delete workflow')
    }
  }

  const handleUseTemplate = (templateName: string) => {
    if (templateName === 'task-reminders') {
      setNewWorkflow({
        name: 'Task Due Date Reminders',
        trigger: 'schedule-daily',
        action: 'send-email'
      })
    } else if (templateName === 'smart-assignment') {
      setNewWorkflow({
        name: 'Smart Task Assignment',
        trigger: 'task-created',
        action: 'assign-task'
      })
    }
    setCreateDialogOpen(true)
  }

  const handleCancelAITask = async (taskId: string) => {
    if (!user) return
    try {
      await fetch('/api/workflows/ai-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, action: 'cancel', userId: user.uid })
      })
      fetchAITasks()
    } catch (error) {
      console.error('Error cancelling AI task:', error)
    }
  }

  const activeWorkflowsCount = workflows.filter(w => w.isActive).length
  const totalRuns = workflows.reduce((sum, w) => sum + (w.runs || 0), 0)
  const recentAITasks = aiTasks.filter(t =>
    t.status === 'in-progress' || t.status === 'pending'
  )

  if (loading || checkingRole) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          Only workspace admins can access the Workflow Manager. Please contact your workspace administrator if you need access.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workflow Manager</h1>
          <p className="text-muted-foreground">Automate your team's processes and save time</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Set up automation rules to streamline your team's work
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  placeholder="e.g., Auto-assign urgent tasks"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger</Label>
                <Select
                  value={newWorkflow.trigger}
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger: value })}
                >
                  <SelectTrigger id="trigger">
                    <SelectValue placeholder="Select a trigger..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task-created">When task is created</SelectItem>
                    <SelectItem value="task-completed">When task is completed</SelectItem>
                    <SelectItem value="task-overdue">When task becomes overdue</SelectItem>
                    <SelectItem value="schedule-daily">Every day</SelectItem>
                    <SelectItem value="schedule-weekly">Every week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select
                  value={newWorkflow.action}
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, action: value })}
                >
                  <SelectTrigger id="action">
                    <SelectValue placeholder="Select an action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send-email">Send email notification</SelectItem>
                    <SelectItem value="send-slack">Send Slack message</SelectItem>
                    <SelectItem value="assign-task">Assign task</SelectItem>
                    <SelectItem value="create-task">Create new task</SelectItem>
                    <SelectItem value="webhook">Call webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflowsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentAITasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Tasks Section */}
      {aiTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">AI Automated Tasks</h2>
          <div className="space-y-3">
            {aiTasks.slice(0, 5).map((task) => {
              const statusConfig = AI_TASK_STATUS_CONFIG[task.status]
              const StatusIcon = statusConfig.icon

              return (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg ${statusConfig.color} bg-opacity-20 flex items-center justify-center`}>
                          <StatusIcon className={`w-5 h-5 ${task.status === 'in-progress' ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{task.name}</h3>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={task.status === 'completed' ? 'default' : task.status === 'failed' ? 'destructive' : 'secondary'}>
                          {statusConfig.label}
                        </Badge>

                        {task.status === 'in-progress' && task.cancellable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelAITask(task.id)}
                          >
                            Stop
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Workflow Templates */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Start Templates</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Task Due Date Reminders</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Automatically remind team members about upcoming deadlines
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">Schedule</Badge>
                    <ArrowRight className="w-3 h-3" />
                    <Badge variant="outline">Email</Badge>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleUseTemplate('task-reminders')}>Use Template</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Smart Task Assignment</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Auto-assign tasks based on team capacity and expertise
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">Task Created</Badge>
                    <ArrowRight className="w-3 h-3" />
                    <Badge variant="outline">Assign</Badge>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleUseTemplate('smart-assignment')}>Use Template</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Workflows */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Workflows</h2>
        {workflows.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first workflow to automate your team's processes
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <p className="text-sm text-muted-foreground">{workflow.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 ml-13">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">{workflow.trigger.type}</Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <Badge variant="secondary">{workflow.action.type}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {workflow.runs || 0} runs
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={workflow.isActive}
                          onCheckedChange={() => handleToggleWorkflow(workflow.id, workflow.isActive)}
                        />
                        <Label className="text-sm">
                          {workflow.isActive ? "Active" : "Inactive"}
                        </Label>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestWorkflow(workflow.id)}
                        disabled={testingWorkflow === workflow.id}
                      >
                        {testingWorkflow === workflow.id ? 'Testing...' : 'Test'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
