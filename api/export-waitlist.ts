import { list } from '@vercel/blob';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { toCSV } from '../src/lib/csv';

// `fetch` is available in Vercel's runtime but may not be present in local
// TypeScript lib settings; declare it to avoid type errors during local
// typechecking/builds.
// Provide a minimal, well-typed `fetch` declaration that avoids `any`.
declare function fetch(input: unknown, init?: unknown): Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require Authorization header with a server-side secret.
  // Query-string based secrets are not accepted.
  const authHeader = (req.headers.authorization || '') as string;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

  if (!process.env.EXPORT_SECRET) {
    return res.status(403).json({ error: 'Export disabled (no EXPORT_SECRET configured)' });
  }
  if (!token || token !== process.env.EXPORT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // List all blobs in the waitlist/ prefix
    const listRes = await list({ prefix: 'waitlist/' });
    const blobs = (listRes as unknown as { blobs?: Array<{ url?: string }> })?.blobs ?? [];
    const entries: unknown[] = [];

    if (!blobs || blobs.length === 0) {
      // No entries, return CSV header only
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

    // Fetch blobs concurrently with a small concurrency limit to avoid overwhelming the runtime
    const concurrency = 10;
    const fetchBlob = async (blobItem: { url?: string }) => {
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

    for (let i = 0; i < blobs.length; i += concurrency) {
      const chunk = blobs.slice(i, i + concurrency);
      const results = await Promise.all(chunk.map(fetchBlob));
      for (const r of results) {
        if (r) entries.push(r);
      }
    }

    // Convert to CSV; if entries empty (all reads failed) we'll still emit a header
    const csv = toCSV(entries);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="waitlist.csv"');
    res.status(200).send(csv);
  } catch (error) {
    // Log details server-side but return a generic error to clients to avoid leaking internals
    console.error('Error exporting waitlist:', error);
    res.status(500).json({ error: 'Failed to export waitlist' });
  }
}
