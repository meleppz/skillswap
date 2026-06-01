'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nim: '',
    prodi: '',
    fakultas: '',
    angkatan: '',
    whatsapp: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setError('')

    if (!form.nim || !form.prodi || !form.fakultas || !form.angkatan || !form.whatsapp) {
      setError('Semua field wajib diisi!')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('profiles')
      .update({
        nim: form.nim,
        prodi: form.prodi,
        fakultas: form.fakultas,
        angkatan: form.angkatan,
        whatsapp: form.whatsapp,
      })
      .eq('id', user.id)

    if (error) {
      setError('Gagal menyimpan profil. Coba lagi.')
      setLoading(false)
      return
    }

    router.push('/services')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left */}
      <div className="w-1/2 flex items-center justify-center p-16">
        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-8xl leading-tight"
          style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
        >
          Lengkapi{'\n'}Profil{'\n'}Dulu, Yuk!
        </motion.h1>
      </div>

      {/* Right */}
      <div className="w-1/2 flex items-center justify-center p-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Image
            src="/logo.png"
            alt="SkillSwap"
            width={120}
            height={32}
            className="object-contain mb-8"
          />

          <div className="space-y-4">
            {/* NIM */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">NIM</label>
              <input
                name="nim"
                placeholder="13522XXX"
                value={form.nim}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Jurusan */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Jurusan</label>
              <input
                name="prodi"
                placeholder="Sistem dan Teknologi Informasi"
                value={form.prodi}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Fakultas */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Fakultas</label>
              <input
                name="fakultas"
                placeholder="Sekolah Teknik Elektro dan Informatika"
                value={form.fakultas}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Angkatan + WhatsApp */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Angkatan</label>
                <input
                  name="angkatan"
                  placeholder="2024"
                  value={form.angkatan}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">No. Whatsapp</label>
                <input
                  name="whatsapp"
                  placeholder="08123456789"
                  value={form.whatsapp}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 bg-gray-700 text-white rounded-2xl font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}