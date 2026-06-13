"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ShieldCheck, Loader2, ArrowLeft, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) { toast.error("Ingresa el código de 6 dígitos"); return }
    setLoading(true)
    try {
      const tempToken = useAuthStore.getState().token
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, tempToken }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message ?? "Código inválido o expirado"); return }
      setAuth(data.user, data.token)
      toast.success("Sesión iniciada correctamente")
      const destino = data.user?.role === "admin_municipal" ? "/workspace/home" : "/mobile/inicio"
      router.push(destino)
    } catch {
      toast.error("Sin conexión al servidor")
    } finally {
      setLoading(false)
    }
  }, [code, email, router, setAuth])

  const digits = code.split("").concat(Array(6 - code.length).fill(""))

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
            {isSetup ? "Configurar autenticación" : "Verificación en dos pasos"}
          </h1>
          {isSetup ? (
            <>
              <p className="mt-1 text-sm text-gray-500">
                Escanea el código QR con tu aplicación de autenticación
              </p>
              <p className="mt-1 text-xs text-gray-400">(Google Authenticator, Authy, 1Password, etc.)</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              Ingresa el código de 6 dígitos de tu aplicación de autenticación
            </p>
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
                ¿No puedes escanear? Código manual
              </summary>
              <p className="mt-2 break-all rounded bg-gray-50 p-2 font-mono text-xs text-gray-600 select-all">
                {secret}
              </p>
            </details>
          </div>
        )}

        {!isSetup && (
          <>
            <div className="relative mb-6">
              <div className="flex justify-center gap-2" onClick={() => inputRef.current?.focus()}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`flex h-14 w-11 items-center justify-center rounded-lg border-2 text-2xl font-bold transition ${
                      i === code.length
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
                onChange={(e) => {
                  const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setCode(soloDigitos)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.length === 6) handleVerify()
                }}
              />
            </div>

            <Button
              type="submit"
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="h-12 w-full rounded-lg bg-[#0F3821] text-base font-semibold text-white hover:bg-[#0F3821]/90"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Verificar código
            </Button>
          </>
        )}

        {isSetup && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 mb-2">Después de escanear, ingresa el código de 6 dígitos</p>
            <div className="relative mb-4">
              <div className="flex justify-center gap-2" onClick={() => inputRef.current?.focus()}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`flex h-14 w-11 items-center justify-center rounded-lg border-2 text-2xl font-bold transition ${
                      i === code.length
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
                onChange={(e) => {
                  const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setCode(soloDigitos)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.length === 6) handleVerify()
                }}
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="h-12 w-full rounded-lg bg-[#0F3821] text-base font-semibold text-white hover:bg-[#0F3821]/90"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Confirmar y entrar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OtpVerification
