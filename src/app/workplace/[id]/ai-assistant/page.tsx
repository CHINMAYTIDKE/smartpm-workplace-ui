"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, FileText, ListChecks, BarChart3, Code, Lightbulb, Loader2 } from "lucide-react"
import { auth } from "@/lib/firebase.config"
import { onAuthStateChanged } from "firebase/auth"

interface Message {
  id: number
  message: string
  time: string
  isUser: boolean
}

interface QuickAction {
  id: string
  icon: any
  label: string
  description: string
  actionType: string
}

const quickActions: QuickAction[] = [
  { id: "1", icon: FileText, label: "Summarize project", description: "Get a summary of current project status", actionType: "summarize" },
  { id: "2", icon: ListChecks, label: "Create task list", description: "Generate tasks from requirements", actionType: "create_tasks" },
  { id: "3", icon: BarChart3, label: "Analyze metrics", description: "Review team performance metrics", actionType: "analyze_metrics" },
  { id: "4", icon: Code, label: "Assign tasks", description: "Auto-assign tasks based on workload", actionType: "assign_tasks" },
]

export default function AIAssistantPage() {
  const params = useParams()
  const workspaceId = params.id as string

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userUid, setUserUid] = useState<string | null>(null)

  // Load conversation history and auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserUid(user.uid)
      } else {
        setUserUid(null)
        setError("Please sign in to use the AI assistant")
      }
    })

    // TODO: Fetch conversation history from API
    // For now, show welcome message
    setMessages([{
      id: 1,
      message: "👋 Hello! I'm your AI assistant. I can help you with:\n\n• Analyzing project status\n• Creating and assigning tasks\n• Reviewing team metrics\n• Planning sprints\n\nHow can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: false
    }])

    return () => unsubscribe()
  }, [workspaceId])

  const handleSendMessage = async () => {
    if (message.trim() && !isLoading) {
      if (!userUid) {
        setError("Please sign in to use the AI assistant")
        return
      }

      const userMessage = message.trim()
      setMessage("")
      setError(null)

      // Add user message
      const newUserMessage: Message = {
        id: messages.length + 1,
        message: userMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: true
      }
      setMessages(prev => [...prev, newUserMessage])

      setIsLoading(true)

      try {
        const response = await fetch(`/api/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-firebase-uid": userUid
          },
          body: JSON.stringify({
            workspaceId,
            message: userMessage,
            conversationHistory: messages
          })
        })

        if (!response.ok) {
          throw new Error("Failed to get AI response")
        }

        const data = await response.json()

        // Add AI response
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          message: data.response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isUser: false
        }])
      } catch (err) {
        setError("AI assistant is not configured yet. Please set up your AI API key in environment variables.")
        console.error("AI chat error:", err)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleQuickAction = async (action: QuickAction) => {
    if (!userUid) {
      setError("Please sign in to use the AI assistant")
      return
    }

    setError(null)

    // Add user message for the action
    const actionMessage: Message = {
      id: messages.length + 1,
      message: action.label,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true
    }
    setMessages(prev => [...prev, actionMessage])

    setIsLoading(true)

    try {
      const response = await fetch(`/api/ai/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-firebase-uid": userUid
        },
        body: JSON.stringify({
          workspaceId,
          actionType: action.actionType
        })
      })

      if (!response.ok) {
        throw new Error("Failed to execute action")
      }

      const data = await response.json()

      // Add AI response
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        message: data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: false
      }])
    } catch (err) {
      setError("AI assistant is not configured yet. Please set up your AI API key in environment variables.")
      console.error("AI action error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
        </div>
        <p className="text-muted-foreground">Your intelligent project management companion</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4 h-[calc(100%-100px)]">
        {/* Quick Actions Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      disabled={isLoading}
                      className="w-full p-3 text-left rounded-lg hover:bg-accent transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm mb-0.5">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Capabilities</h3>
              <div className="space-y-2">
                <Badge variant="secondary" className="w-full justify-start">Task Management</Badge>
                <Badge variant="secondary" className="w-full justify-start">Sprint Planning</Badge>
                <Badge variant="secondary" className="w-full justify-start">Data Analysis</Badge>
                <Badge variant="secondary" className="w-full justify-start">Auto-Assignment</Badge>
                <Badge variant="secondary" className="w-full justify-start">Documentation</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col h-full">
          <CardContent className="p-0 flex flex-col h-full">
            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.isUser ? "flex-row-reverse" : ""}`}>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {msg.isUser ? "ME" : <Sparkles className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-2xl ${msg.isUser ? "items-end" : ""}`}>
                      <div className={`flex items-baseline gap-2 mb-1 ${msg.isUser ? "flex-row-reverse" : ""}`}>
                        <span className="font-semibold text-sm">
                          {msg.isUser ? "You" : "AI Assistant"}
                        </span>
                        <span className="text-xs text-muted-foreground">{msg.time}</span>
                      </div>
                      <div className={`rounded-lg px-4 py-2 ${msg.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                        }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        <Sparkles className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 max-w-2xl">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm">AI Assistant</span>
                        <span className="text-xs text-muted-foreground">typing...</span>
                      </div>
                      <div className="rounded-lg px-4 py-2 bg-muted">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex items-end gap-2">
                <Input
                  placeholder="Ask me anything about your projects..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={isLoading} size="icon">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
