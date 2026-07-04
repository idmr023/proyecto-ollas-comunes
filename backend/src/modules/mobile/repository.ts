import { PrismaRepository } from '../../lib/prisma-repository'
import { prisma } from '../../lib/prisma'

type DashboardOlla = { id: string; name: string; estimatedDailyCapacity: number | null } | null

type StockRow = {
  supplyItemId: string
  quantity: number
  supplyItem: { name: string; unit: string; category: { name: string } | null }
}

type MenuPlanRow = {
  id: string
  dishName: string
  plannedServings: number
  status: string
  createdAt: Date
  recipe: { name: string; estimatedServings: number } | null
} | null

type AlertRow = {
  id: string
  alertType: string
  severity: string
  message: string
  status: string
  detectedAt: Date
}

export class MobileRepository extends PrismaRepository<any> {
  protected delegate = prisma.ollaComun as any
  protected toRecord(row: any) { return row }

  async getUserOlla(tenantId: string): Promise<{ id: string; name: string } | null> {
    const olla = await prisma.ollaComun.findFirst({
      where: { tenantId, status: 'active' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    return olla || null
  }

  async getDashboardOlla(tenantId: string, ollaId: string): Promise<DashboardOlla> {
    return prisma.ollaComun.findFirst({
      where: { id: ollaId, tenantId },
      select: { id: true, name: true, estimatedDailyCapacity: true },
    })
  }

  async getStock(ollaId: string): Promise<StockRow[]> {
    return prisma.inventoryStock.findMany({
      where: { ollaId },
      include: {
        supplyItem: {
          select: { name: true, unit: true, category: { select: { name: true } } },
        },
      },
    }) as unknown as Promise<StockRow[]>
  }

  async getTodayMenuPlan(ollaId: string, today: Date): Promise<MenuPlanRow> {
    return prisma.menuPlan.findFirst({
      where: { ollaId, operationDate: today },
      include: { recipe: { select: { name: true, estimatedServings: true } } },
      orderBy: { createdAt: 'desc' },
    }) as Promise<MenuPlanRow>
  }

  async getTodayDeliveries(ollaId: string, today: Date): Promise<{ totalRations: number }[]> {
    return prisma.mealDelivery.findMany({
      where: { menuPlan: { ollaId, operationDate: today } },
      select: { totalRations: true },
    })
  }

  async getBeneficiaryCount(tenantId: string, ollaId: string): Promise<number> {
    return prisma.beneficiary.count({
      where: { ollaId, tenantId, status: 'active' },
    })
  }

  async getActiveAlerts(tenantId: string, ollaId: string): Promise<AlertRow[]> {
    return prisma.alert.findMany({
      where: { ollaId, tenantId, status: { in: ['open', 'in_progress'] } },
      orderBy: { detectedAt: 'desc' },
      take: 5,
    }) as Promise<AlertRow[]>
  }
}

export const mobileRepository = new MobileRepository()
