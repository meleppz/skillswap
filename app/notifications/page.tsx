'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/navbar'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

type GroupedNotifications = {
  label: string
  notifications: Notification[]
}

const TYPE_ICON: Record<string, string> = {
  new_order: '📦',
  order_cancelled_by_client: '❌',
  order_cancelled_by_provider: '❌',
  order_done_by_provider: '✅',
  order_confirmed_by_client: '🎉',
  new_rating: '⭐',
  request_taken: '🙌',
  request_done_by_provider: '✅',
  request_cancelled_by_provider: '❌',
  request_cancelled_by_requester: '❌',
  request_confirmed_by_requester: '🎉',
}

export default function NotificationsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ avatar_url: string } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()
      if (profileData) setProfile(profileData)

      await fetchNotifications(user.id)
    }
    init()
  }, [])

  const fetchNotifications = async (userId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (data) setNotifications(data as Notification[])
    setLoading(false)
  }

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markOneRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  const groupNotifications = (notifs: Notification[]): GroupedNotifications[] => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    const today: Notification[] = []
    const thisWeek: Notification[] = []
    const older: Notification[] = []

    notifs.forEach(n => {
      const date = new Date(n.created_at)
      if (date >= todayStart) {
        today.push(n)
      } else if (date >= weekStart) {
        thisWeek.push(n)
      } else {
        older.push(n)
      }
    })

    const groups: GroupedNotifications[] = []
    if (today.length > 0) groups.push({ label: 'Hari Ini', notifications: today })
    if (thisWeek.length > 0) groups.push({ label: 'Minggu Ini', notifications: thisWeek })
    if (older.length > 0) groups.push({ label: 'Lebih Lama', notifications: older })

    return groups
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const grouped = groupNotifications(filtered)
  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Memuat notifikasi...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1
              className="text-4xl"
              style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
            >
              Notifikasi
            </h1>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-xl"
                onClick={markAllRead}
              >
                Tandai Sudah Dibaca
              </Button>
            )}
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-8">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'unread', label: `Belum Dibaca${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as 'all' | 'unread')}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  filter === f.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Notifications */}
          {grouped.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-4">🔔</p>
              <p className="text-sm">Belum ada notifikasi</p>
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map(group => (
                <div key={group.label}>
                  <h2
                    className="text-2xl mb-4"
                    style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
                  >
                    {group.label}
                  </h2>
                  <div className="space-y-0">
                    {group.notifications.map((notif, i) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-start gap-4 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 px-2 rounded-xl transition-colors ${
                          !notif.is_read ? 'bg-white' : ''
                        }`}
                        onClick={() => markOneRead(notif.id)}
                      >
                        {/* Avatar / Icon */}
                        <div className="relative shrink-0">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                              {TYPE_ICON[notif.type] ?? '🔔'}
                            </AvatarFallback>
                          </Avatar>
                          {!notif.is_read && (
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gray-900 rounded-full border-2 border-gray-50" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>
                            {!notif.is_read && (
                              <span className="text-gray-900 mr-1">NEW:</span>
                            )}
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>

                        {/* Time */}
                        <p className="text-xs text-gray-400 shrink-0">
                          {!notif.is_read ? 'Baru Saja' : formatTime(notif.created_at)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-8 mt-16">
        <div className="max-w-5xl mx-auto text-center">
          <p
            className="text-5xl uppercase mb-6"
            style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
          >
            SKILLSWAP!
          </p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-lg mx-auto">
            SkillSwap! Platform Original Konsolidasi Ekonomi Mikro Jasa Peer-to-Peer Mahasiswa.<br />
            Dikembangkan secara khusus sebagai pemenuhan komponen teknis nilai UAS pada mata kuliah II2210 Teknologi Platform.<br />
            Sekolah Teknik Elektro dan Informatika, Institut Teknologi Bandung. Semester II Tahun Akademik 2025/2026.<br />
            © 2026 SkillSwap. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </footer>
    </div>
  )
}