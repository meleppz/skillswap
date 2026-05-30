'use client'

import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Briefcase, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <Briefcase className="text-white w-7 h-7" />
          <span className="text-white text-2xl font-bold">SkillSwap</span>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-white text-5xl font-bold leading-tight mb-6">
              Temukan jasa yang kamu butuhkan dari sesama mahasiswa.
            </h1>
            <p className="text-blue-200 text-lg">
              Platform micro-tasking khusus mahasiswa. Tawarkan keahlianmu, atau temukan bantuan yang kamu butuhkan.
            </p>
          </motion.div>
        </div>

        <div className="flex gap-8">
          <div>
            <p className="text-white text-3xl font-bold">500+</p>
            <p className="text-blue-200 text-sm">Jasa tersedia</p>
          </div>
          <div>
            <p className="text-white text-3xl font-bold">1.2k+</p>
            <p className="text-blue-200 text-sm">Mahasiswa aktif</p>
          </div>
          <div>
            <p className="text-white text-3xl font-bold">98%</p>
            <p className="text-blue-200 text-sm">Kepuasan client</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <Briefcase className="text-blue-600 w-7 h-7" />
            <span className="text-2xl font-bold text-blue-600">SkillSwap</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Selamat datang! 👋
            </h2>
            <p className="text-muted-foreground">
              Masuk dengan akun Google kampus kamu untuk mulai.
            </p>
          </div>

          <Button
            onClick={handleGoogleLogin}
            className="w-full h-12 text-base gap-3 bg-blue-600 hover:bg-blue-700"
          >
            <Sparkles className="w-5 h-5" />
            Masuk dengan Google
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Khusus untuk mahasiswa dengan email kampus{' '}
            <span className="text-blue-600 font-medium">.ac.id</span>
          </p>
        </motion.div>
      </div>
    </div>
  )
}