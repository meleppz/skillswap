'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

const CLIENT_REASONS = [
  'Nemu yang Lebih Murah',
  'Double Booking',
  'Provider Ga Ngejawab',
  'Alasan Lain',
]

const PROVIDER_REASONS = [
  'Slot Penuh',
  'Di Luar Kemampuan',
  'Urusan Mendadak',
  'Alasan Lain',
]

type Props = {
  open: boolean
  title: string
  type: 'order' | 'request'
  role: 'client' | 'provider'
  onClose: () => void
  onConfirm: (reason: string) => void
}

export default function CancelModal({
  open,
  title,
  type,
  role,
  onClose,
  onConfirm,
}: Props) {
  const [selectedTag, setSelectedTag] = useState('')
  const [customReason, setCustomReason] = useState('')

  const reasons = role === 'client' ? CLIENT_REASONS : PROVIDER_REASONS

  const handleClose = () => {
    setSelectedTag('')
    setCustomReason('')
    onClose()
  }

  const handleConfirm = () => {
    const reason = selectedTag === 'Alasan Lain'
      ? customReason.trim()
      : selectedTag
    if (!reason) return
    onConfirm(reason)
    setSelectedTag('')
    setCustomReason('')
  }

  const isValid = selectedTag !== '' && (
    selectedTag !== 'Alasan Lain' || customReason.trim() !== ''
  )

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
            className="relative w-full max-w-4xl bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-8"
          >
            {/* X Button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-black transition-colors font-medium text-lg"
            >
              X
            </button>

            {/* Title */}
            <h2
              className="text-5xl mb-6"
              style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
            >
              Batalkan {type === 'order' ? 'Pesanan' : 'Request'}
            </h2>

            {/* Service/Request Title */}
            <h3 className="text-2xl font-bold mb-6 leading-tight">{title}</h3>

            {/* Reason Tags */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-3">Kenapa dibatalin?</p>
              <div className="flex flex-wrap gap-2">
                {reasons.map(reason => (
                  <button
                    key={reason}
                    onClick={() => {
                      setSelectedTag(reason)
                      if (reason !== 'Alasan Lain') setCustomReason('')
                    }}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      selectedTag === reason
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white/60 text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason */}
            <textarea
              placeholder="Sistem dan Teknologi Informasi"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              rows={4}
              disabled={selectedTag !== 'Alasan Lain' && selectedTag !== ''}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white/60 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none mb-6 disabled:opacity-40 disabled:cursor-not-allowed"
            />

            <Button
              className="w-full h-12 bg-gray-700 hover:bg-gray-900 text-white rounded-xl"
              disabled={!isValid}
              onClick={handleConfirm}
            >
              Batalkan {type === 'order' ? 'Pesanan' : 'Request'}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}