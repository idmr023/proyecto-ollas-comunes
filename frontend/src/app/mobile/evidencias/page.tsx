"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, FileText, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useApi } from "@/hooks/use-api"

export default function EvidenciasPage() {
  const router = useRouter()
  const { request } = useApi()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [documentType, setDocumentType] = useState("evidence")
  
  const [fileName, setFileName] = useState("")
  const [fileType, setFileType] = useState("")
  const [base64Data, setBase64Data] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo excede el límite de 5MB")
      return
    }

    setFileName(file.name)
    setFileType(file.type)

    const reader = new FileReader()
    reader.onloadend = () => {
      setBase64Data(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("El título es obligatorio")
      return
    }
    if (!base64Data) {
      toast.error("Por favor selecciona o toma una foto")
      return
    }

    setLoading(true)
    try {
      await request("/api/mobile/documents/upload", {
        method: "POST",
        body: JSON.stringify({
          fileName,
          fileType,
          documentType,
          title: title.trim(),
          description: description.trim() || undefined,
          base64Data,
        }),
      })

      toast.success("Evidencia subida correctamente")
      // Reset form
      setTitle("")
      setDescription("")
      setFileName("")
      setFileType("")
      setBase64Data("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir evidencia")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg p-1 hover:bg-muted"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Cargar Evidencia</h1>
          <p className="text-sm text-muted-foreground">Documenta compras, entregas o actas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        {/* Tipo de Documento */}
        <div className="space-y-1.5">
          <Label htmlFor="documentType">Tipo de Documento</Label>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="evidence">Acta de entrega / Recepción</option>
            <option value="report">Boleta de compra / Factura</option>
            <option value="photo">Foto de preparación / Olla</option>
            <option value="other">Otros documentos</option>
          </select>
        </div>

        {/* Título */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Título descriptivo *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Acta de víveres municipal 10 Jun"
            className="h-12 text-base rounded-xl"
            required
          />
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Detalle o Comentarios (Opcional)</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Añade algún detalle extra sobre esta entrega o compra..."
            className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        {/* Captura / Archivo */}
        <div className="space-y-2">
          <Label>Foto o Archivo</Label>
          
          {base64Data ? (
            <div className="relative rounded-2xl border border-border bg-muted/20 p-2 text-center">
              {fileType.startsWith("image/") ? (
                <img
                  src={base64Data}
                  alt="Vista previa"
                  className="mx-auto max-h-48 rounded-xl object-contain shadow-sm"
                />
              ) : (
                <div className="flex flex-col items-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <span className="mt-2 text-sm text-foreground font-medium">{fileName}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setFileName("")
                  setFileType("")
                  setBase64Data("")
                }}
                className="mt-3 text-xs text-destructive font-semibold hover:underline"
              >
                Eliminar y elegir otra
              </button>
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 py-10 px-4 text-center hover:bg-muted/20 transition duration-200">
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-foreground font-semibold">Toma una foto o sube un archivo</p>
              <p className="text-xs text-muted-foreground mt-1">Imágenes o documentos hasta 5MB</p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="h-12 w-full bg-primary text-primary-foreground text-base font-bold rounded-xl"
          disabled={loading}
        >
          {loading ? "Subiendo Evidencia..." : "Subir Evidencia"}
        </Button>
      </form>
    </div>
  )
}
