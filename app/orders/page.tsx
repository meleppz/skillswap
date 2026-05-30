'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, MessageCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Order = {
  id: string
  status: string
  created_at: string
  message: string | null
  services: {
    id: string
    title: string
    price_min: number
    price_max: number | null
  } | null
  profiles: {
    full_name: string
    prodi: string
    whatsapp: string
  } | null
  reviewed: boolean
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'Dikerjakan', color: 'bg-blue-100 text-blue-700' },
  done: { label: 'Selesai', color: 'bg-green-100 text-green-700' },
}

type ReviewModalProps = {
  orderId: string
  serviceTitle: string
  onClose: () => void
  onSubmit: (orderId: string, rating: number, comment: string) => void
}

function ReviewModal({ orderId, serviceTitle, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hovered, setHovered] = useState(0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-2xl p-6 w-full max-w-md"
      >
        <h2 className="text-lg font-bold mb-1">Beri Ulasan ⭐</h2>
        <p className="text-sm text-muted-foreground mb-6">{serviceTitle}</p>

        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hovered || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          placeholder="Ceritakan pengalamanmu dengan provider ini..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
        />

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={rating === 0}
            onClick={() => onSubmit(orderId, rating, comment)}
          >
            Kirim Ulasan
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function OrdersPage() {
  const supabase = createClient()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewTarget, setReviewTarget] = useState<{
    orderId: string
    serviceTitle: string
  } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id, status, created_at, message,
          services ( id, title, price_min, price_max ),
          profiles!orders_provider_id_fkey ( full_name, prodi, whatsapp )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersData) {
        // Check which orders already have reviews
        const orderIds = ordersData.map(o => o.id)
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('order_id')
          .in('order_id', orderIds)

        const reviewedOrderIds = new Set(reviewsData?.map(r => r.order_id) ?? [])

        const ordersWithReview = ordersData.map(o => ({
          ...o,
          reviewed: reviewedOrderIds.has(o.id),
        }))

        setOrders(ordersWithReview as Order[])
      }

      setLoading(false)
    }
    init()
  }, [])

  const handleReviewSubmit = async (
    orderId: string,
    rating: number,
    comment: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const order = orders.find(o => o.id === orderId)
    if (!order) return

    const { error } = await supabase
      .from('reviews')
      .insert({
        order_id: orderId,
        service_id: order.services?.id,
        client_id: user.id,
        provider_id: null, // will be fetched from order
        rating,
        comment,
      })

    // Get provider_id from order
    const { data: orderData } = await supabase
      .from('orders')
      .select('provider_id')
      .eq('id', orderId)
      .single()

    if (orderData) {
      await supabase
        .from('reviews')
        .update({ provider_id: orderData.provider_id })
        .eq('order_id', orderId)
    }

    if (!error) {
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, reviewed: true } : o)
      )
    }

    setReviewTarget(null)
  }

  const formatPrice = (min: number, max?: number | null) => {
    const fmt = (n: number) => `Rp${(n / 1000).toFixed(0)}rb`
    return max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
  }

  const filterByStatus = (status: string) =>
    orders.filter(o => o.status === status)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Memuat orders...</p>
      </div>
    )
  }

  const OrderCard = ({ order }: { order: Order }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border border-border rounded-xl"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_LABEL[order.status].color}`}>
          {STATUS_LABEL[order.status].label}
        </span>
        <p className="text-xs text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString('id-ID')}
        </p>
      </div>

      <h3
        className="font-semibold text-sm mb-1 hover:text-blue-600 cursor-pointer transition-colors"
        onClick={() => router.push(`/services/${order.services?.id}`)}
      >
        {order.services?.title}
      </h3>

      <p className="text-xs text-muted-foreground mb-3">
        oleh {order.profiles?.full_name} · {order.profiles?.prodi}
      </p>

      {order.message && (
        <p className="text-xs bg-muted/50 rounded-lg p-2 mb-3 text-muted-foreground">
          "{order.message}"
        </p>
      )}

      <p className="text-sm font-bold text-blue-600 mb-4">
        {formatPrice(order.services?.price_min ?? 0, order.services?.price_max)}
      </p>

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8"
          onClick={() => {
            const msg = encodeURIComponent(
              `Halo kak ${order.profiles?.full_name}, mau tanya soal order "${order.services?.title}"`
            )
            window.open(`https://wa.me/${order.profiles?.whatsapp}?text=${msg}`, '_blank')
          }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Hubungi Provider
        </Button>

        {order.status === 'done' && !order.reviewed && (
          <Button
            size="sm"
            className="gap-1.5 text-xs h-8 bg-blue-600 hover:bg-blue-700"
            onClick={() => setReviewTarget({
              orderId: order.id,
              serviceTitle: order.services?.title ?? '',
            })}
          >
            <Star className="w-3.5 h-3.5" />
            Beri Ulasan
          </Button>
        )}

        {order.status === 'done' && order.reviewed && (
          <span className="text-xs text-green-600 font-medium">✓ Sudah diulas</span>
        )}
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center">
          <button
            onClick={() => router.push('/home')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Kembali ke Home</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-2">Riwayat Order 📦</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Pantau status jasa yang kamu pesan.
          </p>

          <Tabs defaultValue="all">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="all" className="flex-1">
                Semua ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1">
                Menunggu ({filterByStatus('pending').length})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="flex-1">
                Proses ({filterByStatus('in_progress').length})
              </TabsTrigger>
              <TabsTrigger value="done" className="flex-1">
                Selesai ({filterByStatus('done').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              ) : (
                <EmptyState onBrowse={() => router.push('/home')} />
              )}
            </TabsContent>

            {(['pending', 'in_progress', 'done'] as const).map(status => (
              <TabsContent key={status} value={status}>
                {filterByStatus(status).length > 0 ? (
                  <div className="space-y-4">
                    {filterByStatus(status).map(order => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                ) : (
                  <EmptyState onBrowse={() => router.push('/home')} />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>

      {reviewTarget && (
        <ReviewModal
          orderId={reviewTarget.orderId}
          serviceTitle={reviewTarget.serviceTitle}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  )
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">Belum ada order di sini</p>
      <Button
        className="mt-4 bg-blue-600 hover:bg-blue-700"
        onClick={onBrowse}
      >
        Cari Jasa
      </Button>
    </div>
  )
}