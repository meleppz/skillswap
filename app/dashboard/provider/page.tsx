'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Star, ToggleLeft, ToggleRight, Edit, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/navbar'
import {
  notifyOrderCancelledByProvider,
  notifyOrderDoneByProvider,
  notifyRequestCancelledByProvider,
  notifyRequestDoneByProvider,
} from '@/lib/notifications'

type Service = {
  id: string
  title: string
  price_min: number
  price_max: number | null
  is_available: boolean
  categories: { name: string } | null
  reviews: { rating: number }[]
}

type Order = {
  id: string
  status: string
  created_at: string
  cancel_reason: string | null
  profiles: { full_name: string; prodi: string; angkatan: string; avatar_url: string } | null
  services: { title: string } | null
}

type RequestOrder = {
  id: string
  title: string
  deadline: string
  status: string
  cancel_reason: string | null
  profiles: { full_name: string; prodi: string; angkatan: string; avatar_url: string } | null
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  ongoing: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
  need_review: { label: 'Perlu Review', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Selesai', color: 'bg-green-100 text-green-700' },
  cancelled_by_client: { label: 'Dibatalkan Client', color: 'bg-red-100 text-red-700' },
  cancelled_by_provider: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
}

export default function ProviderDashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [requestOrders, setRequestOrders] = useState<RequestOrder[]>([])
  const [activeSection, setActiveSection] = useState<'services' | 'orders' | 'request_orders'>('services')
  const [activeServiceFilter, setActiveServiceFilter] = useState('Semua')
  const [activeOrderFilter, setActiveOrderFilter] = useState('Semua')
  const [loading, setLoading] = useState(true)
  const [cancelDialog, setCancelDialog] = useState<{ id: string; type: 'order' | 'request' } | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: servicesData } = await supabase
        .from('services')
        .select(`
          id, title, price_min, price_max, is_available,
          categories ( name ),
          reviews ( rating )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
      if (servicesData) setServices(servicesData as Service[])

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id, status, created_at, cancel_reason,
          profiles!orders_client_id_fkey ( full_name, prodi, angkatan, avatar_url ),
          services ( title )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
      if (ordersData) setOrders(ordersData as Order[])

      const { data: requestOrdersData } = await supabase
        .from('requests')
        .select(`
          id, title, deadline, status, cancel_reason,
          profiles!requests_requester_id_fkey ( full_name, prodi, angkatan, avatar_url )
        `)
        .eq('provider_id', user.id)
        .not('status', 'eq', 'active')
        .not('status', 'eq', 'freeze')
        .not('status', 'eq', 'expired')
        .order('created_at', { ascending: false })
      if (requestOrdersData) setRequestOrders(requestOrdersData as RequestOrder[])

      setLoading(false)
    }
    init()
  }, [])

  const toggleAvailability = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('services')
      .update({ is_available: !current })
      .eq('id', id)
    if (!error) setServices(prev => prev.map(s => s.id === id ? { ...s, is_available: !current } : s))
  }

  const deleteService = async (id: string) => {
    if (!window.confirm('Yakin mau hapus jasa ini?')) return
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (!error) setServices(prev => prev.filter(s => s.id !== id))
  }

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (!error) {
      if (status === 'need_review') {
        const { data: orderData } = await supabase
          .from('orders')
          .select('client_id, services(title)')
          .eq('id', id)
          .single()
        if (orderData) {
          await notifyOrderDoneByProvider(
            orderData.client_id,
            (orderData.services as any)?.title ?? ''
          )
        }
      }
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    }
  }

  const updateRequestStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('requests').update({ status }).eq('id', id)
    if (!error) {
      if (status === 'need_review') {
        const { data: reqData } = await supabase
          .from('requests')
          .select('requester_id, title')
          .eq('id', id)
          .single()
        if (reqData) {
          await notifyRequestDoneByProvider(reqData.requester_id, reqData.title)
        }
      }
      setRequestOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    }
  }

  const handleCancel = async () => {
    if (!cancelDialog || !cancelReason.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    const { data: providerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user!.id)
      .single()
    const providerName = providerProfile?.full_name ?? 'Provider'

    if (cancelDialog.type === 'order') {
      const { data: orderData } = await supabase
        .from('orders')
        .select('client_id, services(title)')
        .eq('id', cancelDialog.id)
        .single()

      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled_by_provider', cancel_reason: cancelReason })
        .eq('id', cancelDialog.id)

      if (!error && orderData) {
        await notifyOrderCancelledByProvider(
          orderData.client_id,
          providerName,
          (orderData.services as any)?.title ?? ''
        )
        setOrders(prev => prev.map(o => o.id === cancelDialog.id
          ? { ...o, status: 'cancelled_by_provider', cancel_reason: cancelReason } : o))
      }
    } else {
      const { data: reqData } = await supabase
        .from('requests')
        .select('requester_id, title')
        .eq('id', cancelDialog.id)
        .single()

      const { error } = await supabase
        .from('requests')
        .update({
          status: 'cancelled_by_provider',
          cancel_reason: cancelReason,
          provider_id: null,
        })
        .eq('id', cancelDialog.id)

      if (!error && reqData) {
        await notifyRequestCancelledByProvider(
          reqData.requester_id,
          providerName,
          reqData.title
        )
        setRequestOrders(prev => prev.filter(o => o.id !== cancelDialog.id))
      }
    }

    setCancelDialog(null)
    setCancelReason('')
  }

  const getAvgRating = (reviews: { rating: number }[]) => {
    if (!reviews?.length) return null
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  }

  const formatPrice = (min: number, max?: number | null) => {
    const fmt = (n: number) => `Rp${n.toLocaleString('id-ID')}`
    return max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  const filteredServices = services.filter(s => {
    if (activeServiceFilter === 'Aktif') return s.is_available
    if (activeServiceFilter === 'Freeze') return !s.is_available
    return true
  })

  const filteredOrders = orders.filter(o => {
    if (activeOrderFilter === 'Menunggu') return o.status === 'ongoing'
    if (activeOrderFilter === 'Selesai') return o.status === 'completed'
    if (activeOrderFilter === 'Dibatalkan') return o.status.startsWith('cancelled')
    return true
  })

  const filteredRequestOrders = requestOrders.filter(o => {
    if (activeOrderFilter === 'Menunggu') return o.status === 'ongoing'
    if (activeOrderFilter === 'Selesai') return o.status === 'completed'
    if (activeOrderFilter === 'Dibatalkan') return o.status.startsWith('cancelled')
    return true
  })

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Memuat dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-4xl" style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}>
            Dashboard Penyedia Jasa
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { key: 'services', label: 'Service Ditawarkan', count: services.length },
            { key: 'orders', label: 'Pesanan Masuk', count: orders.length },
            { key: 'request_orders', label: 'Request Dikerjakan', count: requestOrders.length },
          ].map(stat => (
            <button
              key={stat.key}
              onClick={() => setActiveSection(stat.key as any)}
              className={`bg-white border rounded-2xl p-5 text-center transition-all ${
                activeSection === stat.key ? 'border-gray-900 shadow-sm' : 'border-gray-200'
              }`}
            >
              <p className="text-5xl mb-1" style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}>
                {stat.count}
              </p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </button>
          ))}
        </div>

        {/* Services Section */}
        {activeSection === 'services' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Service Ditawarkan</h2>
              <button onClick={() => router.push('/services/new')} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black transition-colors">
                <Plus className="w-4 h-4" />Tambah
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              {['Semua', 'Aktif', 'Freeze'].map(f => (
                <button key={f} onClick={() => setActiveServiceFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeServiceFilter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
                  }`}>{f}</button>
              ))}
            </div>
            <div className="space-y-4">
              {filteredServices.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><p className="text-sm">Belum ada service</p></div>
              ) : filteredServices.map((service, i) => {
                const avg = getAvgRating(service.reviews)
                return (
                  <motion.div key={service.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Badge variant="outline" className={`text-xs rounded-full mb-2 ${service.is_available ? 'border-green-200 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                          {service.is_available ? 'Aktif' : 'Freeze'}
                        </Badge>
                        <h3 className="font-bold text-sm">{service.title}</h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-bold">{formatPrice(service.price_min, service.price_max)}</p>
                        <p className="text-xs text-gray-400">{service.categories?.name}</p>
                      </div>
                      {avg && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{avg}</span>
                          <span className="text-xs text-gray-400">({service.reviews.length})</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Button variant="outline" size="sm" className="text-xs rounded-xl" onClick={() => router.push(`/services/edit/${service.id}`)}>
                        <Edit className="w-3 h-3 mr-1" />Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs rounded-xl" onClick={() => toggleAvailability(service.id, service.is_available)}>
                        {service.is_available ? <><ToggleRight className="w-3 h-3 mr-1" />Freeze</> : <><ToggleLeft className="w-3 h-3 mr-1" />Aktifkan</>}
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs rounded-xl text-red-500 hover:border-red-200" onClick={() => deleteService(service.id)}>
                        <Trash2 className="w-3 h-3 mr-1" />Hapus
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs rounded-xl">
                        <Star className="w-3 h-3 mr-1" />Rating
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Orders Section */}
        {activeSection === 'orders' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-bold text-lg mb-4">Pesanan Masuk</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Menunggu', count: orders.filter(o => o.status === 'ongoing').length },
                { label: 'Selesai', count: orders.filter(o => o.status === 'completed').length },
                { label: 'Dibatalkan', count: orders.filter(o => o.status.startsWith('cancelled')).length },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-4xl mb-1" style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}>{stat.count}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              {['Semua', 'Menunggu', 'Selesai', 'Dibatalkan'].map(f => (
                <button key={f} onClick={() => setActiveOrderFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeOrderFilter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
                  }`}>{f}</button>
              ))}
            </div>
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><p className="text-sm">Tidak ada pesanan</p></div>
              ) : filteredOrders.map((order, i) => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={order.profiles?.avatar_url} />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">{order.profiles?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{order.profiles?.full_name}</p>
                        <p className="text-xs text-gray-500">{order.profiles?.prodi}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs rounded-full ${ORDER_STATUS[order.status]?.color}`}>
                      {ORDER_STATUS[order.status]?.label}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{order.services?.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">{formatDate(order.created_at)}</p>
                  {order.cancel_reason && (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-3">Alasan: {order.cancel_reason}</p>
                  )}
                  {order.status === 'ongoing' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="text-xs rounded-xl text-red-500 hover:border-red-200"
                        onClick={() => setCancelDialog({ id: order.id, type: 'order' })}>Batalkan</Button>
                      <Button size="sm" className="text-xs rounded-xl bg-gray-900 hover:bg-gray-700"
                        onClick={() => updateOrderStatus(order.id, 'need_review')}>Tandai Selesai</Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Request Orders Section */}
        {activeSection === 'request_orders' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-bold text-lg mb-4">Request Dikerjakan</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Menunggu', count: requestOrders.filter(o => o.status === 'ongoing').length },
                { label: 'Selesai', count: requestOrders.filter(o => o.status === 'completed').length },
                { label: 'Dibatalkan', count: requestOrders.filter(o => o.status.startsWith('cancelled')).length },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-4xl mb-1" style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}>{stat.count}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              {['Semua', 'Menunggu', 'Selesai', 'Dibatalkan'].map(f => (
                <button key={f} onClick={() => setActiveOrderFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeOrderFilter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
                  }`}>{f}</button>
              ))}
            </div>
            <div className="space-y-4">
              {filteredRequestOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><p className="text-sm">Tidak ada request</p></div>
              ) : filteredRequestOrders.map((order, i) => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={order.profiles?.avatar_url} />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">{order.profiles?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{order.profiles?.full_name}</p>
                        <p className="text-xs text-gray-500">{order.profiles?.prodi}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs rounded-full ${ORDER_STATUS[order.status]?.color}`}>
                      {ORDER_STATUS[order.status]?.label}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{order.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Deadline: {new Date(order.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {order.cancel_reason && (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-3">Alasan: {order.cancel_reason}</p>
                  )}
                  {order.status === 'ongoing' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="text-xs rounded-xl text-red-500 hover:border-red-200"
                        onClick={() => setCancelDialog({ id: order.id, type: 'request' })}>Batalkan</Button>
                      <Button size="sm" className="text-xs rounded-xl bg-gray-900 hover:bg-gray-700"
                        onClick={() => updateRequestStatus(order.id, 'need_review')}>Tandai Selesai</Button>
                    </div>
                  )}
                  {order.status === 'completed' && (
                    <p className="text-xs text-green-600 font-medium text-center">✓ Selesai</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Cancel Dialog */}
      <AnimatePresence>
        {cancelDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-bold text-lg mb-2">Batalkan?</h3>
              <p className="text-sm text-gray-500 mb-4">Berikan alasan pembatalan.</p>
              <textarea placeholder="Alasan pembatalan..." value={cancelReason}
                onChange={e => setCancelReason(e.target.value)} rows={3}
                className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4" />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl"
                  onClick={() => { setCancelDialog(null); setCancelReason('') }}>Kembali</Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl"
                  disabled={!cancelReason.trim()} onClick={handleCancel}>Batalkan</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}