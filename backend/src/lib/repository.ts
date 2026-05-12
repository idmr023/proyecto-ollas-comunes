import { supabase, isSupabaseConfigured } from './supabase'

export interface Repository<T, ID> {
  findAll(): Promise<T[]>
  findById(id: ID): Promise<T | null>
  create(item: Partial<T>): Promise<T>
  update(id: ID, item: Partial<T>): Promise<T | null>
  delete(id: ID): Promise<boolean>
}

export class SupabaseError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'SupabaseError'
    this.statusCode = statusCode
  }
}

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new SupabaseError(500, 'Supabase no esta configurado.')
  }
  return supabase
}

type DatabaseRow = Record<string, unknown>

function safeCast(row: unknown): DatabaseRow {
  if (row === null || row === undefined) return {}
  if (typeof row !== 'object') return {}
  if (Array.isArray(row)) return {}
  return row as DatabaseRow
}

export abstract class SupabaseRepository<T, ID> implements Repository<T, ID> {
  protected abstract tableName: string
  protected abstract selectColumns: string
  protected abstract toDomain(row: DatabaseRow): T

  protected getClient() {
    return getClient()
  }

  async findAll(): Promise<T[]> {
    const client = this.getClient()
    const { data, error } = await client
      .from(this.tableName)
      .select(this.selectColumns)
      .order('name', { ascending: true })

    if (error) {
      console.error(`[${this.tableName}] findAll error:`, error)
      throw new SupabaseError(503, error.message)
    }

    return (data ?? []).map((row) => this.toDomain(safeCast(row)))
  }

  async findById(id: ID): Promise<T | null> {
    const client = this.getClient()
    const { data, error } = await client
      .from(this.tableName)
      .select(this.selectColumns)
      .eq('id', id as string | number)
      .maybeSingle()

    if (error) {
      console.error(`[${this.tableName}] findById error:`, error)
      throw new SupabaseError(503, error.message)
    }

    return data ? this.toDomain(safeCast(data)) : null
  }

  async create(item: Record<string, unknown>): Promise<T> {
    const client = this.getClient()
    const { data, error } = await client
      .from(this.tableName)
      .insert(item)
      .select(this.selectColumns)
      .single()

    if (error) {
      console.error(`[${this.tableName}] create error:`, error)
      throw new SupabaseError(503, error.message)
    }

    return this.toDomain(safeCast(data))
  }

  async update(id: ID, item: Record<string, unknown>): Promise<T | null> {
    const client = this.getClient()
    const { data, error } = await client
      .from(this.tableName)
      .update(item)
      .eq('id', id as string | number)
      .select(this.selectColumns)
      .maybeSingle()

    if (error) {
      console.error(`[${this.tableName}] update error:`, error)
      throw new SupabaseError(503, error.message)
    }

    return data ? this.toDomain(safeCast(data)) : null
  }

  async delete(id: ID): Promise<boolean> {
    const client = this.getClient()
    const { error } = await client
      .from(this.tableName)
      .delete()
      .eq('id', id as string | number)

    if (error) {
      console.error(`[${this.tableName}] delete error:`, error)
      throw new SupabaseError(503, error.message)
    }

    return true
  }

  protected async findOneBy(column: string, value: unknown): Promise<T | null> {
    const client = this.getClient()
    const { data, error } = await client
      .from(this.tableName)
      .select(this.selectColumns)
      .eq(column, value)
      .maybeSingle()

    if (error) {
      console.error(`[${this.tableName}] findOneBy error:`, error)
      throw new SupabaseError(503, error.message)
    }

    return data ? this.toDomain(safeCast(data)) : null
  }
}
