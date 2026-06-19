'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Star, X, MessageCircle, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navbar from '@/components/navbar'
import { notifyRequestTaken } from '@/lib/notifications'
import NewRequestModal from '@/components/modals/new-request-modal'
import RequestDetailModal from '@/components/modals/request-detail-modal'
import type { RequestDetailType } from '@/components/modals/request-detail-modal'

const CATEGORIES = ['Semua', 'Teknologi', 'Akademik', 'Desain & Kreatif', 'Foto & Video', 'Bahasa', 'Lainnya']

type Request = RequestDetailType

export default function RequestsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [selectedRequest, setSelectedRequest] = useState<RequestDetailType | null>(null)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (profileData) setProfile(profileData)

      await fetchRequests()
    }
    init()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('requests')
      .select(`
        id, title, description, price_min, price_max, deadline, status,
        categories ( name ),
        profiles!requests_requester_id_fkey ( id, full_name, prodi, angkatan, avatar_url, whatsapp )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (!error && data) setRequests(data as unknown as Request[])
    setLoading(false)
  }

  const formatPrice = (min: number, max?: number | null) => {
    const fmt = (n: number) => `Rp${n.toLocaleString('id-ID')}`
    return max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleHubungi = async () => {
    if (!selectedRequest || !currentUserId) return

    const { data: providerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', currentUserId)
      .single()
    const providerName = providerProfile?.full_name ?? 'Provider'

    // Update request langsung jadi ongoing + isi provider_id
    const { error } = await supabase
      .from('requests')
      .update({
        status: 'ongoing',
        provider_id: currentUserId,
      })
      .eq('id', selectedRequest.id)

    if (!error && selectedRequest.profiles?.id) {
      await notifyRequestTaken(
        selectedRequest.profiles.id,
        providerName,
        selectedRequest.title
      )
    }

    const msg = encodeURIComponent(
      `Halo kak ${selectedRequest.profiles?.full_name}, aku tertarik untuk mengerjakan request "${selectedRequest.title}" di SkillSwap.`
    )
    window.open(`https://wa.me/${selectedRequest.profiles?.whatsapp}?text=${msg}`, '_blank')
    setConfirmDialog(false)
    setSelectedRequest(null)

    // Refresh list — request yang ongoing ngga akan muncul lagi
    await fetchRequests()
  }

  const filtered = requests.filter(r => {
    const categoryName = r.categories?.name ?? 'Lainnya'
    const matchCategory = activeCategory === 'Semua' || categoryName === activeCategory
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1
            className="text-5xl mb-6"
            style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
          >
            Hi {profile?.full_name?.split(' ')[0] ?? 'Mahasiswa'}, lagi kepepet apa hari ini?
          </h1>
          <div className="max-w-2xl mx-auto">
            <Input
              placeholder="Cari request..."
              className="h-12 bg-white border-gray-200 rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? 'bg-[#074DDB] text-white border-[#074DDB]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((request, i) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                {/* Requester */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={request.profiles?.avatar_url} />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-semibold">
                        {request.profiles?.full_name?.charAt(0) ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{request.profiles?.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {request.profiles?.prodi} '{request.profiles?.angkatan?.slice(-2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <Badge variant="outline" className="mb-2 text-xs rounded-full">
                  {request.categories?.name ?? 'Lainnya'}
                </Badge>

                {/* Title & Desc */}
                <h3 className="font-bold text-base mb-1 line-clamp-2">{request.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{request.description}</p>

                <hr className="border-gray-100 mb-3" />

                {/* Footer */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-lg font-bold">{formatPrice(request.price_min, request.price_max)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-400">
                        Deadline: {formatDeadline(request.deadline)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>Tidak ada request yang ditemukan</p>
          </div>
        )}
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setShowNewRequestModal(true)}
        className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 bg-[#FF6647] text-white rounded-full font-medium shadow-lg hover:bg-[#e5583d] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Tambahkan Request
      </button>

      {/* Request Detail Modal */}
      <RequestDetailModal
        request={selectedRequest}
        currentUserId={currentUserId}
        onClose={() => setSelectedRequest(null)}
        onHubungi={() => setConfirmDialog(true)}
      />

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="font-bold text-lg mb-2">Hubungi Requester?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Kamu akan diarahkan ke WhatsApp dan sesi pengerjaan akan dimulai. Pastikan kamu siap untuk mengerjakan request ini.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setConfirmDialog(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-[#FF6647] hover:bg-[#e5583d] text-white rounded-xl"
                  onClick={handleHubungi}
                >
                  Ya, Kerjakan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <NewRequestModal
        open={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        onSuccess={async () => {
          setShowNewRequestModal(false)
          await fetchRequests()
        }}
      />
    </div>
  )
}