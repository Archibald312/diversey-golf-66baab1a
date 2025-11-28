import { put, list } from '@vercel/blob';
import { VercelRequest, VercelResponse } from '@vercel/node';

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
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

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

    // Validate required fields
    if (!fullName || !email) {
      return response.status(400).json({
        error: 'Full name and email are required',
      });
    }

    // Prevent duplicate email entries
    const prefix = `waitlist/${email}`;
    const existing = await list({ prefix });
    if (existing.blobs && existing.blobs.length > 0) {
      return response.status(409).json({
        error: 'This email is already on the waitlist.',
      });
    }

    // Create a new waitlist entry
    const entry: WaitlistEntry = {
      fullName,
      email,
      company: company || '',
      timestamp: new Date().toISOString(),
    };

    // Generate a unique filename using email and timestamp
    const filename = `waitlist/${email}-${Date.now()}.json`;

    // Save to Vercel Blob
    const blob = await put(filename, JSON.stringify(entry, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });

    console.log('Waitlist entry saved:', filename);

    return response.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist',
      data: {
        url: blob.url,
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
