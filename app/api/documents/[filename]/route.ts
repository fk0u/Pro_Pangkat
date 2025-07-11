import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { promises as fs } from 'fs';
import { getSession } from '@/lib/auth';

/**
 * API Route for securely serving document files
 * This allows Next.js to properly serve files from outside the public directory
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Get the filename from route params
    const { filename } = params;
    
    // Basic security check - prevent path traversal attacks
    if (filename.includes('..')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }
    
    // Authenticate user (optional - remove if you want public access)
    const session = await getSession();
    if (!session.isLoggedIn) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Path to the uploads directory
    const uploadsDir = join(process.cwd(), 'uploads', 'documents');
    const filePath = join(uploadsDir, filename);
    
    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch (_error) {
      console.error(`File not found: ${filePath}`);
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Read the file
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    let contentType = 'application/octet-stream'; // default
    
    if (extension === 'pdf') {
      contentType = 'application/pdf';
    } else if (['jpg', 'jpeg'].includes(extension)) {
      contentType = 'image/jpeg';
    } else if (extension === 'png') {
      contentType = 'image/png';
    } else if (extension === 'gif') {
      contentType = 'image/gif';
    }
    
    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename=${filename}`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error serving document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
