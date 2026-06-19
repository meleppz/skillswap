'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Wallet, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/navbar'
import { notifyRequestPaid } from '@/lib/notifications'

type RequestDetail = {
  id: string
  title: string
  price_min: number
  payment_status: string | null
  provider_id: string | null
  provider: {
    full_name: string
    whatsapp: string
  } | null
}

export default function RequestPaymentPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const requestId = params.requestId as string

  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [balance, setBalance] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: reqData } = await supabase
        .from('requests')
        .select(`
          id, title, price_min, payment_status, provider_id,
          provider:profiles!requests_provider_id_fkey ( full_name, whatsapp )
        `)
        .eq('id', requestId)
        .eq('requester_id', user.id)
        .single()

      if (!reqData) { router.push('/dashboard/requester'); return }
      setRequest(reqData as unknown as RequestDetail)
      if (reqData.payment_status === 'paid') setPaid(true)

      const { data: profileData } = await supabase
        .from('profiles').select('balance').eq('id', user.id).single()
      setBalance(profileData?.balance ?? 0)
      setLoading(false)
    }
    init()
  }, [requestId])

  const handlePay = async () => {
    if (!request || !userId) return
    const amount = request.price_min

    if (balance < amount) {
      setError('Saldo tidak cukup untuk melakukan pembayaran.')
      return
    }

    setPaying(true)
    setError('')

    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: balance - amount })
      .eq('id', userId)

    if (balanceError) {
      setError('Gagal memproses pembayaran. Coba lagi.')
      setPaying(false)
      return
    }

    const { error: reqError } = await supabase
      .from('requests')
      .update({ payment_status: 'paid', amount })
      .eq('id', request.id)

    if (reqError) {
      await supabase.from('profiles').update({ balance }).eq('id', userId)
      setError('Gagal memproses pembayaran. Coba lagi.')
      setPaying(false)
      return
    }

    const { data: requesterProfile } = await supabase
      .from('profiles').select('full_name').eq('id', userId).single()

    if (request.provider_id) {
      await notifyRequestPaid(
        request.provider_id,
        requesterProfile?.full_name ?? 'Requester',
        request.title,
        amount
      )
    }

    setBalance(balance - amount)
    setPaid(true)
    setPaying(false)
  }

  const openWhatsApp = () => {
    if (!request?.provider) return
    const msg = encodeURIComponent(
      `Halo kak ${request.provider.full_name}, aku sudah melakukan pembayaran untuk request "${request.title}" di SkillSwap. Ditunggu ya!`
    )
    window.open(`https://wa.me/${request.provider.whatsapp}?text=${msg}`, '_blank')
  }

  const fmt = (n: number) => `Rp${n.toLocaleString('id-ID')}`

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Memuat...</p>
      </div>
    </div>
  )

  const amount = request?.price_min ?? 0
  const isInsufficient = balance < amount

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-10">
        <button
          onClick={() => router.push('/dashboard/requester')}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Kembali ke Dashboard</span>
        </button>

        {paid ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-2xl p-8 text-center"
          >
            <CheckCircle2 className="w-14 h-14 text-[#4AC204] mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pembayaran Berhasil!</h1>
            <p className="text-gray-500 text-sm mb-1">{request?.title}</p>
            <p className="text-xl font-bold text-[#4AC204] mb-6">{fmt(amount)}</p>
            <p className="text-sm text-gray-500 mb-6">
              Provider sudah diberi tahu. Hubungi mereka untuk koordinasi.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-[#4AC204] hover:bg-[#3fa303] text-white rounded-xl h-12"
                onClick={openWhatsApp}
              >
                Hubungi Provider via WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl h-12"
                onClick={() => router.push('/dashboard/requester')}
              >
                Lihat Dashboard
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1
              className="text-4xl mb-8"
              style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
            >
              Konfirmasi Pembayaran
            </h1>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
              <p className="text-xs text-gray-400 mb-1">Request</p>
              <h2 className="font-bold text-base mb-1">{request?.title}</h2>
              <p className="text-sm text-gray-500">
                dikerjakan oleh {request?.provider?.full_name}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Harga</span>
                <span className="font-bold">{fmt(amount)}</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  Saldo Kamu
                </span>
                <span className={`font-bold ${isInsufficient ? 'text-[#FF474A]' : ''}`}>
                  {fmt(balance)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo Setelah Bayar</span>
                <span className={`font-bold ${isInsufficient ? 'text-[#FF474A]' : 'text-[#4AC204]'}`}>
                  {isInsufficient ? '—' : fmt(balance - amount)}
                </span>
              </div>
            </div>

            {(error || isInsufficient) && (
              <p className="text-sm text-[#FF474A] mb-4 text-center">
                {error || 'Saldo tidak mencukupi untuk pembayaran ini.'}
              </p>
            )}

            <Button
              className="w-full h-12 bg-[#FF6647] hover:bg-[#e5583d] text-white rounded-xl"
              disabled={paying || isInsufficient}
              onClick={handlePay}
            >
              {paying ? 'Memproses...' : `Bayar ${fmt(amount)}`}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Saldo akan ditahan hingga request selesai dikonfirmasi oleh kedua pihak.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
