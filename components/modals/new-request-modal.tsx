'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

const CATEGORIES = ['Teknologi', 'Desain & Kreatif', 'Asistensi Akademik', 'Jastip & Logistik', 'Osjur Stuffs', 'Lain-Lain']

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NewRequestModal({ open, onClose, onSuccess }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price_min: '',
    price_max: '',
    deadline_date: '',
    deadline_time: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setError('')

    if (!form.title || !form.description || !form.category || !form.price_min || !form.deadline_date || !form.deadline_time) {
      setError('Semua field wajib diisi kecuali budget maksimum!')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const deadline = new Date(`${form.deadline_date}T${form.deadline_time}:00`)

    const { error } = await supabase
      .from('requests')
      .insert({
        requester_id: user.id,
        title: form.title,
        description: form.description,
        category_id: CATEGORIES.indexOf(form.category) + 1,
        price_min: parseInt(form.price_min),
        price_max: form.price_max ? parseInt(form.price_max) : null,
        deadline: deadline.toISOString(),
        status: 'active',
      })

    if (error) {
      setError('Gagal menyimpan request. Coba lagi.')
      setLoading(false)
      return
    }

    setForm({
      title: '',
      description: '',
      category: '',
      price_min: '',
      price_max: '',
      deadline_date: '',
      deadline_time: '',
    })
    setLoading(false)
    onSuccess()
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
            className="relative w-full max-w-4xl bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl p-8 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            {/* X Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-black transition-colors font-medium text-lg"
            >
              X
            </button>

            <h2
              className="text-5xl mb-8"
              style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
            >
              Request Shoutout
            </h2>

            <div className="space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Lagi Butuh Bantuan Apa</label>
                <input
                  name="title"
                  placeholder="URGENT: Dicari yang bisa ngumpulin kecoak 30 biji buat praktikum"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white/60 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Deskripsi</label>
                <textarea
                  name="description"
                  placeholder="Jelaskan apa yang kamu butuhkan, syarat-syarat, dan detail lainnya..."
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white/60 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Kategori</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        form.category === cat
                          ? 'bg-[#074DDB] text-white border-[#074DDB]'
                          : 'bg-white/60 text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Budget</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                    <input
                      name="price_min"
                      type="number"
                      placeholder="0"
                      value={form.price_min}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white/60 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <span className="text-gray-400 font-medium">–</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                    <input
                      name="price_max"
                      type="number"
                      placeholder="0 (opsional)"
                      value={form.price_max}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white/60 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Deadline</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="deadline_date"
                    type="date"
                    value={form.deadline_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <input
                    name="deadline_time"
                    type="time"
                    value={form.deadline_time}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 bg-[#FF6647] text-white rounded-xl font-medium hover:bg-[#e5583d] transition-colors disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Tambah Shoutout Baru'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}