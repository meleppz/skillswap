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

export default function NewServiceModal({ open, onClose, onSuccess }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    price_unit: '',
    estimated_value: '',
    estimated_unit: 'hari',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setError('')

    if (!form.title || !form.description || !form.category || !form.price || !form.estimated_value) {
      setError('Semua field wajib diisi!')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('services')
      .insert({
        provider_id: user.id,
        title: form.title,
        description: form.description,
        category_id: CATEGORIES.indexOf(form.category) + 1,
        price_min: parseInt(form.price),
        price_unit: form.price_unit || null,
        estimated_days: parseInt(form.estimated_value),
        estimated_unit: form.estimated_unit,
        is_available: true,
      })

    if (error) {
      setError('Gagal menyimpan jasa. Coba lagi.')
      setLoading(false)
      return
    }

    setForm({
      title: '',
      description: '',
      category: '',
      price: '',
      price_unit: '',
      estimated_value: '',
      estimated_unit: 'hari',
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
              Provide Service
            </h2>

            <div className="space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Service Apa yang Kamu Tawarin?</label>
                <input
                  name="title"
                  placeholder="Desain Slide Deck / PPT Presentasi Estetik"
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
                  placeholder="Jelaskan apa yang kamu kerjakan, apa yang termasuk dalam layanan..."
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
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white/60 text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price + Unit */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Harga Service</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                    <input
                      name="price"
                      type="number"
                      placeholder="0"
                      value={form.price}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white/60 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <span className="text-gray-400 font-medium">/</span>
                  <input
                    name="price_unit"
                    placeholder="slide, halaman, jam..."
                    value={form.price_unit}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white/60 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Estimated Time */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Waktu Pengerjaan</label>
                <div className="flex items-center gap-3">
                  <input
                    name="estimated_value"
                    type="number"
                    placeholder="1"
                    min="1"
                    value={form.estimated_value}
                    onChange={handleChange}
                    className="w-32 px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white/60 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <select
                    name="estimated_unit"
                    value={form.estimated_unit}
                    onChange={handleChange}
                    className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="hari">Hari</option>
                    <option value="jam">Jam</option>
                  </select>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Tambah Service Baru'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}