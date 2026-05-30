'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, Clock, MessageCircle, Bookmark, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

type Service = {
  id: string
  title: string
  description: string
  price_min: number
  price_max: number | null
  estimated_days: number
  is_available: boolean
  categories: { name: string } | null
  profiles: {
    id: string
    full_name: string
    prodi: string
    angkatan: string
    avatar_url: string
    whatsapp: string
    bio: string
  } | null
  reviews: {
    id: string
    rating: number
    comment: string
    created_at: string
    profiles: { full_name: string } | null
  }[]
}

export default function ServiceDetailPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchService = async () => {
      console.log('Fetching service with id:', params.id)

      const { data, error } = await supabase
        .from('services')
        .select(`
          id, title, description, price_min, price_max,
          estimated_days, is_available,
          categories ( name ),
          profiles ( id, full_name, prodi, angkatan, avatar_url, whatsapp, bio ),
          reviews (
            id, rating, comment, created_at,
            profiles!reviews_client_id_fkey ( full_name )
          )
        `)
        .eq('id', params.id)
        .single()

      console.log('DATA:', data)
      console.log('ERROR:', error)

      if (error || !data) {
        setNotFound(true)
      } else {
        setService(data as Service)
      }
      setLoading(false)
    }

    if (params.id) fetchService()
  }, [params.id])

  const getAvgRating = () => {
    if (!service?.reviews?.length) return null
    const avg = service.reviews.reduce((sum, r) => sum + r.rating, 0) / service.reviews.length
    return avg.toFixed(1)
  }

  const formatPrice = (min: number, max?: number | null) => {
    const fmt = (n: number) => `Rp${n.toLocaleString('id-ID')}`
    return max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
  }

  const handleContact = () => {
    if (!service?.profiles?.whatsapp) return
    const msg = encodeURIComponent(
      `Halo kak ${service.profiles.full_name}, aku tertarik dengan jasa "${service.title}" di SkillSwap. Apakah masih tersedia?`
    )
    window.open(`https://wa.me/${service.profiles.whatsapp}?text=${msg}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Memuat jasa...</p>
      </div>
    )
  }

  if (notFound || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Jasa tidak ditemukan</p>
          <p className="text-sm text-muted-foreground mb-4">ID: {params.id}</p>
          <Button onClick={() => router.push('/home')}>Kembali ke Home</Button>
        </div>
      </div>
    )
  }

  const avgRating = getAvgRating()

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Kembali</span>
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBookmarked(!bookmarked)}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-blue-600 text-blue-600' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Category & Availability */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">{service.categories?.name ?? 'Lainnya'}</Badge>
            {service.is_available ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                ✓ Tersedia
              </Badge>
            ) : (
              <Badge variant="destructive">Tidak Tersedia</Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-4">{service.title}</h1>

          {/* Provider Card */}
          <div
            className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl mb-6 cursor-pointer hover:bg-muted transition-colors"
            onClick={() => router.push(`/profile/${service.profiles?.id}`)}
          >
            <Avatar className="w-12 h-12">
              <AvatarImage src={service.profiles?.avatar_url} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {service.profiles?.full_name?.charAt(0) ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{service.profiles?.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {service.profiles?.prodi} · Angkatan {service.profiles?.angkatan}
              </p>
              {service.profiles?.bio && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {service.profiles.bio}
                </p>
              )}
            </div>
            {avgRating && (
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm">{avgRating}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {service.reviews.length} ulasan
                </p>
              </div>
            )}
          </div>

          {/* Price & Duration */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-muted-foreground mb-1">Harga</p>
              <p className="text-xl font-bold text-blue-600">
                {formatPrice(service.price_min, service.price_max)}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Estimasi Waktu</p>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <p className="text-xl font-bold">{service.estimated_days} hari</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Deskripsi Jasa</h2>
            <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {service.description}
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Reviews */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Ulasan</h2>
              {avgRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{avgRating}</span>
                  <span className="text-muted-foreground text-sm">
                    ({service.reviews.length})
                  </span>
                </div>
              )}
            </div>

            {service.reviews.length > 0 ? (
              <div className="space-y-4">
                {service.reviews.map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 bg-muted/50 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">
                        {review.profiles?.full_name ?? 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada ulasan untuk jasa ini.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur border-t border-border p-4">
        <div className="max-w-3xl mx-auto">
          <Button
            onClick={handleContact}
            className="w-full h-12 text-base gap-2 bg-blue-600 hover:bg-blue-700"
            disabled={!service.is_available}
          >
            <MessageCircle className="w-5 h-5" />
            {service.is_available ? 'Hubungi via WhatsApp' : 'Jasa Tidak Tersedia'}
          </Button>
        </div>
      </div>
    </div>
  )
}