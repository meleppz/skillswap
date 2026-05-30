'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, Briefcase, Edit, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

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
  price_min: number
  price_max: number | null
  is_available: boolean
  categories: { name: string } | null
  reviews: { rating: number }[]
}

type Review = {
  id: string
  rating: number
  comment: string
  created_at: string
  services: { title: string } | null
  profiles: { full_name: string } | null
}

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Get profile
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
          id, title, price_min, price_max, is_available,
          categories ( name ),
          reviews ( rating )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
      if (servicesData) setServices(servicesData as Service[])

      // Get reviews received
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          id, rating, comment, created_at,
          services ( title ),
          profiles!reviews_client_id_fkey ( full_name )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
      if (reviewsData) setReviews(reviewsData as Review[])

      setLoading(false)
    }
    init()
  }, [])

  const getAvgRating = (reviewList: { rating: number }[]) => {
    if (!reviewList?.length) return null
    const avg = reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
    return avg.toFixed(1)
  }

  const overallRating = getAvgRating(reviews.map(r => ({ rating: r.rating })))

  const formatPrice = (min: number, max?: number | null) => {
    const fmt = (n: number) => `Rp${(n / 1000).toFixed(0)}rb`
    return max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Memuat profil...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Kembali</span>
          </button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => router.push('/profile/edit')}
          >
            <Edit className="w-4 h-4" />
            Edit Profil
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header */}
          <div className="flex items-start gap-5 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-bold">
                {profile?.full_name?.charAt(0) ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{profile?.full_name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <MapPin className="w-4 h-4" />
                <span>{profile?.prodi} · {profile?.fakultas}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="w-4 h-4" />
                <span>{profile?.whatsapp ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{services.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Jasa Aktif</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{reviews.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Ulasan</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              {overallRating ? (
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <p className="text-2xl font-bold">{overallRating}</p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-muted-foreground">-</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Rating</p>
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {profile.bio}
              </p>
              <Separator className="mb-6" />
            </>
          )}

          {/* Info Badges */}
          <div className="flex gap-2 flex-wrap mb-8">
            <Badge variant="secondary">Angkatan {profile?.angkatan}</Badge>
            <Badge variant="secondary">NIM {profile?.nim}</Badge>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="services">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="services" className="flex-1">
                Jasa Ditawarkan ({services.length})
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1">
                Ulasan Diterima ({reviews.length})
              </TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services">
              {services.length > 0 ? (
                <div className="space-y-4">
                  {services.map((service, i) => {
                    const avg = getAvgRating(service.reviews)
                    return (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 border border-border rounded-xl hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => router.push(`/services/${service.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {service.categories?.name ?? 'Lainnya'}
                              </Badge>
                              {service.is_available ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                                  Tersedia
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  Tidak Tersedia
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-sm">{service.title}</h3>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-blue-600">
                            {formatPrice(service.price_min, service.price_max)}
                          </p>
                          {avg ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium">{avg}</span>
                              <span className="text-xs text-muted-foreground">
                                ({service.reviews.length})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Belum ada ulasan</span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Belum ada jasa yang ditawarkan</p>
                  <Button
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push('/provider')}
                  >
                    Mulai Tawarkan Jasa
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 bg-muted/50 rounded-xl"
                    >
                      <p className="text-xs text-muted-foreground mb-2">
                        Untuk: {review.services?.title}
                      </p>
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
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Belum ada ulasan yang diterima</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}