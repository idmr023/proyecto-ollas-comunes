import { prisma } from './prisma'
import { PrismaClient } from '@prisma/client'

type PrismaDelegate = {
  findMany: (args: any) => Promise<any[]>
  findUnique: (args: any) => Promise<any>
  findFirst: (args: any) => Promise<any>
  create: (args: any) => Promise<any>
  update: (args: any) => Promise<any>
  delete: (args: any) => Promise<any>
  deleteMany: (args: any) => Promise<any>
  count: (args: any) => Promise<number>
  [key: string]: any
}

export abstract class PrismaRepository<TRecord, TPayload = Record<string, unknown>> {
  protected prisma = prisma as PrismaClient

  protected abstract delegate: PrismaDelegate
  protected abstract toRecord(row: any): TRecord

  async findAll(where?: Record<string, unknown>): Promise<TRecord[]> {
    const rows = await this.delegate.findMany({ where, orderBy: { createdAt: 'desc' as const } })
    return rows.map((r: any) => this.toRecord(r))
  }

  async findById(id: string): Promise<TRecord | null> {
    const row = await this.delegate.findUnique({ where: { id } })
    return row ? this.toRecord(row) : null
  }

  async findFirst(where: Record<string, unknown>): Promise<TRecord | null> {
    const row = await this.delegate.findFirst({ where })
    return row ? this.toRecord(row) : null
  }

  async create(data: Record<string, unknown>): Promise<TRecord> {
    const row = await this.delegate.create({ data })
    return this.toRecord(row)
  }

  async update(id: string, data: Record<string, unknown>): Promise<TRecord | null> {
    const row = await this.delegate.update({ where: { id }, data })
    return row ? this.toRecord(row) : null
  }

  async delete(id: string, where?: Record<string, unknown>): Promise<boolean> {
    if (where) {
      await this.delegate.deleteMany({ where: { id, ...where } })
    } else {
      await this.delegate.delete({ where: { id } })
    }
    return true
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.delegate.count({ where })
  }
}
