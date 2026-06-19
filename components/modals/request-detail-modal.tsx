'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export type RequestDetailType = {
  id: string
  title: string
  description: string
  price_min: number
  price_max: number | null
  deadline: string
  status: string
  categories: { name: string } | null
  profiles: {
    id: string
    full_name: string
    prodi: string
    angkatan: string
    avatar_url: string
    whatsapp: string
  } | null
}

type Props = {
  request: RequestDetailType | null
  currentUserId: string | null
  onClose: () => void
  onHubungi: () => void
}

export default function RequestDetailModal({ request, currentUserId, onClose, onHubungi }: Props) {
  if (!request) return null

  const formatPrice = (min: number, max?: number | null) => {
    const fmt = (n: number) => `Rp${n.toLocaleString('id-ID')}`
    return max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isOwn = request.profiles?.id === currentUserId

  return (
    <AnimatePresence>
      {request && (
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
                  <AvatarImage src={request.profiles?.avatar_url} />
                  <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
                    {request.profiles?.full_name?.charAt(0) ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{request.profiles?.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {request.profiles?.prodi} '{request.profiles?.angkatan?.slice(-2)}
                  </p>
                </div>
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
              <span className="inline-block mb-3 px-3 py-1 text-xs border border-gray-300 rounded-lg bg-white/20 text-gray-600">
                {request.categories?.name ?? 'Lainnya'}
              </span>

              <h2 className="text-4xl font-bold mb-3 pt-3 pb-6">{request.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-8 whitespace-pre-line">
                {request.description}
              </p>

              <hr className="!border-gray-600 mb-8" />

              {/* Price & Deadline */}
              <div className="mb-6">
                <p className="text-2xl font-bold mb-2">
                  {formatPrice(request.price_min, request.price_max)}
                </p>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-3.5 h-3.5" />
                  <p className="text-sm">
                    Deadline: <span className="font-semibold">{formatDeadline(request.deadline)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4">
              {isOwn ? (
                <Button className="w-full h-12 rounded-xl" disabled>
                  Ini request milikmu
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="h-12 w-12 shrink-0 rounded-xl border-gray-200"
                    onClick={() => {
                      const msg = encodeURIComponent(
                        `Halo kak ${request.profiles?.full_name}, aku tertarik untuk mengerjakan request "${request.title}" di SkillSwap.`
                      )
                      window.open(`https://wa.me/${request.profiles?.whatsapp}?text=${msg}`, '_blank')
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    className="flex-1 h-12 bg-[#FF6647] hover:bg-[#e5583d] text-white rounded-xl"
                    onClick={onHubungi}
                  >
                    Ambil Request
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}