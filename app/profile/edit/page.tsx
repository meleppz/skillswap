'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EditProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    nim: '',
    prodi: '',
    fakultas: '',
    angkatan: '',
    whatsapp: '',
    bio: '',
  })

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setForm({
          full_name: data.full_name ?? '',
          nim: data.nim ?? '',
          prodi: data.prodi ?? '',
          fakultas: data.fakultas ?? '',
          angkatan: data.angkatan ?? '',
          whatsapp: data.whatsapp ?? '',
          bio: data.bio ?? '',
        })
      }
      setFetching(false)
    }
    getProfile()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess(false)

    if (!form.full_name || !form.nim || !form.prodi || !form.fakultas || !form.angkatan || !form.whatsapp) {
      setError('Semua field wajib diisi kecuali bio!')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        nim: form.nim,
        prodi: form.prodi,
        fakultas: form.fakultas,
        angkatan: form.angkatan,
        whatsapp: form.whatsapp,
        bio: form.bio,
      })
      .eq('id', user.id)

    if (error) {
      setError('Gagal menyimpan. Coba lagi.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/profile'), 1000)
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Memuat profil...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Kembali</span>
          </button>
          <span className="text-sm font-semibold">Edit Profil</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-2">Edit Profil ✏️</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Update informasi profil kamu yang ditampilkan ke pengguna lain.
          </p>

          <div className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Budi Santoso"
                value={form.full_name}
                onChange={handleChange}
              />
            </div>

            {/* NIM */}
            <div className="space-y-2">
              <Label htmlFor="nim">NIM *</Label>
              <Input
                id="nim"
                name="nim"
                placeholder="2021001234"
                value={form.nim}
                onChange={handleChange}
              />
            </div>

            {/* Prodi & Fakultas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prodi">Program Studi *</Label>
                <Input
                  id="prodi"
                  name="prodi"
                  placeholder="Teknik Informatika"
                  value={form.prodi}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fakultas">Fakultas *</Label>
                <Input
                  id="fakultas"
                  name="fakultas"
                  placeholder="Fakultas Teknik"
                  value={form.fakultas}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Angkatan & WhatsApp */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="angkatan">Angkatan *</Label>
                <Input
                  id="angkatan"
                  name="angkatan"
                  placeholder="2021"
                  value={form.angkatan}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">No. WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  placeholder="08123456789"
                  value={form.whatsapp}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio <span className="text-muted-foreground">(opsional)</span></Label>
              <textarea
                id="bio"
                name="bio"
                placeholder="Ceritakan sedikit tentang dirimu, keahlian, atau pengalamanmu..."
                value={form.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {success && (
              <p className="text-green-600 text-sm">
                ✓ Profil berhasil disimpan! Mengalihkan...
              </p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}