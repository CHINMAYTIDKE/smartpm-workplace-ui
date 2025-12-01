"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Hash, Send, Paperclip, Smile, MoreVertical, Plus, Search } from "lucide-react"

const channels = [
  { id: 1, name: "general", unread: 0 },
  { id: 2, name: "development", unread: 3 },
  { id: 3, name: "design", unread: 1 },
  { id: 4, name: "marketing", unread: 0 },
]

const messages = [
  { id: 1, user: "John Doe", avatar: "JD", content: "Hey team, just pushed the latest changes to the dev branch", time: "10:30 AM", isOwn: false },
  { id: 2, user: "Sarah Smith", avatar: "SS", content: "Great! I'll review them this afternoon", time: "10:32 AM", isOwn: false },
  { id: 3, user: "You", avatar: "ME", content: "Thanks John! Can you also check the PR I submitted?", time: "10:35 AM", isOwn: true },
  { id: 4, user: "John Doe", avatar: "JD", content: "Sure thing! Looking at it now", time: "10:36 AM", isOwn: false },
  { id: 5, user: "Mike Johnson", avatar: "MJ", content: "Anyone available for a quick sync on the API integration?", time: "10:45 AM", isOwn: false },
]

export default function ChatPage() {
  const [message, setMessage] = useState("")
  const [selectedChannel, setSelectedChannel] = useState(channels[1])

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message)
      setMessage("")
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Channels Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Channels</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-9" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors ${
                  selectedChannel.id === channel.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span>{channel.name}</span>
                </div>
                {channel.unread > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                    {channel.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="h-14 border-b px-6 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">{selectedChannel.name}</h2>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isOwn ? "flex-row-reverse" : ""}`}>
                <Avatar className="w-10 h-10">
                  <AvatarFallback>{msg.avatar}</AvatarFallback>
                </Avatar>
                <div className={`flex-1 max-w-2xl ${msg.isOwn ? "items-end" : ""}`}>
                  <div className={`flex items-baseline gap-2 mb-1 ${msg.isOwn ? "flex-row-reverse" : ""}`}>
                    <span className="font-semibold text-sm">{msg.user}</span>
                    <span className="text-xs text-muted-foreground">{msg.time}</span>
                  </div>
                  <div className={`rounded-lg px-4 py-2 ${
                    msg.isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4 bg-card">
          <div className="flex items-end gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 border rounded-lg bg-background">
              <Input
                placeholder={`Message #${selectedChannel.name}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleSendMessage} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
