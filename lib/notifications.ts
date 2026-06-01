import { createClient } from '@/lib/supabase'

type NotificationType =
  | 'new_order'
  | 'order_cancelled_by_client'
  | 'order_cancelled_by_provider'
  | 'order_done_by_provider'
  | 'order_confirmed_by_client'
  | 'new_rating'
  | 'request_taken'
  | 'request_done_by_provider'
  | 'request_cancelled_by_provider'
  | 'request_cancelled_by_requester'
  | 'request_confirmed_by_requester'

type SendNotificationParams = {
  userId: string
  type: NotificationType
  title: string
  message: string
}

export async function sendNotification({
  userId,
  type,
  title,
  message,
}: SendNotificationParams) {
  const supabase = createClient()
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
  })
  if (error) console.error('Failed to send notification:', error)
}

// Helper functions per aksi — tinggal panggil ini di mana aja

export async function notifyNewOrder(providerId: string, clientName: string, serviceTitle: string) {
  await sendNotification({
    userId: providerId,
    type: 'new_order',
    title: 'Ada Pesanan Masuk!',
    message: `${clientName} memesan "${serviceTitle}"`,
  })
}

export async function notifyOrderCancelledByClient(providerId: string, clientName: string, serviceTitle: string) {
  await sendNotification({
    userId: providerId,
    type: 'order_cancelled_by_client',
    title: 'Pesanan Dibatalkan',
    message: `${clientName} membatalkan pesanan "${serviceTitle}"`,
  })
}

export async function notifyOrderCancelledByProvider(clientId: string, providerName: string, serviceTitle: string) {
  await sendNotification({
    userId: clientId,
    type: 'order_cancelled_by_provider',
    title: 'Pesanan Dibatalkan oleh Provider',
    message: `${providerName} membatalkan pesanan "${serviceTitle}"`,
  })
}

export async function notifyOrderDoneByProvider(clientId: string, serviceTitle: string) {
  await sendNotification({
    userId: clientId,
    type: 'order_done_by_provider',
    title: 'Pesanan Selesai!',
    message: `Pesananmu "${serviceTitle}" ditandai selesai oleh provider. Konfirmasi sekarang!`,
  })
}

export async function notifyOrderConfirmedByClient(providerId: string, clientName: string, serviceTitle: string) {
  await sendNotification({
    userId: providerId,
    type: 'order_confirmed_by_client',
    title: 'Pesanan Dikonfirmasi Selesai',
    message: `${clientName} mengkonfirmasi pesanan "${serviceTitle}" selesai`,
  })
}

export async function notifyNewRating(providerId: string, clientName: string, serviceTitle: string, rating: number) {
  await sendNotification({
    userId: providerId,
    type: 'new_rating',
    title: 'Rekanmu Memberi Rating',
    message: `${clientName} memberi rating ${rating} bintang pada "${serviceTitle}"`,
  })
}

export async function notifyRequestTaken(requesterId: string, providerName: string, requestTitle: string) {
  await sendNotification({
    userId: requesterId,
    type: 'request_taken',
    title: 'Requestmu Diambil!',
    message: `${providerName} mengambil requestmu "${requestTitle}"`,
  })
}

export async function notifyRequestDoneByProvider(requesterId: string, requestTitle: string) {
  await sendNotification({
    userId: requesterId,
    type: 'request_done_by_provider',
    title: 'Request Selesai!',
    message: `Requestmu "${requestTitle}" ditandai selesai oleh provider. Konfirmasi sekarang!`,
  })
}

export async function notifyRequestCancelledByProvider(requesterId: string, providerName: string, requestTitle: string) {
  await sendNotification({
    userId: requesterId,
    type: 'request_cancelled_by_provider',
    title: 'Request Dibatalkan oleh Provider',
    message: `${providerName} membatalkan pengerjaan requestmu "${requestTitle}"`,
  })
}

export async function notifyRequestCancelledByRequester(providerId: string, requesterName: string, requestTitle: string) {
  await sendNotification({
    userId: providerId,
    type: 'request_cancelled_by_requester',
    title: 'Request Dibatalkan',
    message: `${requesterName} membatalkan request "${requestTitle}"`,
  })
}

export async function notifyRequestConfirmedByRequester(providerId: string, requesterName: string, requestTitle: string) {
  await sendNotification({
    userId: providerId,
    type: 'request_confirmed_by_requester',
    title: 'Request Dikonfirmasi Selesai',
    message: `${requesterName} mengkonfirmasi request "${requestTitle}" selesai`,
  })
}