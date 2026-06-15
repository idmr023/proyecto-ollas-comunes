/**
 * Utility functions for handling date and time zones in the backend,
 * specifically centering operations around Peru timezone (America/Lima / GMT-5).
 */

export function getPeruDayRange(): { start: Date; end: Date; dateString: string } {
  const options = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(new Date());
  
  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value) - 1; // 0-indexed month
  const day = Number(parts.find(p => p.type === 'day')?.value);
  
  // Peru local 00:00:00 corresponds to UTC 05:00:00 of the same calendar day.
  const start = new Date(Date.UTC(year, month, day, 5, 0, 0, 0));
  
  // Peru local 24:00:00 (end of day) corresponds to UTC 05:00:00 of the next calendar day.
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  
  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  return { start, end, dateString };
}
