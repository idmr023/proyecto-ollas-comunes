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
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/workspace',
        destination: '/workspace/home',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
