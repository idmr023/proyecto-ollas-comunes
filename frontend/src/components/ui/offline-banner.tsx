"use client"

import useOnline from '@/hooks/use-online'

export default function OfflineBanner() {
  const online = useOnline()
  if (online) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#ffcc00', color: '#000', padding: '6px 12px', zIndex: 9999, textAlign: 'center' }}>
      Sin conexión — modo offline activado
    </div>
  )
}
