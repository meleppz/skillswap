'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Wallet, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/navbar'
import { notifyPaymentConfirmed } from '@/lib/notifications'

type OrderDetail = {
  id: string
  status: string
  payment_status: string | null
  amount: number | null
  services: {
    id: string
    title: string
    price_min: number
    price_unit: string | null
    profiles: {
      id: string
      full_name: string
      whatsapp: string
    } | null
  } | null
}

export default function PaymentPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
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

      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id, status, payment_status, amount,
          services (
            id, title, price_min, price_unit,
            profiles!services_provider_id_fkey ( id, full_name, whatsapp )
          )
        `)
        .eq('id', orderId)
        .eq('client_id', user.id)
        .single()

      if (!orderData) {
        router.push('/services')
        return
      }

      setOrder(orderData as unknown as OrderDetail)
      if (orderData.payment_status === 'paid') setPaid(true)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single()

      setBalance(profileData?.balance ?? 0)
      setLoading(false)
    }
    init()
  }, [orderId])

  const handlePay = async () => {
    if (!order || !userId) return
    const amount = order.services?.price_min ?? 0

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

    const { error: orderError } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', amount })
      .eq('id', order.id)

    if (orderError) {
      await supabase.from('profiles').update({ balance }).eq('id', userId)
      setError('Gagal memproses pembayaran. Coba lagi.')
      setPaying(false)
      return
    }

    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    const provider = order.services?.profiles
    if (provider?.id) {
      await notifyPaymentConfirmed(
        provider.id,
        clientProfile?.full_name ?? 'Client',
        order.services?.title ?? '',
        amount
      )
    }

    setBalance(balance - amount)
    setPaid(true)
    setPaying(false)
  }

  const openWhatsApp = () => {
    const provider = order?.services?.profiles
    if (!provider) return
    const msg = encodeURIComponent(
      `Halo kak ${provider.full_name}, aku sudah melakukan pembayaran untuk jasa "${order?.services?.title}" di SkillSwap. Siap untuk mulai!`
    )
    window.open(`https://wa.me/${provider.whatsapp}?text=${msg}`, '_blank')
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

  const amount = order?.services?.price_min ?? 0
  const isInsufficient = balance < amount

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-10">
        <button
          onClick={() => router.push('/services')}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Kembali</span>
        </button>

        {paid ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-2xl p-8 text-center"
          >
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pembayaran Berhasil!</h1>
            <p className="text-gray-500 text-sm mb-1">{order?.services?.title}</p>
            <p className="text-xl font-bold text-green-600 mb-6">{fmt(amount)}</p>
            <p className="text-sm text-gray-500 mb-6">
              Hubungi provider untuk mulai mengerjakan pesananmu.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12"
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
              <p className="text-xs text-gray-400 mb-1">Jasa</p>
              <h2 className="font-bold text-base mb-1">{order?.services?.title}</h2>
              <p className="text-sm text-gray-500">
                oleh {order?.services?.profiles?.full_name}
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
                <span className={`font-bold ${isInsufficient ? 'text-red-500' : ''}`}>
                  {fmt(balance)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo Setelah Bayar</span>
                <span className={`font-bold ${isInsufficient ? 'text-red-500' : 'text-green-600'}`}>
                  {isInsufficient ? '—' : fmt(balance - amount)}
                </span>
              </div>
            </div>

            {(error || isInsufficient) && (
              <p className="text-sm text-red-500 mb-4 text-center">
                {error || 'Saldo tidak mencukupi untuk pembayaran ini.'}
              </p>
            )}

            <Button
              className="w-full h-12 bg-gray-900 hover:bg-gray-700 text-white rounded-xl"
              disabled={paying || isInsufficient}
              onClick={handlePay}
            >
              {paying ? 'Memproses...' : `Bayar ${fmt(amount)}`}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Saldo akan ditahan hingga pesanan selesai dikonfirmasi oleh kedua pihak.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
