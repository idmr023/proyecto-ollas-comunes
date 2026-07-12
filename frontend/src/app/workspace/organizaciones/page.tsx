"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Plus, Building2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { listOrganizations } from "@/lib/organizations-api"
import { formatOrganizationDate, type Organization } from "@/types/organization"

export default function OrganizacionesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const items = await listOrganizations()
        setOrganizations(items)
      } catch {
        // error handled by api lib
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-foreground">Organizaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las organizaciones y sus ollas comunes
          </p>
        </div>
        <Button asChild>
          <Link href="/workspace/organizaciones/nueva">
            <Plus className="mr-1 size-4" />
            Nueva organización
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Building2 className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No hay organizaciones registradas</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/workspace/organizaciones/nueva">
                Crear primera organización
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {organizations.map((org) => (
            <Link key={org.id} href={`/workspace/organizaciones/${org.slug}`}>
              <Card className="transition hover:border-primary/30 hover:shadow-md active:scale-[0.99]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 shrink-0 text-primary" />
                    {org.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {org.location}
                    </span>
                    <span>{org.category}</span>
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                        org.status === "Activa"
                          ? "bg-status-active/10 text-status-active"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {org.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{org.code}</span>
                    {org.createdAt && (
                      <>
                        <span>&middot;</span>
                        <span>Creado {formatOrganizationDate(org.createdAt)}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
