"use client"

import { useEffect, useState } from 'react'

export function useOnline() {
  const isClient = typeof window !== 'undefined'
  const [online, setOnline] = useState<boolean>(isClient ? navigator.onLine : true)

  useEffect(() => {
    if (!isClient) return
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [isClient])

  return online
}

export default useOnline
