'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Briefcase, Bell, Plus, Bookmark, Star, LogOut, Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['Semua', 'Teknologi', 'Akademik', 'Desain & Kreatif', 'Foto & Video', 'Bahasa', 'Lainnya']

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
    full_name: string
    prodi: string
    avatar_url: string
  } | null
  reviews: { rating: number }[]
}

export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string } | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
      if (profileData) setProfile(profileData)

      // Get services
      await fetchServices()
    }
    init()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select(`
        id, title, description, price_min, price_max,
        estimated_days, is_available,
        categories ( name ),
        profiles ( full_name, prodi, avatar_url ),
        reviews ( rating )
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (!error && data) setServices(data as unknown as Service[])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getAvgRating = (reviews: { rating: number }[]) => {
    if (!reviews?.length) return null
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    return avg.toFixed(1)
  }

  const filtered = services.filter(s => {
    const categoryName = s.categories?.name ?? 'Lainnya'
    const matchCategory = activeCategory === 'Semua' || categoryName === activeCategory
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const formatPrice = (min: number, max?: number | null) => {
    const fmt = (n: number) => `Rp${(n / 1000).toFixed(0)}rb`
    return max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="text-blue-600 w-6 h-6" />
            <span className="text-xl font-bold text-blue-600">SkillSwap</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/orders')}
            >
              <Package className="w-4 h-4" />
              <span className="hidden md:inline">Orders</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => router.push('/provider')}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Provider Mode</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Avatar
              className="w-9 h-9 cursor-pointer"
              onClick={() => router.push('/profile')}
            >
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                {profile?.full_name?.charAt(0) ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-1">
            Halo, {profile?.full_name?.split(' ')[0] ?? 'Mahasiswa'} 👋
          </h1>
          <p className="text-muted-foreground mb-6">
            Temukan jasa yang kamu butuhkan dari sesama mahasiswa.
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Cari jasa, misal: translate jurnal..."
              className="pl-10 h-12 text-base"
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
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-muted/50 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((service, i) => {
              const avgRating = getAvgRating(service.reviews)
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
                  onClick={() => router.push(`/services/${service.id}`)}
                >
                  {/* Provider Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={service.profiles?.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                          {service.profiles?.full_name?.charAt(0) ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{service.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{service.profiles?.prodi}</p>
                      </div>
                    </div>
                    <button
                      className="text-muted-foreground hover:text-blue-600 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Service Info */}
                  <Badge variant="secondary" className="mb-3 text-xs">
                    {service.categories?.name ?? 'Lainnya'}
                  </Badge>
                  <h3 className="font-semibold text-base mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {service.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-sm font-bold text-blue-600">
                        {formatPrice(service.price_min, service.price_max)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ~{service.estimated_days} hari
                      </p>
                    </div>
                    {avgRating ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{avgRating}</span>
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
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Tidak ada jasa yang ditemukan 😕</p>
            <p className="text-sm mt-1">Coba kata kunci atau kategori lain</p>
          </div>
        )}
      </div>
    </div>
  )
}