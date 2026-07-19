-- Agrega 'new_beneficiary' y 'sync_conflict' al CHECK constraint de alerts.alert_type
-- Producción solo tenía: low_stock, unusual_consumption, missing_daily_report, high_priority_beneficiary

ALTER TABLE alerts
  DROP CONSTRAINT IF EXISTS alerts_alert_type_check;

ALTER TABLE alerts
  ADD CONSTRAINT alerts_alert_type_check
  CHECK (alert_type IN (
    'low_stock',
    'unusual_consumption',
    'missing_daily_report',
    'high_priority_beneficiary',
    'new_beneficiary',
    'sync_conflict'
  ));
