import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY
export const supabaseHealthcheckTable = process.env.SUPABASE_HEALTHCHECK_TABLE

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseSecretKey,
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseSecretKey!, {
      auth: {
        persistSession: false,
      },
    })
  : null

export const getSupabaseConfigStatus = () => ({
  isConfigured: isSupabaseConfigured,
  hasUrl: Boolean(supabaseUrl),
  hasSecretKey: Boolean(supabaseSecretKey),
  healthcheckTable: supabaseHealthcheckTable || null,
})
