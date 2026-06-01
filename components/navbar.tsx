'use client'

import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut } from 'lucide-react'

type Profile = {
  full_name: string
  avatar_url: string
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = async (userId: string) => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    setUnreadCount(count ?? 0)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
      if (profileData) setProfile(profileData)

      await fetchUnreadCount(user.id)

      // Poll every 30 seconds
      const interval = setInterval(() => fetchUnreadCount(user.id), 30000)
      return () => clearInterval(interval)
    }

    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const NAV_LINKS = [
    { label: 'Services Available', href: '/services' },
    { label: 'Shoutout Requests', href: '/requests' },
    { label: 'Dashboard', href: '/dashboard' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Image
          src="/logo.png"
          alt="SkillSwap"
          width={120}
          height={32}
          className="object-contain cursor-pointer"
          onClick={() => router.push('/services')}
        />

        <div className="flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? 'text-black font-semibold'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {link.label}
            </button>
          ))}

          <button
            onClick={() => router.push('/notifications')}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              pathname === '/notifications'
                ? 'text-black font-semibold'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Notification
            {unreadCount > 0 && (
              <span className="bg-gray-900 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-9 h-9">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-semibold">
                {profile?.full_name?.charAt(0) ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-xs text-gray-400">Halo!</p>
              <p className="text-sm font-bold leading-tight">
                {profile?.full_name?.split(' ').slice(0, 2).join(' ') ?? 'User'}
              </p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors ml-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}