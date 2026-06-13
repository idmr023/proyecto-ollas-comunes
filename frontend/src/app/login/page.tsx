"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowRight, Lock, Users, Shield, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setToken = useAuthStore((s) => s.setToken)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error("Completa todos los campos"); return }
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message ?? data.error ?? "Error al iniciar sesión"); return }

      if (data.status === "TOTP_SETUP_REQUIRED") {
        setToken(data.tempToken)
        router.push(`/login/otp?email=${encodeURIComponent(data.email)}&setup=1&secret=${encodeURIComponent(data.secret)}&qrCodeUri=${encodeURIComponent(data.qrCodeUri)}`)
      } else if (data.status === "MFA_PENDING") {
        setToken(data.tempToken)
        router.push(`/login/otp?email=${encodeURIComponent(data.email)}`)
      } else {
        setAuth(data.user, data.token)
        const destino = data.user?.role === "admin_municipal" ? "/workspace/home" : "/mobile/inicio"
        router.push(destino)
      }
    } catch {
      toast.error("Sin conexión al servidor")
    } finally {
      setLoading(false)
    }
  }, [email, password, router, setAuth, setToken])

  return (
    <div className="flex min-h-screen">
      {/* Columna Izquierda — Visual/Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#f5f0eb] p-12 lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4A950] text-sm font-bold text-white">
            OC
          </div>
          <span className="text-lg font-bold text-[#0F3821]">Ollas Comunes</span>
        </div>

        <div className="max-w-md">
          <h1 className="mb-4 text-4xl font-bold leading-tight text-[#0F3821]">
            Bienvenida a tu plataforma comunitaria
          </h1>
          <div className="space-y-4">
            {[
              { icon: Users, text: "Gestiona tus ollas comunes desde un solo lugar" },
              { icon: Shield, text: "Control de inventario y beneficiarios en tiempo real" },
              { icon: Sparkles, text: "Menús inteligentes para reducir el desperdicio" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F3821]/10">
                  <Icon className="h-4 w-4 text-[#0F3821]" />
                </div>
                <span className="text-[#0F3821]/80">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ilustración vectorial: 3 mujeres cocinando */}
        <div className="flex items-end justify-center">
          <svg viewBox="0 0 320 200" className="h-48 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="68" r="20" fill="#0F3821" opacity="0.15" />
            <rect x="62" y="85" width="36" height="50" rx="18" fill="#0F3821" opacity="0.12" />
            <rect x="56" y="110" width="48" height="8" rx="4" fill="#F4A950" />
            <circle cx="160" cy="58" r="22" fill="#0F3821" opacity="0.2" />
            <rect x="140" y="77" width="40" height="55" rx="20" fill="#0F3821" opacity="0.15" />
            <rect x="135" y="105" width="50" height="8" rx="4" fill="#F4A950" />
            <circle cx="160" cy="88" r="8" fill="#E8C39E" />
            <circle cx="240" cy="72" r="19" fill="#0F3821" opacity="0.15" />
            <rect x="223" y="89" width="34" height="48" rx="17" fill="#0F3821" opacity="0.12" />
            <rect x="218" y="112" width="44" height="8" rx="4" fill="#F4A950" />
            <ellipse cx="160" cy="130" rx="35" ry="12" fill="#0F3821" opacity="0.1" />
            <rect x="132" y="115" width="56" height="18" rx="6" fill="#0F3821" opacity="0.1" />
            <path d="M150 108 Q153 100 148 92" stroke="#0F3821" strokeWidth="2" opacity="0.15" strokeLinecap="round" />
            <path d="M160 106 Q163 96 158 88" stroke="#0F3821" strokeWidth="2" opacity="0.15" strokeLinecap="round" />
            <path d="M170 108 Q173 98 168 90" stroke="#0F3821" strokeWidth="2" opacity="0.15" strokeLinecap="round" />
            <circle cx="145" cy="122" r="4" fill="#E8C39E" />
            <circle cx="155" cy="124" r="3" fill="#8FBC8F" />
            <circle cx="165" cy="122" r="4" fill="#F4A950" />
            <circle cx="175" cy="124" r="3" fill="#8FBC8F" />
          </svg>
        </div>
      </div>

      {/* Columna Derecha — Formulario */}
      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0F3821]">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F3821]">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-gray-500">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Correo electrónico o DNI</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="login-email"
                  className="h-12 pl-10 text-base"
                  type="text"
                  placeholder="ej. lideresa@olla.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="login-password"
                  className="h-12 pl-10 pr-12 text-base"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPw((s) => !s)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button type="button" className="text-sm text-[#0F3821] underline" onClick={() => toast.info("Función próximamente")}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-lg bg-[#0F3821] text-base font-semibold text-white hover:bg-[#0F3821]/90"
            >
              {loading ? "Ingresando..." : "Ingresar"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
