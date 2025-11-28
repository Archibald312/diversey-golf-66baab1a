import { put, list } from '@vercel/blob';
import { VercelRequest, VercelResponse } from '@vercel/node';
import * as crypto from 'crypto';

interface WaitlistEntry {
  fullName: string;
  email: string;
  company?: string;
  timestamp: string;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // CORS: only allow configured origins
  const allowed = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const origin = request.headers.origin as string | undefined;
  if (origin && allowed.includes(origin)) {
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
  }

  // Handle preflight
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fullName, email, company } = request.body;

    // Simple rate limiting (in-memory, best-effort for serverless)
    const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || request.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60_000; // 1 minute
    const maxRequests = 10;
    // @ts-ignore - attach a simple map to globalThis for persistence during cold-start
    if (!(globalThis as any).__rateLimitMap) (globalThis as any).__rateLimitMap = new Map();
    const rateMap: Map<string, number[]> = (globalThis as any).__rateLimitMap;
    const calls = rateMap.get(ip) || [];
    // prune
    const recent = calls.filter(t => now - t < windowMs);
    recent.push(now);
    rateMap.set(ip, recent);
    if (recent.length > maxRequests) {
      return response.status(429).json({ error: 'Too many requests' });
    }

    // Basic validation helpers
    const isValidEmail = (e: any) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    if (!isValidEmail(email) || typeof fullName !== 'string') {
      return response.status(400).json({ error: 'Invalid input' });
    }

    // Validate required fields
    if (!fullName || !email) {
      return response.status(400).json({
        error: 'Full name and email are required',
      });
    }

    // Prevent duplicate email entries using a small index marker
    const encodedEmail = encodeURIComponent(email.toLowerCase());
    const indexPrefix = `waitlist-index/${encodedEmail}`;
    const existingIndex = await list({ prefix: indexPrefix });
    if (existingIndex.blobs && existingIndex.blobs.length > 0) {
      return response.status(409).json({ error: 'This email is already on the waitlist.' });
    }

    // Create a new waitlist entry
    const entry: WaitlistEntry = {
      fullName,
      email,
      company: company || '',
      timestamp: new Date().toISOString(),
    };

    // Generate a unique filename using a hash (don't embed raw PII in object names)
    const hash = crypto.createHash('sha256').update(email + '|' + Date.now().toString()).digest('hex');
    const filename = `waitlist/${hash}.json`;

    // Save to Vercel Blob (private by default)
    // Use any-typed options to avoid type mismatch with SDK typings
    const putOpts: any = { access: 'private', contentType: 'application/json' };
    const blob = await put(filename, JSON.stringify(entry, null, 2), putOpts);

    // Create an index marker so we can quickly check duplicates by email
    const indexPutOpts: any = { access: 'private', contentType: 'application/json' };
    await put(`${indexPrefix}.json`, JSON.stringify({ filename, timestamp: entry.timestamp }), indexPutOpts);

    console.log('Waitlist entry saved:', filename);

    return response.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist',
      data: {
        // blob.url may be signed or inaccessible if private; include internal pathname
        filename: blob.pathname,
      },
    });
  } catch (error) {
    console.error('Error saving to Vercel Blob:', error);
    return response.status(500).json({
      error: 'Failed to save waitlist entry. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
