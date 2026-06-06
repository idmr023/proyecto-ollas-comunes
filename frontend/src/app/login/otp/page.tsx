"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import OtpVerification from "./otp-verification"

export default function OtpPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <OtpVerification />
    </Suspense>
  )
}
