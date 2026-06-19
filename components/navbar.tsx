'use client'

import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Wallet } from 'lucide-react'

type Profile = {
  full_name: string
  avatar_url: string
  balance: number
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
        .select('full_name, avatar_url, balance')
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
    <nav className="sticky top-0 z-50 bg-[#074DDB] border-b border-[#074DDB]/20 px-8 py-4">
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
                  ? 'text-white font-bold'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}

          <button
            onClick={() => router.push('/notifications')}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              pathname === '/notifications'
                ? 'text-white font-bold'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Notification
            {unreadCount > 0 && (
              <span className="bg-white text-[#074DDB] text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {profile?.balance !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full">
              <Wallet className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white">
                Rp{profile.balance.toLocaleString('id-ID')}
              </span>
            </div>
          )}
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-9 h-9">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                {profile?.full_name?.charAt(0) ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-xs text-white/70">Halo!</p>
              <p className="text-sm font-bold leading-tight text-white">
                {profile?.full_name?.split(' ').slice(0, 2).join(' ') ?? 'User'}
              </p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors ml-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}