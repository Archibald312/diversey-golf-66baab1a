import { put } from '@vercel/blob';
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

    // Create a new waitlist entry
    const entry: WaitlistEntry = {
      fullName,
      email,
      company: company || '',
      timestamp: new Date().toISOString(),
    };

    // Generate a unique filename using email and timestamp
    const filename = `waitlist/${email}-${Date.now()}.json`;

    // Save to Vercel Blob - the blob store is configured via BLOB_READ_WRITE_TOKEN environment variable
    // which should be set to your waitlist-storage blob store token
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
