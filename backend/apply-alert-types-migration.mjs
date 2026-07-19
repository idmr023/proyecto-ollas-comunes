import 'dotenv/config'
import { Pool } from 'pg'

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await pool.query(`
    ALTER TABLE alerts
      DROP CONSTRAINT IF EXISTS alerts_alert_type_check
  `)
  console.log('OK: dropped old check constraint')

  await pool.query(`
    ALTER TABLE alerts
      ADD CONSTRAINT alerts_alert_type_check
      CHECK (alert_type IN (
        'low_stock',
        'unusual_consumption',
        'missing_daily_report',
        'high_priority_beneficiary',
        'new_beneficiary',
        'sync_conflict'
      ))
  `)
  console.log('OK: added new check constraint with 6 alert types')

  await pool.end()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
