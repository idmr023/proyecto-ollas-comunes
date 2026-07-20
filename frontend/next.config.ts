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

const isProduction = process.env.NODE_ENV === 'production';

// Origen real del backend. Solo se usa como destino del rewrite: el navegador
// nunca lo contacta directamente.
const backendOrigin = (
  process.env.BACKEND_ORIGIN ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000'
).replace(/\/$/, '');

const nextConfig: NextConfig = {
  // Comodidad de desarrollo: enumerar las interfaces de red no aporta nada en
  // el build de producción, así que queda condicionado al entorno.
  ...(isProduction ? {} : { allowedDevOrigins: getNetworkIPs() }),

  /**
   * El backend se sirve bajo el mismo origen que la aplicación.
   *
   * Sin esto la cookie de sesión sería de terceros (el frontend vive en Vercel
   * y el backend en Render, que son sitios distintos): Safari la bloquearía por
   * defecto y `proxy.ts` no podría leerla, porque quedaría asociada al dominio
   * del backend y no al de la app. Con el rewrite, el `Set-Cookie` del backend
   * llega al navegador como cookie de origen propio.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
