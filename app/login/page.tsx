'use client'

import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleLogin = async () => {
    setError('')

    if (!form.email || !form.password) {
      setError('Email dan password wajib diisi!')
      return
    }

    if (!form.email.endsWith('@mahasiswa.itb.ac.id')) {
      setError('Hanya email @mahasiswa.itb.ac.id yang diizinkan!')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Email belum dikonfirmasi. Cek inbox Outlook kamu!')
      } else if (error.message.includes('Invalid login credentials')) {
        setError('Email atau password salah!')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    router.push('/services')
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      {/* Left */}
      <div className="w-1/2 flex max-w-md items-center justify-center p-14">
        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[144px] leading-none"
          style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
        >
          Yo,{'\n'}Welcome{'\n'}Back!
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Lupa Password */}
            <div className="text-right">
              <button
                className="text-sm text-gray-500 underline hover:text-black transition-colors"
                onClick={() => router.push('/forgot-password')}
              >
                Lupa Password?
              </button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 bg-gray-700 text-white rounded-2xl font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-gray-200" />
              <span className="text-xs text-gray-400">atau</span>
              <hr className="flex-1 border-gray-200" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Masuk dengan Google
            </button>

            {/* Register link */}
            <p className="text-center text-sm text-gray-500">
              Belum punya akun?{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-medium text-black underline hover:opacity-70 transition-opacity"
              >
                Daftar
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}