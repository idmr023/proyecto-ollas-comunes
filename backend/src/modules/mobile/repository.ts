import { prisma } from '../../lib/prisma'

export const mobileRepository = {
  async getUserOlla(tenantId: string): Promise<{ id: string; name: string } | null> {
    const olla = await prisma.ollaComun.findFirst({
      where: { tenantId, status: 'active' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    return olla || null
  },
}
