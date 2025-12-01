import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    doc,
    setDoc,
    getDocs,
    updateDoc,
    increment,
    arrayUnion,
    getDoc,
} from "firebase/firestore"
import { db } from "../firebase.config"

export interface Message {
    id: string
    channelId: string
    userId: string
    userName: string
    userAvatar: string
    content: string
    timestamp: Timestamp
    readBy: string[]
}

export interface Channel {
    id: string
    name: string
    workspaceId: string
    createdBy: string
    createdAt: Timestamp
    unreadCount?: Record<string, number>
}

export interface UserPresence {
    userId: string
    status: "online" | "offline"
    lastSeen: Timestamp
}

/**
 * Send a message to a channel
 */
export async function sendMessage(
    workspaceId: string,
    channelId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    content: string
): Promise<void> {
    try {
        const messagesRef = collection(db, "workspaces", workspaceId, "messages")
        await addDoc(messagesRef, {
            channelId,
            userId,
            userName,
            userAvatar,
            content,
            timestamp: Timestamp.now(),
            readBy: [userId], // Mark as read by sender
        })
    } catch (error) {
        console.error("Error sending message:", error)
        throw error
    }
}

/**
 * Listen to messages in real-time
 */
export function listenToMessages(
    workspaceId: string,
    channelId: string,
    callback: (messages: Message[]) => void
): () => void {
    const messagesRef = collection(db, "workspaces", workspaceId, "messages")
    const q = query(
        messagesRef,
        where("channelId", "==", channelId),
        orderBy("timestamp", "asc")
    )

    return onSnapshot(q, (snapshot) => {
        const messages: Message[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Message[]
        callback(messages)
    })
}

/**
 * Listen to channels in real-time
 */
export function listenToChannels(
    workspaceId: string,
    callback: (channels: Channel[]) => void
): () => void {
    const channelsRef = collection(db, "workspaces", workspaceId, "channels")
    const q = query(channelsRef, orderBy("createdAt", "asc"))

    return onSnapshot(q, (snapshot) => {
        const channels: Channel[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Channel[]
        callback(channels)
    })
}

/**
 * Create a new channel
 */
export async function createChannel(
    workspaceId: string,
    channelName: string,
    createdBy: string
): Promise<string> {
    try {
        const channelsRef = collection(db, "workspaces", workspaceId, "channels")
        const docRef = await addDoc(channelsRef, {
            name: channelName,
            workspaceId,
            createdBy,
            createdAt: Timestamp.now(),
            unreadCount: {},
        })
        return docRef.id
    } catch (error) {
        console.error("Error creating channel:", error)
        throw error
    }
}

/**
 * Update user presence
 */
export async function updateUserPresence(
    workspaceId: string,
    userId: string,
    status: "online" | "offline"
): Promise<void> {
    try {
        const presenceRef = doc(db, "workspaces", workspaceId, "presence", userId)
        await setDoc(
            presenceRef,
            {
                status,
                lastSeen: Timestamp.now(),
            },
            { merge: true }
        )
    } catch (error) {
        console.error("Error updating presence:", error)
        throw error
    }
}

/**
 * Listen to user presence
 */
export function listenToPresence(
    workspaceId: string,
    callback: (presence: Record<string, UserPresence>) => void
): () => void {
    const presenceRef = collection(db, "workspaces", workspaceId, "presence")

    return onSnapshot(presenceRef, (snapshot) => {
        const presence: Record<string, UserPresence> = {}
        snapshot.docs.forEach((doc) => {
            presence[doc.id] = {
                userId: doc.id,
                ...doc.data(),
            } as UserPresence
        })
        callback(presence)
    })
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
    workspaceId: string,
    channelId: string,
    userId: string
): Promise<void> {
    try {
        const messagesRef = collection(db, "workspaces", workspaceId, "messages")
        const q = query(messagesRef, where("channelId", "==", channelId))
        const snapshot = await getDocs(q)

        const updatePromises = snapshot.docs.map((document) => {
            const messageData = document.data()
            if (!messageData.readBy?.includes(userId)) {
                return updateDoc(doc(db, "workspaces", workspaceId, "messages", document.id), {
                    readBy: arrayUnion(userId),
                })
            }
            return Promise.resolve()
        })

        await Promise.all(updatePromises)
    } catch (error) {
        console.error("Error marking messages as read:", error)
        throw error
    }
}

/**
 * Get unread count for a channel
 */
export async function getUnreadCount(
    workspaceId: string,
    channelId: string,
    userId: string
): Promise<number> {
    try {
        const messagesRef = collection(db, "workspaces", workspaceId, "messages")
        const q = query(messagesRef, where("channelId", "==", channelId))
        const snapshot = await getDocs(q)

        let unreadCount = 0
        snapshot.docs.forEach((doc) => {
            const messageData = doc.data()
            if (!messageData.readBy?.includes(userId)) {
                unreadCount++
            }
        })

        return unreadCount
    } catch (error) {
        console.error("Error getting unread count:", error)
        return 0
    }
}

/**
 * Initialize default channels for a workspace
 */
export async function initializeDefaultChannels(
    workspaceId: string,
    createdBy: string
): Promise<void> {
    const defaultChannels = ["general", "development", "design", "marketing"]

    try {
        const channelsRef = collection(db, "workspaces", workspaceId, "channels")
        const snapshot = await getDocs(channelsRef)

        // Only create default channels if none exist
        if (snapshot.empty) {
            const promises = defaultChannels.map((channelName) =>
                createChannel(workspaceId, channelName, createdBy)
            )
            await Promise.all(promises)
        }
    } catch (error) {
        console.error("Error initializing default channels:", error)
        throw error
    }
}
