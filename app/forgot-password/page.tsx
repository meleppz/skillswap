'use client'

import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

type Step = 'email' | 'sent'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    setError('')

    if (!email) {
      setError('Email wajib diisi!')
      return
    }

    if (!email.endsWith('@mahasiswa.itb.ac.id')) {
      setError('Hanya email @mahasiswa.itb.ac.id yang diizinkan!')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError('Gagal mengirim link. Coba lagi.')
      setLoading(false)
      return
    }

    setLoading(false)
    setStep('sent')
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
          Lupa{'\n'}Password?
        </motion.h1>
      </div>

      {/* Right */}
      <div className="w-1/2 flex items-center justify-center p-16">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* Step 1 — Email */}
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email Mahasiswa</label>
                  <input
                    type="email"
                    placeholder="nama@mahasiswa.itb.ac.id"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="w-full py-3.5 bg-gray-700 text-white rounded-2xl font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                </button>

                <button
                  onClick={() => router.push('/login')}
                  className="w-full text-center text-sm text-gray-500 hover:text-black transition-colors"
                >
                  Kembali ke halaman masuk
                </button>
              </motion.div>
            )}

            {/* Step 2 — Sent */}
            {step === 'sent' && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <p className="text-4xl mb-2">📬</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Link reset password sudah dikirim ke{' '}
                  <span className="font-semibold text-black">{email}</span>.
                  Cek inbox Outlook kamu dan klik link tersebut.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3.5 bg-gray-700 text-white rounded-2xl font-medium hover:bg-gray-900 transition-colors"
                >
                  Kembali ke halaman masuk
                </button>
                <button
                  onClick={() => { setStep('email'); setError('') }}
                  className="w-full text-center text-sm text-gray-500 hover:text-black transition-colors"
                >
                  Kirim ulang link
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}