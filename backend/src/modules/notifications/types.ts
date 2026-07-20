export interface BackupMutationInput {
  path: string
  method: string
  body?: unknown
  errorMessage?: string
  status?: number
  originalTimestamp: number
}

export interface ReportDataLossInput {
  pendingCount: number
  failedCount: number
  message: string
}
