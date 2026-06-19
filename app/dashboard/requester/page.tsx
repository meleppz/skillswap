'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Star, Edit, Trash2, Clock, Wallet } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/navbar'
import {
  notifyOrderCancelledByClient,
  notifyOrderConfirmedByClient,
  notifyNewRating,
  notifyRequestCancelledByRequester,
  notifyRequestConfirmedByRequester,
  notifyRefundRequested,
  notifyRefundApproved,
} from '@/lib/notifications'
import ReviewModal from '@/components/modals/review-modal'
import CancelModal from '@/components/modals/cancel-modal'
import RefundModal from '@/components/modals/refund-modal'

type Request = {
  id: string
  title: string
  price_min: number
  price_max: number | null
  deadline: string
  status: string
  cancel_reason: string | null
  payment_status: string | null
  amount: number | null
  refund_requested_by: string | null
  provider_id: string | null
  reviewed?: boolean
  categories: { name: string } | null
  profiles: { full_name: string; prodi: string; avatar_url: string } | null
}

type Order = {
  id: string
  status: string
  created_at: string
  cancel_reason: string | null
  payment_status: string | null
  amount: number | null
  refund_requested_by: string | null
  provider_id: string
  profiles: { full_name: string; prodi: string; avatar_url: string } | null
  services: { title: string } | null
  reviewed: boolean
}

const statusColor = (s: string) => {
  if (s === 'ongoing' || s === 'active') return 'bg-[#4AC204]/10 text-[#4AC204]'
  if (s === 'completed') return 'bg-[#4AC204]/10 text-[#4AC204]'
  if (s === 'need_review') return 'bg-blue-100 text-blue-700'
  if (s === 'freeze' || s === 'expired') return 'bg-gray-100 text-gray-500'
  if (s.startsWith('cancelled')) return 'bg-[#FF474A]/10 text-[#FF474A]'
  return 'bg-gray-100 text-gray-500'
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  ongoing: { label: 'Menunggu', color: 'bg-[#4AC204]/10 text-[#4AC204]' },
  need_review: { label: 'Perlu Konfirmasi', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Selesai', color: 'bg-[#4AC204]/10 text-[#4AC204]' },
  cancelled_by_client: { label: 'Dibatalkan oleh Kamu', color: 'bg-[#FF474A]/10 text-[#FF474A]' },
  cancelled_by_provider: { label: 'Dibatalkan oleh Provider', color: 'bg-[#FF474A]/10 text-[#FF474A]' },
}

const PAYMENT_BADGE: Record<string, { label: string; color: string }> = {
  unpaid: { label: 'Belum Bayar', color: 'bg-orange-100 text-orange-700' },
  paid: { label: 'Lunas', color: 'bg-[#4AC204]/10 text-[#4AC204]' },
  refund_requested: { label: 'Refund Diajukan', color: 'bg-yellow-100 text-yellow-700' },
  refunded: { label: 'Direfund', color: 'bg-gray-100 text-gray-500' },
  settled: { label: 'Dana Dikirim', color: 'bg-blue-100 text-blue-700' },
}

export default function RequesterDashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeSection, setActiveSection] = useState<'requests' | 'orders'>('requests')
  const [activeRequestFilter, setActiveRequestFilter] = useState('Semua')
  const [activeOrderFilter, setActiveOrderFilter] = useState('Semua')
  const [loading, setLoading] = useState(true)
  const [cancelDialog, setCancelDialog] = useState<{
    id: string; type: 'order' | 'request'; title: string; role: 'client' | 'provider'
  } | null>(null)
  const [refundDialog, setRefundDialog] = useState<{
    orderId: string; title: string; amount: number; providerId: string
  } | null>(null)
  const [reviewTarget, setReviewTarget] = useState<{
    orderId: string; serviceTitle: string; providerName: string
    providerProdi: string; providerAngkatan: string; providerAvatar: string
  } | null>(null)
  const [requestReviewTarget, setRequestReviewTarget] = useState<{
    requestId: string; requestTitle: string; providerName: string
    providerProdi: string; providerAngkatan: string; providerAvatar: string
  } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: requestsData } = await supabase
        .from('requests')
        .select(`
          id, title, price_min, price_max, deadline, status, cancel_reason,
          payment_status, amount, refund_requested_by, provider_id,
          categories ( name ),
          profiles!requests_provider_id_fkey ( full_name, prodi, avatar_url )
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      if (requestsData) {
        const requestIds = requestsData.map(r => r.id)
        const { data: reviewsData } = await supabase
          .from('reviews').select('request_id').in('request_id', requestIds)
        const reviewedIds = new Set(reviewsData?.map(r => r.request_id) ?? [])
        setRequests(requestsData.map(r => ({ ...r, reviewed: reviewedIds.has(r.id) })) as unknown as Request[])
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id, status, created_at, cancel_reason,
          payment_status, amount, refund_requested_by, provider_id,
          profiles!orders_provider_id_fkey ( full_name, prodi, avatar_url ),
          services ( title )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersData) {
        const orderIds = ordersData.map(o => o.id)
        const { data: reviewsData } = await supabase
          .from('reviews').select('order_id').in('order_id', orderIds)
        const reviewedIds = new Set(reviewsData?.map(r => r.order_id) ?? [])
        setOrders(ordersData.map(o => ({ ...o, reviewed: reviewedIds.has(o.id) })) as unknown as Order[])
      }

      setLoading(false)
    }
    init()
  }, [])

  const deleteRequest = async (id: string) => {
    if (!window.confirm('Yakin mau hapus request ini?')) return
    const { error } = await supabase.from('requests').delete().eq('id', id)
    if (!error) setRequests(prev => prev.filter(r => r.id !== id))
  }

  const toggleRequestStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'freeze' : 'active'
    const { error } = await supabase.from('requests').update({ status: newStatus }).eq('id', id)
    if (!error) setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
  }

  const handleCancel = async (reason: string) => {
    if (!cancelDialog || !reason.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    const { data: userProfile } = await supabase
      .from('profiles').select('full_name').eq('id', user!.id).single()
    const userName = userProfile?.full_name ?? 'User'

    if (cancelDialog.type === 'order') {
      const { data: orderData } = await supabase
        .from('orders').select('provider_id, payment_status, amount, services(title)').eq('id', cancelDialog.id).single()

      const updatePayload: Record<string, unknown> = { status: 'cancelled_by_client', cancel_reason: reason }

      if (orderData?.payment_status === 'paid' && orderData.amount) {
        const { data: clientProfile } = await supabase
          .from('profiles').select('balance').eq('id', user!.id).single()
        await supabase.from('profiles')
          .update({ balance: (clientProfile?.balance ?? 0) + orderData.amount }).eq('id', user!.id)
        updatePayload.payment_status = 'refunded'
      }

      const { error } = await supabase.from('orders').update(updatePayload).eq('id', cancelDialog.id)
      if (!error && orderData) {
        await notifyOrderCancelledByClient(orderData.provider_id, userName, (orderData.services as any)?.title ?? '')
        setOrders(prev => prev.map(o => o.id === cancelDialog.id
          ? { ...o, status: 'cancelled_by_client', cancel_reason: reason, payment_status: updatePayload.payment_status as string ?? o.payment_status }
          : o))
      }
    } else {
      const req = requests.find(r => r.id === cancelDialog.id)
      const { data: reqData } = await supabase
        .from('requests').select('provider_id, payment_status, amount, title').eq('id', cancelDialog.id).single()

      const updatePayload: Record<string, unknown> = {
        status: 'cancelled_by_client', cancel_reason: reason, provider_id: null
      }

      if (reqData?.payment_status === 'paid' && reqData.amount) {
        const { data: clientProfile } = await supabase
          .from('profiles').select('balance').eq('id', user!.id).single()
        await supabase.from('profiles')
          .update({ balance: (clientProfile?.balance ?? 0) + reqData.amount }).eq('id', user!.id)
        updatePayload.payment_status = 'refunded'
      }

      const { error } = await supabase.from('requests').update(updatePayload).eq('id', cancelDialog.id)
      if (!error && reqData) {
        if (reqData.provider_id) {
          await notifyRequestCancelledByRequester(reqData.provider_id, userName, reqData.title)
        }
        setRequests(prev => prev.map(r => r.id === cancelDialog.id
          ? { ...r, status: 'cancelled_by_client', cancel_reason: reason, payment_status: updatePayload.payment_status as string ?? r.payment_status }
          : r))
      }
    }

    setCancelDialog(null)
  }

  const handleRefundRequest = async (reason: string) => {
    if (!refundDialog || !userId) return
    const { data: clientProfile } = await supabase
      .from('profiles').select('full_name').eq('id', userId).single()
    const { error } = await supabase
      .from('orders').update({ payment_status: 'refund_requested', refund_requested_by: userId })
      .eq('id', refundDialog.orderId)
    if (!error) {
      await notifyRefundRequested(refundDialog.providerId, clientProfile?.full_name ?? 'User', refundDialog.title)
      setOrders(prev => prev.map(o =>
        o.id === refundDialog.orderId ? { ...o, payment_status: 'refund_requested', refund_requested_by: userId } : o))
    }
    setRefundDialog(null)
  }

  const handleApproveRefund = async (id: string, type: 'order' | 'request') => {
    if (type === 'order') {
      const order = orders.find(o => o.id === id)
      if (!order || !order.amount) return
      const { data: clientData } = await supabase.from('profiles').select('balance').eq('id', userId!).single()
      await supabase.from('profiles')
        .update({ balance: (clientData?.balance ?? 0) + order.amount }).eq('id', userId!)
      await supabase.from('orders')
        .update({ payment_status: 'refunded', refund_approved: true, status: 'cancelled_by_provider' })
        .eq('id', id)
      await notifyRefundApproved(userId!, order.services?.title ?? '')
      setOrders(prev => prev.map(o =>
        o.id === id ? { ...o, payment_status: 'refunded', status: 'cancelled_by_provider' } : o))
    } else {
      const request = requests.find(r => r.id === id)
      if (!request || !request.amount) return
      const { data: clientData } = await supabase.from('profiles').select('balance').eq('id', userId!).single()
      await supabase.from('profiles')
        .update({ balance: (clientData?.balance ?? 0) + request.amount }).eq('id', userId!)
      await supabase.from('requests')
        .update({ payment_status: 'refunded', refund_approved: true, status: 'cancelled_by_provider' })
        .eq('id', id)
      await notifyRefundApproved(userId!, request.title)
      setRequests(prev => prev.map(r =>
        r.id === id ? { ...r, payment_status: 'refunded', status: 'cancelled_by_provider' } : r))
    }
  }

  const confirmOrderDone = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: orderData } = await supabase
      .from('orders')
      .select('provider_id, payment_status, amount, services(title)')
      .eq('id', id)
      .single()
    if (!orderData) return

    const { data: clientProfile } = await supabase
      .from('profiles').select('full_name').eq('id', user.id).single()

    const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', id)
    if (error) return

    if (orderData.payment_status === 'paid' && orderData.amount) {
      await supabase.rpc('add_balance', { user_id: orderData.provider_id, amount: orderData.amount })
    }

    await notifyOrderConfirmedByClient(
      orderData.provider_id, clientProfile?.full_name ?? '', (orderData.services as any)?.title ?? ''
    )
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, status: 'completed', payment_status: orderData.payment_status === 'paid' ? 'settled' : o.payment_status } : o))
  }

  const confirmRequestDone = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: reqData } = await supabase
      .from('requests')
      .select('provider_id, title, payment_status, amount')
      .eq('id', id)
      .single()
    if (!reqData || !reqData.provider_id) return

    const { data: requesterProfile } = await supabase
      .from('profiles').select('full_name').eq('id', user.id).single()

    const { error } = await supabase.from('requests').update({ status: 'completed' }).eq('id', id)
    if (error) return

    if (reqData.payment_status === 'paid' && reqData.amount) {
      await supabase.rpc('add_balance', { user_id: reqData.provider_id, amount: reqData.amount })
    }

    await notifyRequestConfirmedByRequester(reqData.provider_id, requesterProfile?.full_name ?? '', reqData.title)
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'completed', payment_status: reqData.payment_status === 'paid' ? 'settled' : r.payment_status } : r))
  }

  const handleReviewSubmit = async (orderId: string, rating: number, comment: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: clientProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const { data: orderData } = await supabase.from('orders').select('provider_id, service_id, services(title)').eq('id', orderId).single()
    if (orderData) {
      await supabase.from('reviews').insert({
        order_id: orderId, service_id: orderData.service_id,
        client_id: user.id, provider_id: orderData.provider_id, rating, comment,
      })
      await notifyNewRating(orderData.provider_id, clientProfile?.full_name ?? '', (orderData.services as any)?.title ?? '', rating)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, reviewed: true } : o))
    }
    setReviewTarget(null)
  }

  const handleRequestReviewSubmit = async (requestId: string, rating: number, comment: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: clientProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const { data: reqData } = await supabase.from('requests').select('provider_id, title').eq('id', requestId).single()
    if (reqData && reqData.provider_id) {
      await supabase.from('reviews').insert({
        request_id: requestId, client_id: user.id, provider_id: reqData.provider_id, rating, comment,
      })
      await notifyNewRating(reqData.provider_id, clientProfile?.full_name ?? '', reqData.title, rating)
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, reviewed: true } : r))
    }
    setRequestReviewTarget(null)
  }

  const fmt = (min: number, max?: number | null) => {
    const f = (n: number) => `Rp${n.toLocaleString('id-ID')}`
    return max ? `${f(min)} – ${f(max)}` : f(min)
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  const filteredRequests = requests.filter(r => {
    if (activeRequestFilter === 'Aktif') return r.status === 'active'
    if (activeRequestFilter === 'Ongoing') return r.status === 'ongoing' || r.status === 'need_review'
    if (activeRequestFilter === 'Selesai') return r.status === 'completed'
    if (activeRequestFilter === 'Dibatalkan') return r.status.startsWith('cancelled')
    if (activeRequestFilter === 'Freeze') return r.status === 'freeze'
    return true
  })

  const filteredOrders = orders.filter(o => {
    if (activeOrderFilter === 'Menunggu') return o.status === 'ongoing'
    if (activeOrderFilter === 'Selesai') return o.status === 'completed'
    if (activeOrderFilter === 'Dibatalkan') return o.status.startsWith('cancelled')
    return true
  })

  const filterBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
      active ? 'bg-[#074DDB] text-white border-[#074DDB]' : 'bg-white text-gray-600 border-gray-200'
    }`

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center h-96"><p className="text-gray-400">Memuat dashboard...</p></div>
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
            Dashboard Pencarian Jasa
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { key: 'requests', label: 'Service Dicari', count: requests.length },
            { key: 'orders', label: 'Service yang Sedang Dipakai', count: orders.length },
          ].map(stat => (
            <button key={stat.key} onClick={() => setActiveSection(stat.key as any)}
              className={`bg-white/80 backdrop-blur-sm border rounded-2xl p-5 text-center transition-all ${
                activeSection === stat.key ? 'border-[#074DDB] shadow-sm' : 'border-gray-200'
              }`}>
              <p className="text-5xl mb-1" style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}>{stat.count}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </button>
          ))}
        </div>

        {/* Requests */}
        {activeSection === 'requests' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Service Dicari</h2>
              <button onClick={() => router.push('/requests/new')}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black transition-colors">
                <Plus className="w-4 h-4" />Tambah
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              {['Semua', 'Aktif', 'Ongoing', 'Selesai', 'Freeze', 'Dibatalkan'].map(f => (
                <button key={f} onClick={() => setActiveRequestFilter(f)} className={filterBtn(activeRequestFilter === f)}>{f}</button>
              ))}
            </div>
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><p className="text-sm">Belum ada request</p></div>
              ) : filteredRequests.map((request, i) => {
                const payBadge = request.payment_status ? PAYMENT_BADGE[request.payment_status] : null
                const refundRequestedByOther = request.payment_status === 'refund_requested' && request.refund_requested_by !== userId
                const refundRequestedByMe = request.payment_status === 'refund_requested' && request.refund_requested_by === userId

                return (
                  <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`text-xs rounded-full ${statusColor(request.status)}`}>
                            {request.status === 'active' ? 'Aktif' : request.status === 'ongoing' ? 'Sedang Dikerjakan'
                              : request.status === 'need_review' ? 'Perlu Konfirmasi' : request.status === 'completed' ? 'Selesai'
                              : request.status === 'freeze' ? 'Freeze' : request.status === 'expired' ? 'Expired'
                              : request.status === 'cancelled_by_client' ? 'Dibatalkan oleh Kamu' : 'Dibatalkan oleh Provider'}
                          </Badge>
                          {payBadge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payBadge.color}`}>
                              {payBadge.label}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm">{request.title}</h3>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold">{fmt(request.price_min, request.price_max)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-400">Deadline: {formatDate(request.deadline)}</p>
                        </div>
                      </div>
                    </div>

                    {request.profiles && (request.status === 'ongoing' || request.status === 'need_review') && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={request.profiles.avatar_url} />
                          <AvatarFallback className="text-xs">{request.profiles.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="text-xs text-gray-600">Dikerjakan oleh <span className="font-medium">{request.profiles.full_name}</span></p>
                      </div>
                    )}

                    {request.cancel_reason && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-3">Alasan: {request.cancel_reason}</p>
                    )}

                    {(request.status === 'active' || request.status === 'freeze') && (
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="text-xs rounded-xl"
                          onClick={() => router.push(`/requests/edit/${request.id}`)}>
                          <Edit className="w-3 h-3 mr-1" />Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs rounded-xl"
                          onClick={() => toggleRequestStatus(request.id, request.status)}>
                          {request.status === 'active' ? 'Freeze' : 'Aktifkan'}
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs rounded-xl text-[#FF474A] hover:border-[#FF474A]/30"
                          onClick={() => deleteRequest(request.id)}>
                          <Trash2 className="w-3 h-3 mr-1" />Hapus
                        </Button>
                      </div>
                    )}

                    {/* Unpaid ongoing — show "Bayar Sekarang" */}
                    {request.status === 'ongoing' && (!request.payment_status || request.payment_status === 'unpaid') && (
                      <div className="space-y-2">
                        <Button size="sm" className="w-full text-xs rounded-xl bg-[#FF6647] hover:bg-[#e5583d] text-white"
                          onClick={() => router.push(`/payment/request/${request.id}`)}>
                          Bayar Sekarang
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs rounded-xl text-[#FF474A] hover:border-[#FF474A]/30"
                          onClick={() => setCancelDialog({ id: request.id, type: 'request', title: request.title, role: 'client' })}>
                          Batalkan Request
                        </Button>
                      </div>
                    )}

                    {/* Paid ongoing — cancel (refund) */}
                    {request.status === 'ongoing' && request.payment_status === 'paid' && !refundRequestedByMe && !refundRequestedByOther && (
                      <Button variant="outline" size="sm" className="w-full text-xs rounded-xl text-[#FF474A] hover:border-[#FF474A]/30"
                        onClick={() => setCancelDialog({ id: request.id, type: 'request', title: request.title, role: 'client' })}>
                        Batalkan Request
                      </Button>
                    )}

                    {refundRequestedByOther && (
                      <div className="space-y-2">
                        <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg p-2">
                          Provider mengajukan refund. Setujui untuk mengembalikan dana.
                        </p>
                        <Button size="sm" className="w-full text-xs rounded-xl bg-[#FF6647] hover:bg-[#e5583d] text-white"
                          onClick={() => handleApproveRefund(request.id, 'request')}>
                          Setujui Refund
                        </Button>
                      </div>
                    )}

                    {refundRequestedByMe && (
                      <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg p-2">
                        Menunggu persetujuan refund dari provider.
                      </p>
                    )}

                    {request.status === 'need_review' && (
                      <Button size="sm" className="w-full text-xs rounded-xl bg-[#FF6647] hover:bg-[#e5583d] text-white"
                        onClick={() => confirmRequestDone(request.id)}>
                        Tandai Selesai ✓
                      </Button>
                    )}

                    {request.status === 'completed' && !request.reviewed && (
                      <Button size="sm" className="w-full text-xs rounded-xl bg-[#FF6647] hover:bg-[#e5583d] text-white"
                        onClick={() => setRequestReviewTarget({
                          requestId: request.id, requestTitle: request.title,
                          providerName: request.profiles?.full_name ?? '',
                          providerProdi: request.profiles?.prodi ?? '',
                          providerAngkatan: '', providerAvatar: request.profiles?.avatar_url ?? '',
                        })}>
                        <Star className="w-3 h-3 mr-1" />Beri Ulasan
                      </Button>
                    )}
                    {request.status === 'completed' && request.reviewed && (
                      <p className="text-xs text-[#4AC204] font-medium text-center">✓ Sudah diulas</p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Orders */}
        {activeSection === 'orders' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-bold text-lg mb-4">Service yang Sedang Dipakai</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Menunggu', count: orders.filter(o => o.status === 'ongoing').length },
                { label: 'Dibatalkan', count: orders.filter(o => o.status.startsWith('cancelled')).length },
                { label: 'Selesai', count: orders.filter(o => o.status === 'completed').length },
              ].map(stat => (
                <div key={stat.label} className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-4 text-center">
                  <p className="text-4xl mb-1" style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}>{stat.count}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              {['Semua', 'Menunggu', 'Selesai', 'Dibatalkan'].map(f => (
                <button key={f} onClick={() => setActiveOrderFilter(f)} className={filterBtn(activeOrderFilter === f)}>{f}</button>
              ))}
            </div>
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><p className="text-sm">Tidak ada pesanan</p></div>
              ) : filteredOrders.map((order, i) => {
                const payBadge = order.payment_status ? PAYMENT_BADGE[order.payment_status] : null
                const refundRequestedByOther = order.payment_status === 'refund_requested' && order.refund_requested_by !== userId
                const refundRequestedByMe = order.payment_status === 'refund_requested' && order.refund_requested_by === userId

                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5">
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
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={`text-xs rounded-full ${ORDER_STATUS[order.status]?.color}`}>
                          {ORDER_STATUS[order.status]?.label}
                        </Badge>
                        {payBadge && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payBadge.color}`}>
                            {payBadge.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-sm mb-1">{order.services?.title}</h3>
                    <p className="text-xs text-gray-400 mb-1">{formatDate(order.created_at)}</p>
                    {order.amount && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                        <Wallet className="w-3 h-3" />{`Rp${order.amount.toLocaleString('id-ID')}`}
                      </p>
                    )}

                    {order.cancel_reason && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-3">Alasan: {order.cancel_reason}</p>
                    )}

                    {order.status === 'ongoing' && order.payment_status === 'unpaid' && (
                      <Button size="sm" className="w-full text-xs rounded-xl bg-[#FF6647] hover:bg-[#e5583d] text-white"
                        onClick={() => router.push(`/payment/${order.id}`)}>
                        Bayar Sekarang
                      </Button>
                    )}

                    {order.status === 'ongoing' && order.payment_status === 'paid' && !refundRequestedByMe && !refundRequestedByOther && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="text-xs rounded-xl text-[#FF474A] hover:border-[#FF474A]/30"
                          onClick={() => setCancelDialog({ id: order.id, type: 'order', title: order.services?.title ?? '', role: 'client' })}>
                          Batalkan
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs rounded-xl text-gray-400" disabled>
                          Menunggu Provider
                        </Button>
                      </div>
                    )}

                    {refundRequestedByOther && (
                      <div className="space-y-2">
                        <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg p-2">
                          Provider mengajukan refund. Setujui untuk mengembalikan dana.
                        </p>
                        <Button size="sm" className="w-full text-xs rounded-xl bg-[#FF6647] hover:bg-[#e5583d] text-white"
                          onClick={() => handleApproveRefund(order.id, 'order')}>
                          Setujui Refund
                        </Button>
                      </div>
                    )}

                    {refundRequestedByMe && (
                      <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg p-2">
                        Menunggu persetujuan refund dari provider.
                      </p>
                    )}

                    {order.status === 'need_review' && (
                      <Button size="sm" className="w-full text-xs rounded-xl bg-[#FF6647] hover:bg-[#e5583d] text-white"
                        onClick={() => confirmOrderDone(order.id)}>
                        Tandai Selesai ✓
                      </Button>
                    )}

                    {order.status === 'completed' && !order.reviewed && (
                      <Button size="sm" className="w-full text-xs rounded-xl bg-[#FF6647] hover:bg-[#e5583d] text-white"
                        onClick={() => setReviewTarget({
                          orderId: order.id, serviceTitle: order.services?.title ?? '',
                          providerName: order.profiles?.full_name ?? '',
                          providerProdi: order.profiles?.prodi ?? '',
                          providerAngkatan: '', providerAvatar: order.profiles?.avatar_url ?? '',
                        })}>
                        <Star className="w-3 h-3 mr-1" />Beri Ulasan
                      </Button>
                    )}
                    {order.status === 'completed' && order.reviewed && (
                      <p className="text-xs text-[#4AC204] font-medium text-center">✓ Sudah diulas</p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      <CancelModal
        open={!!cancelDialog}
        title={cancelDialog?.title ?? ''}
        type={cancelDialog?.type ?? 'order'}
        role={cancelDialog?.role ?? 'client'}
        onClose={() => setCancelDialog(null)}
        onConfirm={(reason) => handleCancel(reason)}
      />

      <RefundModal
        open={!!refundDialog}
        title={refundDialog?.title ?? ''}
        amount={refundDialog?.amount ?? 0}
        onClose={() => setRefundDialog(null)}
        onConfirm={handleRefundRequest}
      />

      {reviewTarget && (
        <ReviewModal
          open={!!reviewTarget}
          orderId={reviewTarget.orderId}
          serviceTitle={reviewTarget.serviceTitle}
          providerName={reviewTarget.providerName}
          providerProdi={reviewTarget.providerProdi}
          providerAngkatan={reviewTarget.providerAngkatan}
          providerAvatar={reviewTarget.providerAvatar}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {requestReviewTarget && (
        <ReviewModal
          open={!!requestReviewTarget}
          orderId={requestReviewTarget.requestId}
          serviceTitle={requestReviewTarget.requestTitle}
          providerName={requestReviewTarget.providerName}
          providerProdi={requestReviewTarget.providerProdi}
          providerAngkatan={requestReviewTarget.providerAngkatan}
          providerAvatar={requestReviewTarget.providerAvatar}
          onClose={() => setRequestReviewTarget(null)}
          onSubmit={(id, rating, comment) => handleRequestReviewSubmit(id, rating, comment)}
        />
      )}
    </div>
  )
}
