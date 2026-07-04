import { PrismaClient } from '@prisma/client'
import { prisma } from './prisma'

type Factory<T> = (container: Container) => T

class Container {
  private factories = new Map<string, Factory<any>>()
  private instances = new Map<string, any>()

  register<T>(name: string, factory: Factory<T>): void {
    this.factories.set(name, factory)
    this.instances.delete(name)
  }

  get<T>(name: string): T {
    if (this.instances.has(name)) return this.instances.get(name) as T
    const factory = this.factories.get(name)
    if (!factory) throw new Error(`No factory registered for: ${name}`)
    const instance = factory(this)
    this.instances.set(name, instance)
    return instance as T
  }

  reset(): void {
    this.instances.clear()
  }
}

export const container = new Container()

container.register('prisma', () => prisma)
container.register('db', (c) => c.get<PrismaClient>('prisma'))
