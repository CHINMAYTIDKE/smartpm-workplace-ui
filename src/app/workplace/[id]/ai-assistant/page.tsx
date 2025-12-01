"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, FileText, ListChecks, BarChart3, Code, Lightbulb } from "lucide-react"

const quickActions = [
  { id: 1, icon: FileText, label: "Summarize project", description: "Get a summary of current project status" },
  { id: 2, icon: ListChecks, label: "Create task list", description: "Generate tasks from requirements" },
  { id: 3, icon: BarChart3, label: "Analyze metrics", description: "Review team performance metrics" },
  { id: 4, icon: Code, label: "Code review", description: "Get AI-powered code suggestions" },
]

const conversations = [
  { id: 1, message: "What are our top priorities this week?", time: "10:30 AM", isUser: true },
  {
    id: 2,
    message: "Based on your current backlog and deadlines, here are your top priorities:\n\n1. **API Integration** - Due in 2 days, currently at 60% completion\n2. **Mobile App Bug Fixes** - 8 critical bugs need attention\n3. **User Authentication** - Blocked by security review\n\nWould you like me to help prioritize tasks or create a sprint plan?",
    time: "10:30 AM",
    isUser: false
  },
  { id: 3, message: "Create a sprint plan for next week", time: "10:32 AM", isUser: true },
  {
    id: 4,
    message: "I've created a draft sprint plan for next week:\n\n**Sprint Goals:**\n- Complete API integration\n- Resolve all critical bugs\n- Begin user testing phase\n\n**Team Capacity:** 5 developers × 40 hours = 200 hours\n**Recommended Story Points:** 80-100\n\nI've assigned tasks based on team member expertise. Would you like me to adjust the distribution?",
    time: "10:32 AM",
    isUser: false
  },
]

export default function AIAssistantPage() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState(conversations)

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: true
      }])
      setMessage("")
      
      // Simulate AI response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          message: "I'm processing your request. This is a simulated AI response demonstrating the assistant's capabilities.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isUser: false
        }])
      }, 1000)
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
                      className="w-full p-3 text-left rounded-lg hover:bg-accent transition-colors border"
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
                <Badge variant="secondary" className="w-full justify-start">Code Review</Badge>
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
                      <div className={`rounded-lg px-4 py-2 ${
                        msg.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex items-end gap-2">
                <Input
                  placeholder="Ask me anything about your projects..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
