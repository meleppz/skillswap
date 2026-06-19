'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  title: string
  amount: number
  onClose: () => void
  onConfirm: (reason: string) => void
}

const REFUND_REASONS = [
  'Provider Tidak Responsif',
  'Kualitas Tidak Sesuai',
  'Pesanan Tidak Dikerjakan',
  'Alasan Lain',
]

export default function RefundModal({ open, title, amount, onClose, onConfirm }: Props) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const handleClose = () => {
    setSelectedReason('')
    setCustomReason('')
    onClose()
  }

  const handleConfirm = () => {
    const reason = selectedReason === 'Alasan Lain'
      ? customReason.trim()
      : selectedReason
    if (!reason) return
    onConfirm(reason)
    setSelectedReason('')
    setCustomReason('')
  }

  const isValid = selectedReason !== '' && (
    selectedReason !== 'Alasan Lain' || customReason.trim() !== ''
  )

  const fmt = (n: number) => `Rp${n.toLocaleString('id-ID')}`

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
            className="relative w-full max-w-md bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-8"
          >
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-black transition-colors font-medium text-lg"
            >
              X
            </button>

            <h2
              className="text-4xl mb-2"
              style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
            >
              Ajukan Refund
            </h2>
            <p className="text-sm text-gray-500 mb-2">{title}</p>
            <p className="text-lg font-bold text-gray-900 mb-6">{fmt(amount)} akan dikembalikan</p>

            <div className="mb-4">
              <p className="text-sm font-medium mb-3">Kenapa minta refund?</p>
              <div className="flex flex-wrap gap-2">
                {REFUND_REASONS.map(reason => (
                  <button
                    key={reason}
                    onClick={() => {
                      setSelectedReason(reason)
                      if (reason !== 'Alasan Lain') setCustomReason('')
                    }}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      selectedReason === reason
                        ? 'bg-[#074DDB] text-white border-[#074DDB]'
                        : 'bg-white/60 text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Jelaskan alasanmu..."
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              rows={3}
              disabled={selectedReason !== 'Alasan Lain' && selectedReason !== ''}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white/60 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none mb-6 disabled:opacity-40 disabled:cursor-not-allowed"
            />

            <p className="text-xs text-gray-400 mb-4">
              Permintaan refund akan dikirimkan ke pihak lain untuk disetujui.
            </p>

            <Button
              className="w-full h-12 bg-[#FF6647] hover:bg-[#e5583d] text-white rounded-xl"
              disabled={!isValid}
              onClick={handleConfirm}
            >
              Ajukan Refund
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
