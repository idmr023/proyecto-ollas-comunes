export const organizationCategoryOptions = [
  'Municipalidad',
  'Programa social',
] as const

export type OrganizationCategory = (typeof organizationCategoryOptions)[number]

export type OrganizationStatus = 'Activa' | 'Inactiva'

export interface Organization {
  id: string
  slug: string
  code: string
  name: string
  category: string
  location: string
  status: OrganizationStatus
  createdAt: string | null
}

export interface OrganizationFormValues {
  name: string
  category: OrganizationCategory
  location: string
}

export function formatOrganizationDate(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
