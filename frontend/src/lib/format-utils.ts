export function formatDateTime(iso: string, format: "full" | "date" | "time" = "full"): string {
  const d = new Date(iso)
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }
  if (format === "full" || format === "time") { opts.hour = "2-digit"; opts.minute = "2-digit" }
  if (format === "date") delete opts.hour; delete opts.minute
  return d.toLocaleString("es-PE", opts)
}

export function formatAge(birthDate: string): number {
  const b = new Date(birthDate)
  const t = new Date()
  let a = t.getFullYear() - b.getFullYear()
  const m = t.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--
  return a
}
