import { list } from '@vercel/blob';
import { VercelRequest, VercelResponse } from '@vercel/node';

function toCSV(rows: any[]): string {
  if (!rows.length) return '';
  const header = Object.keys(rows[0]);
  const escape = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
  return [
    header.join(','),
    ...rows.map(row => header.map(field => escape(row[field] ?? '')).join(','))
  ].join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require Authorization header with a server-side secret.
  // Query-string based secrets are not accepted.
  const auth = req.headers.authorization as string | undefined;
  if (!process.env.EXPORT_SECRET) {
    return res.status(403).json({ error: 'Export disabled (no EXPORT_SECRET configured)' });
  }
  if (!auth || auth !== `Bearer ${process.env.EXPORT_SECRET}`) {
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

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('Missing BLOB_READ_WRITE_TOKEN');
      return res.status(500).json({ error: 'Server misconfiguration: missing BLOB_READ_WRITE_TOKEN' });
    }

    for (const blobItem of blobs) {
      try {
        // Fetch the blob content by URL using server-side token
        const response = await fetch(blobItem.url, {
          headers: {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          console.error('Non-OK response reading blob:', blobItem.url, response.status);
          continue;
        }
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
