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

// Dummy data (same as home for now)
const DUMMY_SERVICES = [
  {
    id: '1',
    title: 'Jasa Install Ulang OS & Setup Software',
    description: 'Install Windows/Linux + software riset, coding, atau desain sesuai kebutuhan kamu.\n\nYang termasuk dalam layanan:\n• Install OS Windows 10/11 atau Linux (Ubuntu, dll)\n• Setup driver lengkap\n• Install software sesuai kebutuhan (VS Code, SPSS, Adobe, dll)\n• Estimasi waktu pengerjaan 1-2 jam\n\nYang tidak termasuk:\n• Hardware troubleshooting\n• Data recovery',
    price_min: 50000,
    price_max: 100000,
    estimated_days: 1,
    category: 'Teknologi',
    is_available: true,
    provider: {
      id: 'p1',
      full_name: 'Andi Pratama',
      prodi: 'Teknik Informatika',
      angkatan: '2021',
      avatar_url: '',
      whatsapp: '081234567890',
      bio: 'Mahasiswa TI yang suka bantu teman-teman soal masalah laptop dan coding.',
      rating: 4.9,
      review_count: 12,
      total_orders: 15,
    },
    reviews: [
      { id: 'r1', client_name: 'Budi S.', rating: 5, comment: 'Cepat dan beres semua, recommended!', created_at: '2024-03-10' },
      { id: 'r2', client_name: 'Maya P.', rating: 5, comment: 'Sabar banget ngejelasinnya, laptop langsung lancar.', created_at: '2024-03-05' },
      { id: 'r3', client_name: 'Rizky F.', rating: 4, comment: 'Oke, cuma agak lama nunggu jadwal.', created_at: '2024-02-28' },
    ],
  },
  {
    id: '2',
    title: 'Jasa Translate Abstrak Jurnal Inggris-Indonesia',
    description: 'Translate abstrak jurnal ilmiah dengan bahasa akademik yang tepat dan natural.\n\nYang termasuk dalam layanan:\n• Translate Inggris → Indonesia atau sebaliknya\n• Menjaga tone akademik\n• Revisi 1x gratis\n\nYang tidak termasuk:\n• Translate dokumen panjang (lebih dari 500 kata)',
    price_min: 30000,
    price_max: 50000,
    estimated_days: 1,
    category: 'Akademik',
    is_available: true,
    provider: {
      id: 'p2',
      full_name: 'Sari Dewi',
      prodi: 'Sastra Inggris',
      angkatan: '2022',
      avatar_url: '',
      whatsapp: '081234567891',
      bio: 'Mahasiswi Sastra Inggris, berpengalaman translate jurnal akademik.',
      rating: 5.0,
      review_count: 8,
      total_orders: 10,
    },
    reviews: [
      { id: 'r1', client_name: 'Kevin L.', rating: 5, comment: 'Hasilnya natural banget, dosen juga approved!', created_at: '2024-03-12' },
    ],
  },
  {
    id: '3',
    title: 'Jasa Foto Dokumentasi Wisuda & Sidang',
    description: 'Foto dokumentasi momen wisuda atau sidang skripsi dengan kamera mirrorless.',
    price_min: 150000,
    price_max: 300000,
    estimated_days: 1,
    category: 'Foto & Video',
    is_available: true,
    provider: {
      id: 'p3',
      full_name: 'Rizky Fajar',
      prodi: 'Ilmu Komunikasi',
      angkatan: '2020',
      avatar_url: '',
      whatsapp: '081234567892',
      bio: 'Fotografer kampus, udah dokumentasi 20+ wisuda dan sidang.',
      rating: 4.8,
      review_count: 23,
      total_orders: 25,
    },
    reviews: [],
  },
  {
    id: '4',
    title: 'Jasa Desain Poster & Infografis',
    description: 'Desain poster acara, infografis tugas, atau konten sosmed dengan Figma/Canva Pro.',
    price_min: 40000,
    price_max: 80000,
    estimated_days: 2,
    category: 'Desain & Kreatif',
    is_available: true,
    provider: {
      id: 'p4',
      full_name: 'Maya Putri',
      prodi: 'Desain Komunikasi Visual',
      angkatan: '2021',
      avatar_url: '',
      whatsapp: '081234567893',
      bio: 'DKV student yang passionate sama visual design.',
      rating: 4.7,
      review_count: 31,
      total_orders: 35,
    },
    reviews: [],
  },
  {
    id: '5',
    title: 'Jasa Olah Data SPSS & Interpretasi',
    description: 'Bantu olah data skripsi/penelitian pakai SPSS lengkap dengan interpretasi hasil.',
    price_min: 75000,
    price_max: 150000,
    estimated_days: 2,
    category: 'Akademik',
    is_available: true,
    provider: {
      id: 'p5',
      full_name: 'Budi Santoso',
      prodi: 'Statistika',
      angkatan: '2020',
      avatar_url: '',
      whatsapp: '081234567894',
      bio: 'Statistika 2020, udah bantu 15+ teman olah data skripsi.',
      rating: 4.9,
      review_count: 17,
      total_orders: 20,
    },
    reviews: [],
  },
  {
    id: '6',
    title: 'Jasa Pembuatan Website Portfolio',
    description: 'Buatkan website portfolio personal pakai React/Next.js yang modern dan responsive.',
    price_min: 200000,
    price_max: 500000,
    estimated_days: 7,
    category: 'Teknologi',
    is_available: true,
    provider: {
      id: 'p6',
      full_name: 'Kevin Lie',
      prodi: 'Sistem Informasi',
      angkatan: '2021',
      avatar_url: '',
      whatsapp: '081234567895',
      bio: 'Full-stack developer, suka bikin web yang clean dan modern.',
      rating: 4.8,
      review_count: 9,
      total_orders: 11,
    },
    reviews: [],
  },
]

export default function ServiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [bookmarked, setBookmarked] = useState(false)

  const service = DUMMY_SERVICES.find(s => s.id === params.id)

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Jasa tidak ditemukan</p>
          <Button onClick={() => router.push('/home')}>Kembali ke Home</Button>
        </div>
      </div>
    )
  }

  const formatPrice = (min: number, max?: number) => {
    const fmt = (n: number) => `Rp${n.toLocaleString('id-ID')}`
    return max ? `${fmt(min)} – ${fmt(max)}` : fmt(min)
  }

  const handleContact = () => {
    const msg = encodeURIComponent(`Halo kak ${service.provider.full_name}, aku tertarik dengan jasa "${service.title}" di SkillSwap. Apakah masih tersedia?`)
    window.open(`https://wa.me/${service.provider.whatsapp}?text=${msg}`, '_blank')
  }

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

      <div className="max-w-3xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Category & Availability */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">{service.category}</Badge>
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
            onClick={() => router.push(`/profile/${service.provider.id}`)}
          >
            <Avatar className="w-12 h-12">
              <AvatarImage src={service.provider.avatar_url} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {service.provider.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{service.provider.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {service.provider.prodi} · Angkatan {service.provider.angkatan}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-sm">{service.provider.rating}</span>
              </div>
              <p className="text-xs text-muted-foreground">{service.provider.total_orders} order</p>
            </div>
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
                <p className="text-xl font-bold">
                  {service.estimated_days} hari
                </p>
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
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{service.provider.rating}</span>
                <span className="text-muted-foreground text-sm">({service.provider.review_count})</span>
              </div>
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
              <p className="text-sm text-muted-foreground">Belum ada ulasan untuk jasa ini.</p>
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
            Hubungi via WhatsApp
          </Button>
        </div>
      </div>
    </div>
  )
}