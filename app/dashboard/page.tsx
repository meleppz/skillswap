'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navbar from '@/components/navbar'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    }
    init()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-5xl text-center mb-2"
            style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
          >
            Dashboard
          </h1>
          <p className="text-center text-gray-500 text-sm mb-12">
            Pilih dashboard yang ingin kamu lihat
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provider Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard/provider')}
              className="bg-gray-900 text-white rounded-2xl p-8 text-left hover:bg-gray-800 transition-colors"
            >
              <p className="text-4xl mb-4">🛠️</p>
              <h2
                className="text-3xl mb-2"
                style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
              >
                Dashboard Penyedia Jasa
              </h2>
              <p className="text-gray-400 text-sm">
                Kelola service yang kamu tawarkan, lihat pesanan masuk, dan pantau request yang sedang kamu kerjakan.
              </p>
            </motion.button>

            {/* Requester Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard/requester')}
              className="bg-white border border-gray-200 rounded-2xl p-8 text-left hover:shadow-md transition-all"
            >
              <p className="text-4xl mb-4">🔍</p>
              <h2
                className="text-3xl mb-2"
                style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
              >
                Dashboard Pencarian Jasa
              </h2>
              <p className="text-gray-500 text-sm">
                Lihat request yang kamu buat, pantau status pesanan service yang sedang kamu gunakan.
              </p>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}