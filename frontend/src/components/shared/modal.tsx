"use client"

import { X } from "lucide-react"
import { useEffect } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative z-10 w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
