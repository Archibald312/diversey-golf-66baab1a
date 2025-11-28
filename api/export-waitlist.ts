import { list } from '@vercel/blob';
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
    const { blobs } = await list({ prefix: 'waitlist/' });
    const entries: any[] = [];

    if (!blobs || blobs.length === 0) {
      // No entries, return empty CSV with headers
      const csv = 'fullName,email,company,timestamp';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="waitlist.csv"');
      return res.status(200).send(csv);
    }

    for (const blobItem of blobs) {
      try {
        // Fetch the blob content by URL
        const response = await fetch(blobItem.url);
        if (!response.ok) continue;
        const data = await response.json();
        entries.push(data);
      } catch (e) {
        console.error('Error reading blob:', blobItem.url, e);
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
    res.status(500).json({ error: 'Failed to export waitlist', details: String(error) });
  }
}
