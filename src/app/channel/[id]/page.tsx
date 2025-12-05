'use client'

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, ArrowUp } from "lucide-react" // Added ArrowUp icon

type Message = {
  id: string
  content: string
  inserted_at: string 
  user_id: string
  profiles?: { username: string }
}

export default function ChannelPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()
  const channelId = params.id
  const MESSAGE_LIMIT = 20

  // Helper: Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 1. Initial Load (Fetch newest 20)
  useEffect(() => {
    const getInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(username)')
        .eq('channel_id', channelId)
        .order('inserted_at', { ascending: false }) // Get NEWEST first
        .limit(MESSAGE_LIMIT)
      
      if (!error && data) {
        // Reverse them so they show up chronologically (Old -> New)
        setMessages(data.reverse())
        setTimeout(scrollToBottom, 100)
      }
    }
    getInitialData()

    // 2. Realtime Subscription
    const channel = supabase
      .channel(`room:${channelId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, 
        (payload) => {
          const fetchNewMsgUser = async () => {
            const { data } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', payload.new.user_id)
              .single()
              
            const newMsg = { ...payload.new, profiles: data } as Message
            setMessages((current) => [...current, newMsg])
            // Scroll to bottom only if user is already near bottom
            setTimeout(scrollToBottom, 100)
          }
          fetchNewMsgUser()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

  // 3. Load Older Messages (Pagination)
  const loadOlderMessages = async () => {
    if (messages.length === 0) return
    setLoadingMore(true)

    const oldestMessageId = messages[0].id // Get the ID of the top message we have

    // Find messages OLDER than the top one we see
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(username)')
      .eq('channel_id', channelId)
      .lt('inserted_at', messages[0].inserted_at) // Less Than date
      .order('inserted_at', { ascending: false })
      .limit(MESSAGE_LIMIT)

    if (!error && data && data.length > 0) {
      // Add older messages to the START of the list
      setMessages((prev) => [...data.reverse(), ...prev])
    }
    setLoadingMore(false)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return

    const msg_content = newMessage
    setNewMessage("") 

    const { error } = await supabase.from('messages').insert({
      content: msg_content,
      channel_id: channelId,
      user_id: currentUser.id
    })

    if (error) {
      console.error(error)
      setNewMessage(msg_content)
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* PAGINATION BUTTON */}
        <div className="flex justify-center mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadOlderMessages} 
            disabled={loadingMore}
            className="text-xs text-gray-500"
          >
            {loadingMore ? "Loading..." : "Load Previous Messages"}
          </Button>
        </div>

        {messages.map((msg) => {
          const isMe = msg.user_id === currentUser?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg p-3 ${
                isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                {!isMe && <div className="text-xs font-bold mb-1 text-gray-500">{msg.profiles?.username || 'Unknown'}</div>}
                <p>{msg.content}</p>
                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.inserted_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}