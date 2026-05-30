'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
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

    if (!form.full_name || !form.nim || !form.prodi || !form.fakultas || !form.angkatan || !form.whatsapp) {
      setError('Semua field wajib diisi!')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
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

    router.push('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center gap-2 mb-8">
          <Briefcase className="text-blue-600 w-6 h-6" />
          <span className="text-xl font-bold text-blue-600">SkillSwap</span>
        </div>

        <h1 className="text-3xl font-bold mb-2">Lengkapi Profilmu 👤</h1>
        <p className="text-muted-foreground mb-8">
          Isi data diri kamu sekali aja — ini yang bakal ditampilkan ke pengguna lain.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="Budi Santoso"
              value={form.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nim">NIM</Label>
            <Input
              id="nim"
              name="nim"
              placeholder="2021001234"
              value={form.nim}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prodi">Program Studi</Label>
              <Input
                id="prodi"
                name="prodi"
                placeholder="Teknik Informatika"
                value={form.prodi}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fakultas">Fakultas</Label>
              <Input
                id="fakultas"
                name="fakultas"
                placeholder="Fakultas Teknik"
                value={form.fakultas}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="angkatan">Angkatan</Label>
              <Input
                id="angkatan"
                name="angkatan"
                placeholder="2021"
                value={form.angkatan}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">No. WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                placeholder="08123456789"
                value={form.whatsapp}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Menyimpan...' : 'Simpan & Mulai →'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}