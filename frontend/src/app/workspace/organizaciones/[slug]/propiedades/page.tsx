import OrganizationPropertiesClientPage from './client-page'

// Con output: 'export' de Next.js, las rutas dinamicas requieren generateStaticParams.
// Devolvemos un placeholder para que se genere el HTML del shell; el cliente lee el slug
// real de la URL con useParams() y la navegación entre slugs la maneja el router del cliente.
// Cloudflare Pages sirve este HTML para cualquier slug (vía _redirects wildcard).
export function generateStaticParams() {
  return [{ slug: '_' }]
}

export default function OrganizationPropertiesPage() {
  return <OrganizationPropertiesClientPage />
}
