import { list } from '@vercel/blob';
import { VercelRequest, VercelResponse } from '@vercel/node';

declare function fetch(input: string | URL, init?: RequestInit): Promise<Response>;

interface WaitlistEntry {
  fullName: string;
  email: string;
  company?: string;
  timestamp: string;
}

function escapeCsvField(field: string): string {
  if (!field) return '';
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function toCSV(entries: unknown[]): string {
  const headers = ['Full Name', 'Email', 'Company', 'Timestamp'];
  
  if (entries.length === 0) {
    return headers.join(',') + '\n';
  }
  
  const rows = entries.map((entry) => {
    const e = entry as WaitlistEntry;
    return [
      escapeCsvField(e.fullName || ''),
      escapeCsvField(e.email || ''),
      escapeCsvField(e.company || ''),
      escapeCsvField(e.timestamp || ''),
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Accept secret from either Authorization header or query parameter
  const authHeader = (req.headers.authorization || '') as string;
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  const querySecret = req.query.secret as string | undefined;
  
  const token = headerToken || querySecret;

  if (!process.env.EXPORT_SECRET) {
    return res.status(403).json({ error: 'Export disabled (no EXPORT_SECRET configured)' });
  }
  if (!token || token !== process.env.EXPORT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // List all blobs in the waitlist/ prefix
    const listRes = await list({ prefix: 'waitlist/' });
    const allBlobs = (listRes as unknown as { blobs?: Array<{ url?: string; pathname?: string }> })?.blobs ?? [];
    
    // Filter out index files (they contain email addresses in the filename)
    const blobs = allBlobs.filter(blob => {
      const pathname = blob.pathname || '';
      // Only include files that are hash filenames (64 hex chars), not email-based index files
      const filename = pathname.split('/').pop() || '';
      return /^[a-f0-9]{64}\.json$/.test(filename);
    });
    
    const entries: unknown[] = [];

    if (!blobs || blobs.length === 0) {
      const csv = toCSV([]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="waitlist.csv"');
      return res.status(200).send(csv);
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('Missing BLOB_READ_WRITE_TOKEN');
      return res.status(500).json({ error: 'Server misconfiguration: missing BLOB_READ_WRITE_TOKEN' });
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const validBlobs = blobs.filter((b): b is { url: string } => !!b.url);

    // Fetch blobs concurrently
    const concurrency = 10;
    const fetchBlob = async (blobItem: { url: string }) => {
      try {
        const response = await fetch(blobItem.url, {
          headers: {
            Authorization: `Bearer ${blobToken}`,
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          console.error('Non-OK response reading blob:', blobItem.url, response.status);
          return null;
        }
        const data = await response.json();
        return data as unknown;
      } catch (e) {
        console.error('Error reading blob:', blobItem.url, e);
        return null;
      }
    };

    for (let i = 0; i < validBlobs.length; i += concurrency) {
      const chunk = validBlobs.slice(i, i + concurrency);
      const results = await Promise.all(chunk.map(fetchBlob));
      for (const r of results) {
        if (r) entries.push(r);
      }
    }

    const csv = toCSV(entries);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="waitlist.csv"');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting waitlist:', error);
    res.status(500).json({ error: 'Failed to export waitlist' });
  }
}