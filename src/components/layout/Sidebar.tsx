'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Hash, LogOut, User, Circle } from "lucide-react"
import { createClient } from "@/lib/supabase"

type Channel = {
  id: string
  slug: string
}

type OnlineUser = {
  user_id: string
  username: string
  online_at: string
}

export function Sidebar() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // 1. Get Current User & Channels
    const getInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data } = await supabase.from('channels').select('*').order('slug', { ascending: true })
      if (data) setChannels(data)
    }
    getInitialData()

    // 2. PRESENCE: Subscribe to "global" room
    const channel = supabase.channel('global_presence')
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const users = [] as OnlineUser[]
        
        for (const id in newState) {
          // FIXED: Added "as OnlineUser" so TypeScript knows the shape of the data
          const user_info = newState[id][0] as unknown as OnlineUser
          if (user_info && user_info.username) {
            users.push(user_info)
          }
        }
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
            
            await channel.track({
              user_id: user.id,
              username: profile?.username || 'Unknown',
              online_at: new Date().toISOString(),
            })
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleCreateChannel = async () => {
    const name = prompt("Enter new channel name (no spaces):")
    if (!name) return
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const { error } = await supabase
      .from('channels')
      .insert([{ slug, created_by: (await supabase.auth.getUser()).data.user?.id }])
    
    if (!error) window.location.reload()
  }

  return (
    <div className="h-screen w-64 border-r bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-800 font-bold text-lg flex items-center justify-between">
        <span>Team Chat</span>
        <Button onClick={handleCreateChannel} size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-6">
        {/* CHANNELS SECTION */}
        <div>
          <div className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase">Channels</div>
          <nav className="flex flex-col gap-1">
            {channels.map((channel) => (
              <Link key={channel.id} href={`/channel/${channel.id}`}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2 ${
                    pathname === `/channel/${channel.id}` ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <Hash className="h-4 w-4" />
                  {channel.slug}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        {/* ONLINE USERS SECTION */}
        <div>
          <div className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase flex items-center justify-between">
            <span>Online — {onlineUsers.length}</span>
          </div>
          <div className="flex flex-col gap-1 px-2">
            {onlineUsers.map((user, idx) => (
              <div key={user.user_id + idx} className="flex items-center gap-2 text-sm text-gray-300 py-1">
                <div className="relative">
                  <User className="h-4 w-4 text-gray-400" />
                  <Circle className="h-2 w-2 absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500 border-2 border-gray-900 rounded-full box-content" />
                </div>
                <span>{user.username} {user.user_id === currentUser?.id && "(You)"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <div className="text-sm font-medium">Connected</div>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}