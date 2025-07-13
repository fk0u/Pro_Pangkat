import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { join } from "path";
import { existsSync } from "fs";
import { readFile, stat } from "fs/promises";

// Route handler untuk akses langsung ke file uploads
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const session = await getSession();
    
    // Hanya user yang sudah login yang bisa mengakses
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil path file dari parameter
    const filePath = params.path.join('/');
    
    // Bangun path lengkap ke file fisik
    const uploadsDir = join(process.cwd(), 'uploads');
    const fullFilePath = join(uploadsDir, filePath);
    
    console.log(`Direct file access: ${fullFilePath}`);
    
    // Periksa apakah file ada
    if (!existsSync(fullFilePath)) {
      console.error(`File not found: ${fullFilePath}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    // Dapatkan informasi file
    const fileStats = await stat(fullFilePath);
    const fileBuffer = await readFile(fullFilePath);
    
    // Tentukan content type berdasarkan ekstensi file
    const extension = fullFilePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (extension === 'pdf') {
      contentType = 'application/pdf';
    } else if (['jpg', 'jpeg'].includes(extension || '')) {
      contentType = 'image/jpeg';
    } else if (extension === 'png') {
      contentType = 'image/png';
    }
    
    // Return file dengan header yang tepat
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    });
    
  } catch (error) {
    console.error('Error accessing file:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
