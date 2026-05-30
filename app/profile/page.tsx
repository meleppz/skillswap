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

const DUMMY_MY_SERVICES = [
  {
    id: '1',
    title: 'Jasa Install Ulang OS & Setup Software',
    category: 'Teknologi',
    price_min: 50000,
    price_max: 100000,
    rating: 4.9,
    review_count: 12,
    is_available: true,
  },
]

const DUMMY_REVIEWS_RECEIVED = [
  {
    id: 'r1',
    service_title: 'Jasa Install Ulang OS & Setup Software',
    client_name: 'Budi S.',
    rating: 5,
    comment: 'Cepat dan beres semua, recommended!',
    created_at: '2024-03-10',
  },
  {
    id: 'r2',
    service_title: 'Jasa Install Ulang OS & Setup Software',
    client_name: 'Maya P.',
    rating: 5,
    comment: 'Sabar banget ngejelasinnya, laptop langsung lancar.',
    created_at: '2024-03-05',
  },
]

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<{
    full_name: string
    nim: string
    prodi: string
    fakultas: string
    angkatan: string
    whatsapp: string
    avatar_url: string
    bio: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data)
      setLoading(false)
    }
    getProfile()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Memuat profil...</p>
      </div>
    )
  }

  const formatPrice = (min: number, max?: number) => {
    const fmt = (n: number) => `Rp${(n / 1000).toFixed(0)}rb`
    return max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
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
              <p className="text-2xl font-bold text-blue-600">
                {DUMMY_MY_SERVICES.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Jasa Aktif</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">15</p>
              <p className="text-xs text-muted-foreground mt-1">Total Order</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <p className="text-2xl font-bold">4.9</p>
              </div>
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
                Jasa Ditawarkan
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1">
                Ulasan Diterima
              </TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services">
              {DUMMY_MY_SERVICES.length > 0 ? (
                <div className="space-y-4">
                  {DUMMY_MY_SERVICES.map((service, i) => (
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
                              {service.category}
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
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{service.rating}</span>
                          <span className="text-xs text-muted-foreground">({service.review_count})</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
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
              {DUMMY_REVIEWS_RECEIVED.length > 0 ? (
                <div className="space-y-4">
                  {DUMMY_REVIEWS_RECEIVED.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 bg-muted/50 rounded-xl"
                    >
                      <p className="text-xs text-muted-foreground mb-2">
                        Untuk: {review.service_title}
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{review.client_name}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                      <p className="text-xs text-muted-foreground mt-2">{review.created_at}</p>
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