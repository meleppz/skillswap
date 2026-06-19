'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'


const STATS = [
  { value: '200+', label: 'Pengguna Aktif Terverifikasi' },
  { value: '1500+', label: 'Transaksi Selesai' },
  { value: 'Rp0', label: 'Biaya Potongan Aplikasi' },
]

const FEATURES = [
  {
    title: 'Pamerkan Skill, Jemput Rezeki',
    desc: 'Punya keahlian ngoding python, bikin mockup UI/UX, atau jago bikin PPT estetik? Buka lapak jasamu sendiri. Atur deskripsimu, pasang tarif fleksibel khas mahasiswa, dan kumpulkan rating bintang 5 untuk membangun reputasi profesionalmu sejak semester awal!',
  },
  {
    title: 'Tugas Numpuk? Lempar Kendali',
    desc: 'Lagi mager keluar kosan pas hujan atau pusing nyari kecocokan aset ilustrasi beres semalem berkat bantuan anak DKV sebelah, harganya juga bersahabat banget dibanding nyari freelance di luar. Biarkan rekan mahasiswa lain yang punya waktu senggang atau keahlian mumpuni menawarkan bantuan mereka kepadamu.',
  },
  {
    title: 'Pantau Status Transaksi Real-Time',
    desc: 'Semua aktivitas lapak dan permintaan bantuanmu dirangkum dalam satu Dashboard terpadu. Kelola status lapakmu dengan fleksibel serta pantau ringkasan performa dan riwayat ulasanmu secara transparan.',
  },
]

const TESTIMONIALS = [
  {
    quote: '"Asli terbantu banget pas minggu-minggu UAS! Tugas bikin aset ilustrasi beres semalem berkat bantuan anak DKV sebelah, harganya juga bersahabat banget dibanding nyari freelance di luar."',
    name: 'Andi',
    prodi: "Teknik Informatika '22",
  },
  {
    quote: '"Iseng buka Lapak Jasa kelola data Excel, ternyata lumayan banget bisa dapet tambahan uang jajan mingguan dari sela-sela jam kosong kuliah. Proses hubungannya gampang dan langsung deal lewat WA."',
    name: 'Chosou',
    prodi: "Sistem dan Teknologi Informasi '22",
  },
  {
    quote: '"Iseng buka Lapak Jasa kelola data Excel, ternyata lumayan banget bisa dapet tambahan uang jajan mingguan dari sela-sela jam kosong kuliah. Proses hubungannya gampang dan langsung deal lewat WA."',
    name: 'Chosou',
    prodi: "Aktuaria '22",
  },
]

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Image src="/logo.png" alt="SkillSwap" width={120} height={32} className="object-contain" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="text-sm font-medium px-5 py-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/login')}
              className="text-sm font-medium px-5 py-2 rounded-full bg-[#FF6647] text-white hover:bg-[#e5583d] transition-colors"
            >
              Get Started!
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Image src="/logo.png" alt="SkillSwap" width={100} height={28} className="mx-auto object-contain" />
          </div>
          <h1
            className="text-8xl md:text-9xl leading-none mb-8 uppercase"
            style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
          >
            Solusi Tugasmu, Sumber Cuanmu
          </h1>
          <p className="text-base text-gray-600 max-w-lg mx-auto mb-10 leading-relaxed">
            Platform peer-to-peer marketplace perdana khusus mahasiswa terverifikasi. Cari rekan tepercaya untuk bantu kamu ngerjain tugas, atau tawarkan keahlianmu sendiri untuk tambah uang jajan tanpa potongan komisi!
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 rounded-full bg-[#FF6647] text-white font-medium hover:bg-[#e5583d] transition-colors"
          >
            Gabung Skillswap!
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-8 bg-[#074DDB]">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8 text-center">
          {STATS.map((stat, i) => (
            <div key={i}>
              <p
                className="text-7xl md:text-8xl leading-none mb-3 text-white"
                style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
              >
                {stat.value}
              </p>
              <p className="text-sm text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-5xl md:text-6xl text-center mb-4 uppercase"
            style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
          >
            Dari Mahasiswa, Oleh Mahasiswa, Untuk Mahasiswa
          </h2>
          <p className="text-center text-gray-600 text-sm mb-16 max-w-xl mx-auto">
            Nyalakan roda ekonomi dan kolaborasi di lingkungan kampus. Temukan talenta terbaik rekan sebelahmu untuk menyelesaikan urusanmu, atau jemput cuan pertamamu di sini.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-6 border border-gray-200 rounded-2xl bg-white shadow-md">
                <div className="w-10 h-10 rounded-full bg-gray-200 mb-5" />
                <h3 className="font-bold text-base mb-3">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-8 bg-[#074DDB]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/3 shrink-0">
            <h2
              className="text-7xl md:text-8xl uppercase leading-none text-white"
              style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
            >
              Apa Kata Mereka?
            </h2>
          </div>
          <div
            className="flex-1 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
            ref={(el) => {
              if (!el) return
              let isDown = false
              let startX = 0
              let scrollLeft = 0

              el.addEventListener('mousedown', (e) => {
                isDown = true
                startX = e.pageX - el.offsetLeft
                scrollLeft = el.scrollLeft
              })
              el.addEventListener('mouseleave', () => { isDown = false })
              el.addEventListener('mouseup', () => { isDown = false })
              el.addEventListener('mousemove', (e) => {
                if (!isDown) return
                e.preventDefault()
                const x = e.pageX - el.offsetLeft
                const walk = (x - startX) * 1.5
                el.scrollLeft = scrollLeft - walk
              })
            }}
          >
            <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="flex flex-col justify-between p-6 bg-white rounded-2xl border border-gray-200 shadow-md w-72 shrink-0">
                  <p className="text-sm text-gray-700 leading-relaxed mb-6">{t.quote}</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.prodi}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-5xl md:text-6xl uppercase leading-tight mb-6"
            style={{ fontFamily: 'HelveticaCompressed, Arial Narrow, sans-serif' }}
          >
            Gak Usah Pusing Sendirian. Gabung Skillswap! Sekarang
          </h2>
          <p className="text-sm text-gray-600 mb-10 leading-relaxed">
            Saling bantu urusan kampus jadi lebih aman, cepat, dan 100% bebas biaya komisi. Cukup daftar pakai email institusi kampusmu dan langsung temukan solusinya tugasmu!
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 rounded-full bg-[#FF6647] text-white font-medium hover:bg-[#e5583d] transition-colors"
          >
            Gabung Skillswap!
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#074DDB] text-white py-16 px-8">
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