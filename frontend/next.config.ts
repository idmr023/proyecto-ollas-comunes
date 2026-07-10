import type { NextConfig } from "next";
import os from "os";

// Obtenemos dinámicamente las IPs asignadas a la máquina en la red local.
const getNetworkIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = ['localhost'];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      // Tomamos solo las IPs IPv4 que no sean internas (es decir, omitimos 127.0.0.1 que ya está cubierta)
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
};

const nextConfig: NextConfig = {
  // Con esto, Next.js autorizará de forma automática cualquier IP por la cual se intente
  // acceder a esta máquina desde la red local (para móviles, laptops, etc.).
  allowedDevOrigins: getNetworkIPs(),
  // Export estático para Cloudflare Pages: `next build` produce `out/` con HTML/CSS/JS
  // servibles directamente. Requiere que no haya getServerSideProps, API routes ni middleware
  // server-side (verificado: este proyecto no los usa).
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // NOTA: con output: 'export', los redirects deben ir en frontend/public/_redirects
  // (convención de Cloudflare Pages), no aquí.
};

export default nextConfig;
