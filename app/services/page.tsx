'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Star, X, MessageCircle, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navbar from '@/components/navbar'
import NewServiceModal from '@/components/modals/new-service-modal'
import { notifyNewOrder } from '@/lib/notifications'
import ServiceDetailModal from '@/components/modals/service-detail-modal'
import type { ServiceDetailType } from '@/components/modals/service-detail-modal'

const CATEGORIES = ['Semua', 'Teknologi', 'Desain & Kreatif', 'Asistensi Akademik', 'Jastip & Logistik', 'Osjur Stuffs', 'Lain-Lain']

type Review = {
  id: string
  rating: number
  comment: string
  created_at: string
  profiles: { full_name: string } | null
}

type Service = ServiceDetailType

export default function ServicesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string } | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showNewServiceModal, setShowNewServiceModal] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
      if (profileData) setProfile(profileData)

      await fetchServices()
    }
    init()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select(`
        id, title, description, price_min, price_max, price_unit,
        estimated_days, estimated_unit, is_available,
        categories ( name ),
        profiles ( id, full_name, prodi, angkatan, avatar_url, whatsapp, bio ),
        reviews (
          id, rating, comment, created_at,
          profiles!reviews_client_id_fkey ( full_name )
        )
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (!error && data) setServices(data as unknown as Service[])
    setLoading(false)
  }

  const getAvgRating = (reviews: Review[]) => {
    if (!reviews?.length) return null
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    return avg.toFixed(1)
  }

  const formatPrice = (min: number, max?: number | null, unit?: string | null) => {
    const fmt = (n: number) => `Rp${n.toLocaleString('id-ID')}`
    const price = max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
    return unit ? `${price} / ${unit}` : price
  }

  const handleHubungi = async () => {
    if (!selectedService || !currentUserId) return

    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', currentUserId)
      .single()
    const clientName = clientProfile?.full_name ?? 'Client'

    // Check for existing active order (unpaid or paid)
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('service_id', selectedService.id)
      .eq('client_id', currentUserId)
      .in('status', ['ongoing', 'need_review'])
      .single()

    if (existingOrder) {
      // Already has an order — go to payment page if unpaid, else dashboard
      if (existingOrder.payment_status !== 'paid') {
        router.push(`/payment/${existingOrder.id}`)
      } else {
        router.push('/dashboard/requester')
      }
      setConfirmDialog(false)
      return
    }

    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert({
        service_id: selectedService.id,
        client_id: currentUserId,
        provider_id: selectedService.profiles?.id,
        status: 'ongoing',
        payment_status: 'unpaid',
      })
      .select('id')
      .single()

    if (!error && newOrder) {
      await notifyNewOrder(
        selectedService.profiles?.id ?? '',
        clientName,
        selectedService.title
      )
      router.push(`/payment/${newOrder.id}`)
    }

    setConfirmDialog(false)
  }

  const filtered = services.filter(s => {
    const categoryName = s.categories?.name ?? 'Lainnya'
    const matchCategory = activeCategory === 'Semua' || categoryName === activeCategory
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1
            className="text-5xl mb-6"
            style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
          >
            Hi {profile?.full_name?.split(' ')[0] ?? 'Mahasiswa'}, butuh apa hari ini?
          </h1>
          <div className="max-w-2xl mx-auto">
            <Input
              placeholder="Cari jasa..."
              className="h-12 bg-white border-gray-200 rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? 'bg-[#074DDB] text-white border-[#074DDB]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((service, i) => {
              const avgRating = getAvgRating(service.reviews)
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedService(service)}
                >
                  {/* Provider */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={service.profiles?.avatar_url} />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-semibold">
                          {service.profiles?.full_name?.charAt(0) ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{service.profiles?.full_name}</p>
                        <p className="text-xs text-gray-500">
                          {service.profiles?.prodi} '{service.profiles?.angkatan?.slice(-2)}
                        </p>
                      </div>
                    </div>
                    {avgRating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{avgRating}</span>
                        <span className="text-xs text-gray-400">({service.reviews.length})</span>
                      </div>
                    )}
                  </div>

                  <Badge variant="outline" className="mb-2 text-xs rounded-full">
                    {service.categories?.name ?? 'Lainnya'}
                  </Badge>

                  <h3 className="font-bold text-base mb-1 line-clamp-2">{service.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{service.description}</p>

                  <hr className="border-gray-100 mb-3" />

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold">
                        {formatPrice(service.price_min, service.price_max, service.price_unit)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Pengerjaan: {service.estimated_days} {service.estimated_unit ?? 'hari'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>Tidak ada jasa yang ditemukan</p>
          </div>
        )}
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setShowNewServiceModal(true)}
        className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 bg-[#FF6647] text-white rounded-full font-medium shadow-lg hover:bg-[#e5583d] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Tawarkan Service
      </button>

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedService}
        currentUserId={currentUserId}
        onClose={() => setSelectedService(null)}
        onHubungi={() => setConfirmDialog(true)}
      />

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="font-bold text-lg mb-2">Pesan Jasa Ini?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Kamu akan diarahkan ke halaman pembayaran. Setelah bayar, kamu bisa langsung hubungi provider via WhatsApp.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setConfirmDialog(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-[#FF6647] hover:bg-[#e5583d] text-white rounded-xl"
                  onClick={handleHubungi}
                >
                  Ya, Pesan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Service Modal */}
      <NewServiceModal
        open={showNewServiceModal}
        onClose={() => setShowNewServiceModal(false)}
        onSuccess={async () => {
          setShowNewServiceModal(false)
          await fetchServices()
        }}
      />
    </div>
  )
}