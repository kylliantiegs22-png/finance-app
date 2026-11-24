/** A repeating daily calendar reminder (.ics) built in the browser: the $0 reminder that always fires. */
export function buildIcs(opts: { cue: string; time: string; now: Date; url?: string }): string {
  const [hh, mm] = opts.time.split(':').map((v) => parseInt(v, 10));
  const d = opts.now;
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const stamp = d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const summary = esc(`After ${opts.cue.trim()}, I do my Tally lesson`);
  const end = new Date(2000, 0, 1, hh, mm + 10);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tally//Daily lesson//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:tally-daily-${date}@tally.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${date}T${pad(hh)}${pad(mm)}00`,
    `DTEND:${date}T${pad(end.getHours())}${pad(end.getMinutes())}00`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${summary}`,
    `DESCRIPTION:${esc('10 minutes to get better with money.' + (opts.url ? ' ' + opts.url : ''))}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${summary}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}
