'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  orderId: string
  serviceTitle: string
  providerName: string
  providerProdi: string
  providerAngkatan: string
  providerAvatar: string
  providerRating?: string | null
  providerReviewCount?: number
  onClose: () => void
  onSubmit: (orderId: string, rating: number, comment: string) => void
}

export default function ReviewModal({
  open,
  orderId,
  serviceTitle,
  providerName,
  providerProdi,
  providerAngkatan,
  providerAvatar,
  providerRating,
  providerReviewCount,
  onClose,
  onSubmit,
}: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')

  const handleClose = () => {
    setRating(0)
    setHovered(0)
    setComment('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl"
          >
            {/* X Button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-black transition-colors font-medium text-lg"
            >
              X
            </button>

            <div className="px-8 py-6">
              {/* Provider Header */}
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={providerAvatar} />
                  <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
                    {providerName?.charAt(0) ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{providerName}</p>
                  <p className="text-xs text-gray-500">
                    {providerProdi} '{providerAngkatan?.slice(-2)}
                  </p>
                </div>
                {providerRating && (
                  <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-200">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{providerRating}</span>
                    {providerReviewCount !== undefined && (
                      <span className="text-xs text-gray-400">({providerReviewCount})</span>
                    )}
                  </div>
                )}
              </div>

              {/* Service Title */}
              <h2 className="text-4xl font-bold mb-8 leading-tight">{serviceTitle}</h2>

              {/* Stars */}
              <div className="flex items-center justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-12 h-12 transition-colors ${
                        star <= (hovered || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">
                  Gimana Pengalamannya Sama {providerName.split(' ')[0]}?
                </label>
                <textarea
                  placeholder="Lorem ipsum"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white/60 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl text-gray-600 border-gray-200"
                  onClick={() => {}}
                >
                  Tambah Gambar
                </Button>
                <Button
                  className="w-full h-12 bg-[#FF6647] hover:bg-[#e5583d] text-white rounded-xl"
                  disabled={rating === 0}
                  onClick={() => {
                    onSubmit(orderId, rating, comment)
                    handleClose()
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}