'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, Bookmark } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/navbar'

type Profile = {
  full_name: string
  nim: string
  prodi: string
  fakultas: string
  angkatan: string
  whatsapp: string
  avatar_url: string
  bio: string
}

type Service = {
  id: string
  title: string
  description: string
  price_min: number
  price_max: number | null
  estimated_days: number
  is_available: boolean
  categories: { name: string } | null
  reviews: { rating: number }[]
}

type RatingDistribution = {
  [key: number]: number
}

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [bookmarks, setBookmarks] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setEmail(user.email ?? '')

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profileData) setProfile(profileData)

      // Get my services
      const { data: servicesData } = await supabase
        .from('services')
        .select(`
          id, title, description, price_min, price_max,
          estimated_days, is_available,
          categories ( name ),
          reviews ( rating )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
      if (servicesData) setServices(servicesData as Service[])

      // Get bookmarks
      const { data: bookmarksData } = await supabase
        .from('bookmarks')
        .select(`
          services (
            id, title, description, price_min, price_max,
            estimated_days, is_available,
            categories ( name ),
            reviews ( rating )
          )
        `)
        .eq('user_id', user.id)
      if (bookmarksData) {
        const bookmarkedServices = bookmarksData
          .map((b: any) => b.services)
          .filter(Boolean)
        setBookmarks(bookmarkedServices as Service[])
      }

      setLoading(false)
    }
    init()
  }, [])

  const getAvgRating = (reviews: { rating: number }[]) => {
    if (!reviews?.length) return null
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  }

  const getAllReviews = () => {
    return services.flatMap(s => s.reviews)
  }

  const getRatingDistribution = (): RatingDistribution => {
    const reviews = getAllReviews()
    const dist: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1 })
    return dist
  }

  const overallRating = getAvgRating(getAllReviews())
  const totalReviews = getAllReviews().length
  const ratingDist = getRatingDistribution()

  const formatPrice = (min: number, max?: number | null) => {
    const fmt = (n: number) => `Rp${n.toLocaleString('id-ID')}`
    return max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Memuat profil...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-20 h-20 shrink-0">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gray-100 text-gray-600 text-2xl font-bold">
                  {profile?.full_name?.charAt(0) ?? 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">{profile?.full_name}</h1>
                <p className="text-sm text-gray-500 mb-1">{email}</p>
                <p className="text-sm text-gray-500 mb-3">
                  {profile?.prodi} '{profile?.angkatan?.slice(-2)}
                </p>
                {overallRating && (
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{overallRating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({totalReviews})</span>
                  </div>
                )}
                {profile?.bio && (
                  <Badge variant="outline" className="text-xs rounded-full">
                    {profile.bio}
                  </Badge>
                )}
              </div>

              {/* Rating Distribution */}
              {totalReviews > 0 && (
                <div className="shrink-0 space-y-1.5 min-w-[180px]">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = ratingDist[star] || 0
                    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-3">{star}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-yellow-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* About Me */}
          {profile?.bio && (
            <div className="mb-8">
              <h2 className="font-bold text-lg mb-3">About Me</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Services */}
          <div className="mb-8">
            <h2 className="font-bold text-lg mb-4">Service yang Ditawarkan</h2>
            {services.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white border border-gray-200 rounded-2xl">
                <p className="text-sm">Belum ada service yang ditawarkan</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service, i) => {
                  const avg = getAvgRating(service.reviews)
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => router.push('/services')}
                    >
                      {/* Provider row */}
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                            {profile?.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{profile?.full_name}</p>
                          <p className="text-xs text-gray-400">
                            {profile?.prodi} '{profile?.angkatan?.slice(-2)}
                          </p>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-xs rounded-full mb-2">
                        {service.categories?.name ?? 'Lainnya'}
                      </Badge>

                      <h3 className="font-bold text-sm mb-1 line-clamp-2">{service.title}</h3>
                      <p className="text-xs text-gray-400 line-clamp-1 mb-4">
                        {service.description}
                      </p>

                      <hr className="border-gray-100 mb-3" />

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="font-bold text-base">
                            {formatPrice(service.price_min, service.price_max)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Pengerjaan: {service.estimated_days} Hari
                          </p>
                        </div>
                        {avg && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{avg.toFixed(1)}</span>
                            <span className="text-xs text-gray-400">({service.reviews.length})</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bookmarks */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="w-5 h-5" />
              <h2 className="font-bold text-lg">Service Disimpan</h2>
            </div>
            {bookmarks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white border border-gray-200 rounded-2xl">
                <p className="text-sm">Belum ada service yang disimpan</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookmarks.map((service, i) => {
                  const avg = getAvgRating(service.reviews)
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => router.push('/services')}
                    >
                      <Badge variant="outline" className="text-xs rounded-full mb-2">
                        {service.categories?.name ?? 'Lainnya'}
                      </Badge>

                      <h3 className="font-bold text-sm mb-1 line-clamp-2">{service.title}</h3>
                      <p className="text-xs text-gray-400 line-clamp-1 mb-4">
                        {service.description}
                      </p>

                      <hr className="border-gray-100 mb-3" />

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="font-bold text-base">
                            {formatPrice(service.price_min, service.price_max)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Pengerjaan: {service.estimated_days} Hari
                          </p>
                        </div>
                        {avg && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{avg.toFixed(1)}</span>
                            <span className="text-xs text-gray-400">({service.reviews.length})</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-8 mt-16">
        <div className="max-w-5xl mx-auto text-center">
          <p
            className="text-5xl uppercase mb-6"
            style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
          >
            SKILLSWAP!
          </p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-lg mx-auto">
            SkillSwap! Platform Original Konsolidasi Ekonomi Mikro Jasa Peer-to-Peer Mahasiswa.<br />
            Dikembangkan secara khusus sebagai pemenuhan komponen teknis nilai UAS pada mata kuliah II2210 Teknologi Platform.<br />
            Sekolah Teknik Elektro dan Informatika, Institut Teknologi Bandung. Semester II Tahun Akademik 2025/2026.<br />
            © 2026 SkillSwap. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </footer>
    </div>
  )
}