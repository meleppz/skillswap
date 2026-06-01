'use client'

import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    setError('')

    if (!newPassword || !confirmPassword) {
      setError('Semua field wajib diisi!')
      return
    }

    if (newPassword.length < 8) {
      setError('Password minimal 8 karakter!')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok!')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setError('Gagal update password. Coba lagi.')
      setLoading(false)
      return
    }

    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      {/* Left */}
      <div className="w-1/2 flex max-w-md items-center justify-center p-16">
        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[144px] leading-none"
          style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
        >
          Bikin{'\n'}Password{'\n'}Baru!
        </motion.h1>
      </div>

      {/* Right */}
      <div className="w-1/2 flex items-center justify-center p-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password Baru</label>
            <input
              type="password"
              placeholder="Min. 8 karakter"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Konfirmasi Password Baru</label>
            <input
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full py-3.5 bg-gray-700 text-white rounded-2xl font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </motion.div>
      </div>
    </div>
  )
}