'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Navbar from '@/components/navbar'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    prodi: '',
    fakultas: '',
    angkatan: '',
    whatsapp: '',
    bio: '',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setEmail(user.email ?? '')

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setAvatarUrl(data.avatar_url ?? '')
        setForm({
          full_name: data.full_name ?? '',
          prodi: data.prodi ?? '',
          fakultas: data.fakultas ?? '',
          angkatan: data.angkatan ?? '',
          whatsapp: data.whatsapp ?? '',
          bio: data.bio ?? '',
        })
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const filePath = `avatars/${user.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError('Gagal upload foto. Coba lagi.')
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    setAvatarUrl(publicUrl)
  }

  const handleSave = async () => {
    setError('')
    setSuccess(false)

    if (!form.full_name || !form.prodi || !form.fakultas || !form.angkatan || !form.whatsapp) {
      setError('Semua field wajib diisi kecuali About Me!')
      return
    }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        prodi: form.prodi,
        fakultas: form.fakultas,
        angkatan: form.angkatan,
        whatsapp: form.whatsapp,
        bio: form.bio,
      })
      .eq('id', user.id)

    if (error) {
      setError('Gagal menyimpan. Coba lagi.')
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Yakin mau hapus akun? Tindakan ini tidak bisa dibatalkan!')) return
    // For now just logout — actual deletion needs server-side
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Memuat settings...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-5xl mb-8"
            style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
          >
            Settings
          </h1>

          {/* Tentang Kamu */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
            <p className="text-sm font-semibold text-gray-500 mb-6">Tentang Kamu</p>

            <div className="flex gap-8">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-2xl font-bold">
                    {form.full_name?.charAt(0) ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-4 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ubah
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Form */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Email Mahasiswa</label>
                  <input
                    value={email}
                    disabled
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Nama */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Nama</label>
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {/* Jurusan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Jurusan</label>
                  <input
                    name="prodi"
                    value={form.prodi}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {/* Fakultas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Fakultas</label>
                  <input
                    name="fakultas"
                    value={form.fakultas}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {/* Angkatan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Angkatan</label>
                  <input
                    name="angkatan"
                    value={form.angkatan}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">No. Whatsapp</label>
                  <input
                    name="whatsapp"
                    value={form.whatsapp}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* About Me */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-500 mb-3">About Me</p>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Ceritakan sedikit tentang dirimu..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            {success && <p className="text-green-600 text-sm mt-3">✓ Profil berhasil disimpan!</p>}

            <div className="flex justify-end mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>

          {/* Keluar */}
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors mb-3"
          >
            Keluar
          </button>

          {/* Hapus Akun */}
          <button
            onClick={handleDeleteAccount}
            className="w-full py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
          >
            Hapus Akun
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-8 mt-16">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-5xl uppercase mb-6" style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}>
            SKILLSWAP!
          </p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-lg mx-auto">
            SkillSwap! Platform Original Konsolidasi Ekonomi Mikro Jasa Peer-to-Peer Mahasiswa.<br />
            Dikembangkan secara khusus sebagai pemenuhan komponen teknis nilai UAS pada mata kuliah II2210 Teknologi Platform.<br />
            Sekolah Teknik Elektro dan Informatika, Institut Teknologi Bandung. Semester II Tahun Akademik 2025/2026.<br />
            © 2026 SkillSwap. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </footer>
    </div>
  )
}