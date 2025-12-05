'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('') // We need this for the chat!
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false) // Toggle between Login and Sign Up mode
  
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault() // Stop page refresh
    setLoading(true)

    if (isSignUp) {
      // 1. SIGN UP (Sends Username + Email)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username, // Sends username to your SQL Trigger
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
          },
        },
      })
      if (error) {
        alert(error.message)
      } else {
        // Since we turned off "Confirm Email", this logs you in automatically!
        router.push('/')
        router.refresh()
      }
    } else {
      // 2. LOG IN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        alert(error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="text-gray-500">Enter your details to access the team chat.</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {/* Only show Username if Signing Up */}
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username"
                placeholder="Ex: JohnDoe" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email" 
              placeholder="name@example.com" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              type="password" 
              placeholder="••••••••" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </Button>
        </form>

        <div className="text-center text-sm">
          <button 
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}