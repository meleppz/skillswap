# TODO: Payment (Request) & Color Refactor

## 💳 Payment — Requests
- [x] Update confirmation dialog di requests/page.tsx → "Ya, Kerjakan"
- [x] Kirim notif ke requester saat provider ambil request
- [x] Tambah tombol "Bayar Sekarang" di dashboard requester (request ongoing + unpaid)
- [x] Buat halaman /payment/request/[requestId]
- [x] Logic balance deduction saat requester bayar
- [x] Update payment_status = 'paid' → notif ke provider
- [x] Block provider "Tandai Selesai" sampai payment_status = 'paid'
- [x] Balance transfer ke provider saat requester konfirmasi selesai
- [x] Refund flow untuk request

## 🎨 Color Refactor
- [x] globals.css — tambah CSS variables untuk warna baru
- [x] Navbar → background #074DDB, text putih
- [x] Footer → background #074DDB
- [x] Landing page — stat section + testimonial section → #074DDB
- [x] Semua main button → #FF6647
- [x] Cards → glass effect 10% transparency
- [x] Status badges:
    - Menunggu → #4AC204
    - Selesai → #4AC204
    - Dibatalkan → #FF474A
