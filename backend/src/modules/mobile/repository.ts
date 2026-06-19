import { prisma } from '../../lib/prisma'

export const mobileRepository = {
  async getUserOlla(_tenantId: string): Promise<{ id: string; name: string } | null> {
    return null
  },
}
