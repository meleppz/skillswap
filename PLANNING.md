# SkillSwap — Payment (Request) & Color Refactor Plan

## Payment Flow — Requests
Berbeda dari service, di request flow:
- Provider yang "ambil" request
- Requester yang bayar ke sistem (saldo ditahan)
- Saldo dikirim ke provider setelah keduanya konfirmasi selesai

### Step by step:
1. Provider klik "Hubungi Requester" di card request
2. Muncul confirmation dialog "Ya, Kerjakan" → request status: `ongoing`, provider_id terisi
3. Notif dikirim ke requester: "Ada provider yang mau ngerjain requestmu!"
4. Di dashboard requester muncul tombol "Bayar Sekarang" → redirect ke /payment/request/[requestId]
5. Requester konfirmasi bayar → saldo berkurang, request.payment_status = 'paid'
6. Notif ke provider: "Requester sudah bayar, kamu bisa mulai kerjain!"
7. Provider klik "Tandai Selesai" → request status: 'need_review'
8. Requester konfirmasi selesai → saldo dikirim ke provider, payment_status = 'settled'

## Payment Amount
- Nominal yang dibayar = price_min dari request (hardcoded untuk MVP)

### Refund Logic (Request):
- Status `paid` tapi provider belum mulai → requester cancel → refund 100% instan
- Status `ongoing` → salah satu pihak ajukan refund → pihak lawan harus approve

## New Pages/Components Needed
- /payment/request/[requestId] — halaman konfirmasi pembayaran request
- components/modals/payment-request-modal.tsx — konfirmasi bayar untuk request

## Files to Modify
- app/requests/page.tsx — update confirmation dialog "Ya, Kerjakan"
- app/dashboard/requester/page.tsx — tambah tombol "Bayar Sekarang" untuk request ongoing
- app/dashboard/provider/page.tsx — block "Tandai Selesai" sampai payment_status = 'paid'
- lib/notifications.ts — tambah notif payment request

## Color System
### New Palette:
- Main button: #FF6647
- Navbar, footer, stat + testimonial sections (landing), heading text: #074DDB (white text inside)
- Cards: 10% transparency + backdrop blur (glass effect)
- Status — Menunggu: #4AC204
- Status — Selesai: #4AC204
- Status — Dibatalkan oleh provider/requester: #FF474A

### Files to Update:
- app/globals.css
- components/navbar.tsx
- app/page.tsx (landing)
- app/services/page.tsx
- app/requests/page.tsx
- app/dashboard/provider/page.tsx
- app/dashboard/requester/page.tsx
- components/modals/*.tsx
- All pages with buttons/cards/status badges