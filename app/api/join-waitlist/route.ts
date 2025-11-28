import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface WaitlistEntry {
  fullName: string;
  email: string;
  company?: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, company } = body;

    // Validate required fields
    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
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
      access: 'private',
      contentType: 'application/json',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully joined the waitlist',
        data: {
          url: blob.url,
          filename: blob.pathname,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving to Vercel Blob:', error);
    return NextResponse.json(
      { error: 'Failed to save waitlist entry' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check if email is already on waitlist
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'Use POST to join the waitlist' },
    { status: 405 }
  );
}
