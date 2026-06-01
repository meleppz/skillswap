'use client'

import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRegister = async () => {
    setError('')

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Semua field wajib diisi!')
      return
    }

    if (!form.email.endsWith('@mahasiswa.itb.ac.id')) {
      setError('Hanya email @mahasiswa.itb.ac.id yang diizinkan!')
      return
    }

    if (form.password.length < 8) {
      setError('Password minimal 8 karakter!')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok!')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Email ini sudah terdaftar. Coba masuk!')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const handleGoogleRegister = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <p className="text-6xl mb-6">📬</p>
          <h1
            className="text-5xl mb-4"
            style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
          >
            Cek Outlook Kamu!
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Kami sudah kirim email konfirmasi ke{' '}
            <span className="font-semibold text-black">{form.email}</span>.
            Klik link di email tersebut untuk mengaktifkan akun kamu.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-gray-500 underline hover:text-black transition-colors"
          >
            Kembali ke halaman masuk
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      {/* Left */}
      <div className="w-1/2 max-w-md flex items-center justify-center p-16">
        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[144px] leading-none"
          style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
        >
          Halo{'\n'}Warga{'\n'}Baru!
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
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nama</label>
              <input
                name="name"
                type="text"
                placeholder="Nama lengkap kamu"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email Mahasiswa</label>
              <input
                name="email"
                type="email"
                placeholder="nama@mahasiswa.itb.ac.id"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Min. 8 karakter"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Konfirmasi Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Submit */}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3.5 bg-gray-700 text-white rounded-2xl font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Mendaftar...' : 'Daftar'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-gray-200" />
              <span className="text-xs text-gray-400">atau</span>
              <hr className="flex-1 border-gray-200" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleRegister}
              className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Daftar dengan Google
            </button>

            {/* Login link */}
            <p className="text-center text-sm text-gray-500">
              Sudah punya akun?{' '}
              <button
                onClick={() => router.push('/login')}
                className="font-medium text-black underline hover:opacity-70 transition-opacity"
              >
                Masuk
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}