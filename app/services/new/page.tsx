'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Navbar from '@/components/navbar'

const CATEGORIES = ['Teknologi', 'Akademik', 'Desain & Kreatif', 'Foto & Video', 'Bahasa', 'Lainnya']

export default function NewServicePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price_min: '',
    price_max: '',
    estimated_days: '',
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
    }
    checkAuth()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setError('')

    if (!form.title || !form.description || !form.category || !form.price_min || !form.estimated_days) {
      setError('Semua field wajib diisi kecuali harga maksimum!')
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
        price_min: parseInt(form.price_min),
        price_max: form.price_max ? parseInt(form.price_max) : null,
        estimated_days: parseInt(form.estimated_days),
        is_available: true,
      })

    if (error) {
      setError('Gagal menyimpan jasa. Coba lagi.')
      setLoading(false)
      return
    }

    router.push('/services')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-8 py-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Kembali</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-4xl mb-2"
            style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
          >
            Tawarkan Jasamu
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Ceritakan jasa yang kamu tawarkan dengan jelas agar mudah ditemukan.
          </p>

          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Judul Jasa *</Label>
              <Input
                id="title"
                name="title"
                placeholder="cth: Jasa Install Ulang OS & Setup Software"
                value={form.title}
                onChange={handleChange}
                maxLength={60}
                className="bg-white"
              />
              <p className="text-xs text-gray-400 text-right">{form.title.length}/60</p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Kategori *</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      form.category === cat
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi *</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Jelaskan apa yang kamu kerjakan, apa yang termasuk dalam layanan, dan apa yang tidak..."
                value={form.description}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label>Harga *</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Minimum (Rp)</p>
                  <Input
                    name="price_min"
                    placeholder="50000"
                    type="number"
                    value={form.price_min}
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Maksimum (Rp) — opsional</p>
                  <Input
                    name="price_max"
                    placeholder="100000"
                    type="number"
                    value={form.price_max}
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Estimated Days */}
            <div className="space-y-2">
              <Label htmlFor="estimated_days">Estimasi Waktu Selesai *</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="estimated_days"
                  name="estimated_days"
                  placeholder="1"
                  type="number"
                  min="1"
                  value={form.estimated_days}
                  onChange={handleChange}
                  className="w-32 bg-white"
                />
                <span className="text-sm text-gray-500">hari</span>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 text-base bg-gray-900 hover:bg-gray-700 rounded-xl"
            >
              {loading ? 'Menyimpan...' : 'Publikasikan Jasa →'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}