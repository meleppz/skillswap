'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Plus, Star, Package,
  TrendingUp, ToggleLeft, ToggleRight,
  Edit, Trash2, Inbox
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Service = {
  id: string
  title: string
  price_min: number
  price_max: number | null
  is_available: boolean
  categories: { name: string } | null
  reviews: { rating: number }[]
  orders: { id: string }[]
}

type Order = {
  id: string
  status: string
  created_at: string
  message: string | null
  profiles: {
    full_name: string
    prodi: string
    whatsapp: string
  } | null
  services: {
    title: string
  } | null
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'Dikerjakan', color: 'bg-blue-100 text-blue-700' },
  done: { label: 'Selesai', color: 'bg-green-100 text-green-700' },
}

export default function ProviderPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [inbox, setInbox] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (profileData) setProfile(profileData)

      // Get services
      const { data: servicesData } = await supabase
        .from('services')
        .select(`
          id, title, price_min, price_max, is_available,
          categories ( name ),
          reviews ( rating ),
          orders ( id )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })

      if (servicesData) setServices(servicesData as Service[])

      // Get orders (inbox)
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id, status, created_at, message,
          profiles ( full_name, prodi, whatsapp ),
          services ( title )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersData) setInbox(ordersData as Order[])

      setLoading(false)
    }
    init()
  }, [])

  const toggleAvailability = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('services')
      .update({ is_available: !current })
      .eq('id', id)

    if (!error) {
      setServices(prev =>
        prev.map(s => s.id === id ? { ...s, is_available: !current } : s)
      )
    }
  }

  const deleteService = async (id: string) => {
    const confirmed = window.confirm('Yakin mau hapus jasa ini?')
    if (!confirmed) return

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (!error) {
      setServices(prev => prev.filter(s => s.id !== id))
    }
  }

  const updateOrderStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      setInbox(prev =>
        prev.map(o => o.id === id ? { ...o, status: newStatus } : o)
      )
    }
  }

  const getAvgRating = (reviews: { rating: number }[]) => {
    if (!reviews?.length) return null
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    return avg.toFixed(1)
  }

  const formatPrice = (min: number, max?: number | null) => {
    const fmt = (n: number) => `Rp${(n / 1000).toFixed(0)}rb`
    return max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
  }

  const pendingCount = inbox.filter(o => o.status === 'pending').length
  const totalOrders = inbox.length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Memuat dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Kembali ke Home</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-sm font-semibold text-blue-600">Provider Mode</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Provider Dashboard 🛠️</h1>
            <p className="text-muted-foreground text-sm">
              Kelola jasa dan order kamu di sini.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <Package className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{services.length}</p>
              <p className="text-xs text-muted-foreground">Jasa Aktif</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
              <Inbox className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Menunggu</p>
            </div>
            <div className="bg-muted/50 border border-border rounded-xl p-4 text-center">
              <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-bold">{totalOrders}</p>
              <p className="text-xs text-muted-foreground">Total Order</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="services">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="services" className="flex-1">Jasa Saya</TabsTrigger>
              <TabsTrigger value="inbox" className="flex-1">
                Inbox
                {pendingCount > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services">
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/provider/new-service')}
                  className="w-full p-4 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Jasa Baru
                </button>

                {services.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Belum ada jasa yang ditawarkan</p>
                  </div>
                )}

                {services.map((service, i) => {
                  const avgRating = getAvgRating(service.reviews)
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 border border-border rounded-xl"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {service.categories?.name ?? 'Lainnya'}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-sm leading-snug">
                            {service.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-blue-600">
                          {formatPrice(service.price_min, service.price_max)}
                        </p>
                        {avgRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{avgRating}</span>
                            <span className="text-xs text-muted-foreground">
                              ({service.reviews.length})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Belum ada ulasan</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <button
                          onClick={() => toggleAvailability(service.id, service.is_available)}
                          className="flex items-center gap-2 text-sm"
                        >
                          {service.is_available ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-blue-600" />
                              <span className="text-blue-600 font-medium">Tersedia</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                              <span className="text-muted-foreground">Tidak Tersedia</span>
                            </>
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => router.push(`/provider/edit-service/${service.id}`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => deleteService(service.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Inbox Tab */}
            <TabsContent value="inbox">
              {inbox.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Belum ada order masuk</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inbox.map((order, i) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 border border-border rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm">
                            {order.profiles?.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.profiles?.prodi}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_LABEL[order.status].color}`}>
                          {STATUS_LABEL[order.status].label}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mb-1">
                        {order.services?.title}
                      </p>
                      {order.message && (
                        <p className="text-sm bg-muted/50 rounded-lg p-3 mb-3">
                          "{order.message}"
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                            onClick={() => updateOrderStatus(order.id, 'in_progress')}
                          >
                            Mulai Kerjain
                          </Button>
                        )}
                        {order.status === 'in_progress' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-xs h-8"
                            onClick={() => updateOrderStatus(order.id, 'done')}
                          >
                            Tandai Selesai ✓
                          </Button>
                        )}
                        {order.status === 'done' && (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Order selesai
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground ml-auto">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}