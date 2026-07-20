"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ShieldCheck, Loader2, ArrowLeft, Smartphone, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { verifyOtpRequest } from "@/lib/auth-api"
import { toast } from "sonner"

function OtpVerification() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const isSetup = searchParams.get("setup") === "1"
  const secret = searchParams.get("secret") ?? ""
  const qrCodeUri = searchParams.get("qrCodeUri") ?? ""
  const setAuth = useAuthStore((s) => s.setAuth)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) { toast.error("Ingresa el código de 6 dígitos"); return }
    setLoading(true)
    try {
      const tempToken = useAuthStore.getState().tempToken
      if (!tempToken) {
        toast.error("La sesión de verificación expiró. Inicia sesión de nuevo.")
        router.replace("/login")
        return
      }

      const res = await verifyOtpRequest({ email, code, tempToken })
      if (!res.ok || !res.user) { toast.error(res.message ?? "Código inválido o expirado"); return }

      // El backend ya emitió la cookie httpOnly en esta respuesta; el token del
      // cuerpo se ignora a propósito para no dejarlo al alcance de un XSS.
      setAuth(res.user)
      toast.success("Sesión iniciada correctamente")
      const destino = res.user?.role === "admin_municipal" ? "/workspace/home" : "/mobile/inicio"
      router.push(destino)
    } catch {
      toast.error("Sin conexión al servidor")
    } finally {
      setLoading(false)
    }
  }, [code, email, router, setAuth])

  const handleCopySecret = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      toast.success("Código secreto copiado")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar")
    }
  }, [secret])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      const digits = text.replace(/\D/g, "").slice(0, 6)
      if (digits) {
        setCode(digits)
      }
    } catch {
      // clipboard permission may not be granted
    }
  }, [])

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 6)
    setCode(soloDigitos)
  }, [])

  const handleFocus = useCallback(() => setFocused(true), [])
  const handleBlur = useCallback(() => setFocused(false), [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && code.length === 6) {
      handleVerify()
    }
  }, [code, handleVerify])

  const digits = code.split("").concat(new Array(6 - code.length).fill(""))

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#f5f0eb] to-white px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <button type="button" className="mb-4 text-gray-500 hover:text-gray-700" onClick={() => router.push("/login")}>
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0F3821]">
            {isSetup ? <Smartphone className="h-7 w-7 text-white" /> : <ShieldCheck className="h-7 w-7 text-white" />}
          </div>
          <h1 className="text-xl font-bold text-[#0F3821]">
            {isSetup ? "Configurar autenticación" : "Bienvenido de vuelta"}
          </h1>

          {isSetup ? (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-500">
                Abre tu app de autenticación (Google Authenticator, Authy) y escanea el código QR
              </p>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0F3821] text-[10px] text-white font-bold">1</span>
                <span>Escanea el QR</span>
                <span className="mx-1">→</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0F3821] text-[10px] text-white font-bold">2</span>
                <span>Ingresa el código de 6 dígitos</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-500">
                Ingresa el código de 6 dígitos de tu app de autenticación
              </p>
              <button
                type="button"
                className="text-xs text-gray-400 underline hover:text-gray-600"
                onClick={handlePaste}
              >
                Pegar código
              </button>
            </div>
          )}
          <p className="mt-1 text-sm font-semibold text-[#0F3821]">{email || "tu correo"}</p>
        </div>

        {isSetup && qrCodeUri && (
          <div className="mb-6 flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUri)}`}
              alt="Código QR para autenticación"
              className="h-48 w-48 rounded-lg border"
            />
            <details className="w-full">
              <summary className="cursor-pointer text-center text-xs text-gray-400 hover:text-gray-600">
                ¿No puedes escanear? Ingresa el código manual
              </summary>
              <div className="mt-3 flex flex-col items-center gap-2">
                <p className="text-xs text-gray-500 text-center">
                  Copia este código secreto y pégalo en tu app de autenticación
                </p>
                <div className="flex w-full items-center gap-2 rounded-lg bg-gray-50 p-3">
                  <code className="flex-1 break-all text-center font-mono text-sm font-bold tracking-wider text-gray-700 select-all">
                    {secret}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopySecret}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </details>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="otp-code" className="mb-2 block text-center text-sm font-medium text-gray-700">
            Código de verificación
          </label>
          <div className="relative">
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`flex h-14 w-11 items-center justify-center rounded-lg border-2 text-2xl font-bold transition pointer-events-none ${
                    i === code.length && focused
                      ? "border-[#0F3821] ring-2 ring-[#0F3821]/30"
                      : digits[i]
                      ? "border-[#0F3821] bg-[#0F3821]/5 text-[#0F3821]"
                      : "border-gray-200 text-gray-400"
                  }`}
                >
                  {digits[i] || ""}
                </div>
              ))}
            </div>
            <input
              id="otp-code"
              ref={inputRef}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text")
                const digits = pasted.replace(/\D/g, "").slice(0, 6)
                if (digits) {
                  e.preventDefault()
                  setCode(digits)
                }
              }}
            />
          </div>
          <p className="mt-1 text-center text-xs text-gray-400">6 dígitos numéricos</p>
        </div>

        <Button
          type="submit"
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="h-12 w-full rounded-lg bg-[#0F3821] text-base font-semibold text-white hover:bg-[#0F3821]/90"
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          {isSetup ? "Confirmar y entrar" : "Verificar código"}
        </Button>
      </div>
    </div>
  )
}

export default OtpVerification
