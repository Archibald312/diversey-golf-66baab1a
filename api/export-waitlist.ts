import { list, get } from '@vercel/blob';
import { VercelRequest, VercelResponse } from '@vercel/node';

function toCSV(rows: any[]): string {
  if (!rows.length) return '';
  const header = Object.keys(rows[0]);
  const escape = (val: any) => `"${String(val).replace(/"/g, '""')}`;
  return [
    header.join(','),
    ...rows.map(row => header.map(field => escape(row[field] ?? '')).join(','))
  ].join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Optional: Add a simple secret for security
  const secret = req.query.secret;
  if (process.env.EXPORT_SECRET && secret !== process.env.EXPORT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // List all blobs in the waitlist/ prefix
    const blobs = await list({ prefix: 'waitlist/' });
    const entries: any[] = [];
    for (const blob of blobs.blobs) {
      const { blob: fileBlob } = await get(blob.url);
      if (!fileBlob) continue;
      const text = await fileBlob.text();
      try {
        const data = JSON.parse(text);
        entries.push(data);
      } catch (e) {
        // skip invalid JSON
        continue;
      }
    }
    // Convert to CSV
    const csv = toCSV(entries);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="waitlist.csv"');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting waitlist:', error);
    res.status(500).json({ error: 'Failed to export waitlist' });
  }
}
