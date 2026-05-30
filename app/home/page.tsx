'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Briefcase, Bell, User, Plus, Bookmark, Star, LogOut } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['Semua', 'Teknologi', 'Akademik', 'Desain & Kreatif', 'Foto & Video', 'Bahasa', 'Lainnya']

// Dummy data for now
const DUMMY_SERVICES = [
  {
    id: '1',
    title: 'Jasa Install Ulang OS & Setup Software',
    description: 'Install Windows/Linux + software riset, coding, atau desain sesuai kebutuhan kamu.',
    price_min: 50000,
    price_max: 100000,
    estimated_days: 1,
    category: 'Teknologi',
    provider: { full_name: 'Andi Pratama', prodi: 'Teknik Informatika', avatar_url: '' },
    rating: 4.9,
    review_count: 12,
  },
  {
    id: '2',
    title: 'Jasa Translate Abstrak Jurnal Inggris-Indonesia',
    description: 'Translate abstrak jurnal ilmiah dengan bahasa akademik yang tepat dan natural.',
    price_min: 30000,
    price_max: 50000,
    estimated_days: 1,
    category: 'Akademik',
    provider: { full_name: 'Sari Dewi', prodi: 'Sastra Inggris', avatar_url: '' },
    rating: 5.0,
    review_count: 8,
  },
  {
    id: '3',
    title: 'Jasa Foto Dokumentasi Wisuda & Sidang',
    description: 'Foto dokumentasi momen wisuda atau sidang skripsi dengan kamera mirrorless.',
    price_min: 150000,
    price_max: 300000,
    estimated_days: 1,
    category: 'Foto & Video',
    provider: { full_name: 'Rizky Fajar', prodi: 'Ilmu Komunikasi', avatar_url: '' },
    rating: 4.8,
    review_count: 23,
  },
  {
    id: '4',
    title: 'Jasa Desain Poster & Infografis',
    description: 'Desain poster acara, infografis tugas, atau konten sosmed dengan Figma/Canva Pro.',
    price_min: 40000,
    price_max: 80000,
    estimated_days: 2,
    category: 'Desain & Kreatif',
    provider: { full_name: 'Maya Putri', prodi: 'Desain Komunikasi Visual', avatar_url: '' },
    rating: 4.7,
    review_count: 31,
  },
  {
    id: '5',
    title: 'Jasa Olah Data SPSS & Interpretasi',
    description: 'Bantu olah data skripsi/penelitian pakai SPSS lengkap dengan interpretasi hasil.',
    price_min: 75000,
    price_max: 150000,
    estimated_days: 2,
    category: 'Akademik',
    provider: { full_name: 'Budi Santoso', prodi: 'Statistika', avatar_url: '' },
    rating: 4.9,
    review_count: 17,
  },
  {
    id: '6',
    title: 'Jasa Pembuatan Website Portfolio',
    description: 'Buatkan website portfolio personal pakai React/Next.js yang modern dan responsive.',
    price_min: 200000,
    price_max: 500000,
    estimated_days: 7,
    category: 'Teknologi',
    provider: { full_name: 'Kevin Lie', prodi: 'Sistem Informasi', avatar_url: '' },
    rating: 4.8,
    review_count: 9,
  },
]

export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string } | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data)
    }
    getProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filtered = DUMMY_SERVICES.filter(s => {
    const matchCategory = activeCategory === 'Semua' || s.category === activeCategory
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const formatPrice = (min: number, max?: number) => {
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
              variant="outline"
              size="sm"
              className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => router.push('/provider')}
            >
              <Plus className="w-4 h-4" />
              Provider Mode
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service, i) => (
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
                    <AvatarImage src={service.provider.avatar_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                      {service.provider.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{service.provider.full_name}</p>
                    <p className="text-xs text-muted-foreground">{service.provider.prodi}</p>
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
                {service.category}
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
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{service.rating}</span>
                  <span className="text-xs text-muted-foreground">({service.review_count})</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Tidak ada jasa yang ditemukan 😕</p>
            <p className="text-sm mt-1">Coba kata kunci atau kategori lain</p>
          </div>
        )}
      </div>
    </div>
  )
}