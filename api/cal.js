import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  const { games, cats } = req.query;
  const gameList = games ? games.split(',') : null;
  const catList  = cats  ? cats.split(',')  : null;

  let data;
  try {
    const filePath = join(process.cwd(), 'events.json');
    data = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    return res.status(500).send('読み込みエラー: ' + e.message);
  }

  const filtered = (data.events || []).filter(ev => {
    if (gameList && !gameList.some(g => (ev.game || '').includes(g))) return false;
    if (catList  && !catList.includes(ev.category)) return false;
    return true;
  });

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GameCal//JA',
    'X-WR-CALNAME:GameCal',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  filtered.forEach(ev => {
    const start = (ev.startDate || '').replace(/-/g, '');
    const end   = (ev.endDate   || ev.startDate || '').replace(/-/g, '');
    if (!start) return;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@gamecal`,
      `SUMMARY:【${ev.category}】${ev.title}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `DESCRIPTION:${(ev.description || '').replace(/\n/g, '\\n')}`,
      `URL:${ev.url || ''}`,
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.send(lines.join('\r\n'));
}
