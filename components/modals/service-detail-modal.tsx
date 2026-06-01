'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, MessageCircle, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Review = {
  id: string
  rating: number
  comment: string
  created_at: string
  profiles: { full_name: string } | null
}

export type ServiceDetailType = {
  id: string
  title: string
  description: string
  price_min: number
  price_max: number | null
  price_unit: string | null
  estimated_days: number
  estimated_unit: string | null
  is_available: boolean
  categories: { name: string } | null
  profiles: {
    id: string
    full_name: string
    prodi: string
    angkatan: string
    avatar_url: string
    whatsapp: string
    bio: string
  } | null
  reviews: Review[]
}

type Props = {
  service: ServiceDetailType | null
  currentUserId: string | null
  onClose: () => void
  onHubungi: () => void
}

export default function ServiceDetailModal({ service, currentUserId, onClose, onHubungi }: Props) {
  if (!service) return null

  const getAvgRating = (reviews: Review[]) => {
    if (!reviews?.length) return null
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  }

  const formatPrice = (min: number, max?: number | null, unit?: string | null) => {
    const fmt = (n: number) => `Rp${n.toLocaleString('id-ID')}`
    const price = max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
    return unit ? `${price} / ${unit}` : price
  }

  const avgRating = getAvgRating(service.reviews)
  const isOwn = service.profiles?.id === currentUserId

  return (
    <AnimatePresence>
      {service && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={service.profiles?.avatar_url} />
                  <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
                    {service.profiles?.full_name?.charAt(0) ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{service.profiles?.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {service.profiles?.prodi} '{service.profiles?.angkatan?.slice(-2)}
                  </p>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-200">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{avgRating}</span>
                    <span className="text-xs text-gray-400">({service.reviews.length})</span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-black transition-colors font-medium text-lg"
              >
                X
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto flex-1 px-6 pt-1 pb-5">
              <span className="inline-block mb-3 px-3 py-1 text-xs border !border-gray-300 rounded-lg bg-white/20 text-gray-600">
                {service.categories?.name ?? 'Lainnya'}
              </span>

              <h2 className="text-4xl font-bold mb-3 pt-3 pb-6">{service.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-8 whitespace-pre-line">
                {service.description}
              </p>

              <hr className="!border-black mb-8" />

              {/* Price & Duration */}
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-2xl font-bold">
                    {formatPrice(service.price_min, service.price_max, service.price_unit)}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <p className="text-xs">
                      Pengerjaan: {service.estimated_days} {service.estimated_unit ?? 'hari'}
                    </p>
                  </div>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{avgRating}</span>
                    <span className="text-sm text-gray-400">({service.reviews.length})</span>
                  </div>
                )}
              </div>

              {/* Reviews */}
              {service.reviews.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Rating Terbaru</h3>
                  <div className="space-y-3">
                    {service.reviews.slice(0, 3).map(review => (
                      <div key={review.id} className="bg-white/60 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">
                            {review.profiles?.full_name ?? 'Anonymous'}
                          </p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4">
              <Button
                className="w-full h-12 bg-gray-900 hover:bg-gray-700 text-white rounded-xl gap-2"
                disabled={!service.is_available || isOwn}
                onClick={onHubungi}
              >
                <MessageCircle className="w-4 h-4" />
                {isOwn
                  ? 'Ini jasa milikmu'
                  : service.is_available
                  ? 'Hubungi Provider'
                  : 'Tidak Tersedia'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}