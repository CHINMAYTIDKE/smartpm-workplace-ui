"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Hash, Send, Paperclip, Smile, MoreVertical, Plus, Search, Loader2 } from "lucide-react"
import {
  listenToChannels,
  listenToMessages,
  sendMessage,
  createChannel,
  updateUserPresence,
  initializeDefaultChannels,
  markMessagesAsRead,
  type Channel,
  type Message,
} from "@/lib/services/chat.service"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { onAuthStateChange } from "@/lib/firebase/auth"

export default function ChatPage() {
  const params = useParams()
  const workspaceId = params?.id as string

  const [message, setMessage] = useState("")
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [currentUserName, setCurrentUserName] = useState<string>("")
  const [newChannelName, setNewChannelName] = useState("")
  const [creatingChannel, setCreatingChannel] = useState(false)

  // Get current user info from Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setCurrentUserId(user.uid)
        // Use display name if available, otherwise use email, or fallback to first part of email
        const userName = user.displayName || user.email?.split("@")[0] || "User"
        setCurrentUserName(userName)
      } else {
        // Fallback if no user is logged in
        setCurrentUserId("temp-user-id")
        setCurrentUserName("Guest User")
      }
    })

    return () => unsubscribe()
  }, [])

  // Initialize default channels and listen to channels
  useEffect(() => {
    if (!workspaceId || !currentUserId) return

    let unsubscribe: (() => void) | undefined

    const setupChannels = async () => {
      try {
        // Initialize default channels if none exist
        await initializeDefaultChannels(workspaceId, currentUserId)

        // Listen to channels in real-time
        unsubscribe = listenToChannels(workspaceId, (fetchedChannels) => {
          setChannels(fetchedChannels)
          if (!selectedChannel && fetchedChannels.length > 0) {
            setSelectedChannel(fetchedChannels[0])
          }
          setLoading(false)
        })

        // Update user presence to online
        await updateUserPresence(workspaceId, currentUserId, "online")
      } catch (error) {
        console.error("Error setting up channels:", error)
        toast.error("Failed to load channels")
        setLoading(false)
      }
    }

    setupChannels()

    // Cleanup: set user offline when component unmounts
    return () => {
      if (unsubscribe) unsubscribe()
      if (workspaceId && currentUserId) {
        updateUserPresence(workspaceId, currentUserId, "offline")
      }
    }
  }, [workspaceId, currentUserId])

  // Listen to messages for selected channel
  useEffect(() => {
    if (!workspaceId || !selectedChannel) return

    const unsubscribe = listenToMessages(
      workspaceId,
      selectedChannel.id,
      (fetchedMessages) => {
        setMessages(fetchedMessages)
        // Mark messages as read when viewing channel
        if (currentUserId) {
          markMessagesAsRead(workspaceId, selectedChannel.id, currentUserId)
        }
      }
    )

    return () => unsubscribe()
  }, [workspaceId, selectedChannel, currentUserId])

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChannel || !currentUserId) return

    setSending(true)
    try {
      const userAvatar = currentUserName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

      await sendMessage(
        workspaceId,
        selectedChannel.id,
        currentUserId,
        currentUserName,
        userAvatar,
        message.trim()
      )
      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !currentUserId) return

    setCreatingChannel(true)
    try {
      await createChannel(workspaceId, newChannelName.trim(), currentUserId)
      setNewChannelName("")
      toast.success(`Channel #${newChannelName} created!`)
    } catch (error) {
      console.error("Error creating channel:", error)
      toast.error("Failed to create channel")
    } finally {
      setCreatingChannel(false)
    }
  }

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return ""
    try {
      const date = timestamp.toDate()
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return ""
    }
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Channels Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Channels</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                const name = prompt("Enter channel name:")
                if (name) {
                  setNewChannelName(name)
                  handleCreateChannel()
                }
              }}
            >
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors ${selectedChannel?.id === channel.id ? "bg-accent" : ""
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span>{channel.name}</span>
                </div>
                {/* Unread count would go here if implemented */}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
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
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.userId === currentUserId
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{msg.userAvatar}</AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 max-w-2xl ${isOwn ? "items-end" : ""}`}>
                          <div
                            className={`flex items-baseline gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""
                              }`}
                          >
                            <span className="font-semibold text-sm">{msg.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(msg.timestamp)}
                            </span>
                          </div>
                          <div
                            className={`rounded-lg px-4 py-2 ${isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                              }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
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
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={sending}
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
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  disabled={sending || !message.trim()}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Hash className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
