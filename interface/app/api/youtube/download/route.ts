import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import { PassThrough } from 'stream';

/**
 * API route for downloading YouTube videos
 * 
 * @param request Next.js request object
 * @returns Streamed video content or error JSON
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const itag = request.nextUrl.searchParams.get('itag');
  const filename = request.nextUrl.searchParams.get('filename');
  
  // Validate required parameters
  if (!url) {
    return NextResponse.json(
      { error: 'Missing URL parameter' },
      { status: 400 }
    );
  }

  if (!itag) {
    return NextResponse.json(
      { error: 'Missing itag parameter' },
      { status: 400 }
    );
  }

  try {
    // Validate URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Get video info first to determine filename and container
    const info = await ytdl.getBasicInfo(url);
    
    // Find the selected format by itag
    const selectedFormat = info.formats.find(format => 
      format.itag.toString() === itag
    );
    
    if (!selectedFormat) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404 }
      );
    }

    // Create download options with the selected format
    const downloadOptions = { 
      quality: selectedFormat.itag
    };

    // Create a readable stream for the video
    const videoStream = ytdl(url, downloadOptions);
    
    // Get video details for filename if not provided
    const sanitizedFilename = filename || sanitizeFilename(info.videoDetails.title);
    const container = selectedFormat.container || 'mp4';
    const fullFilename = `${sanitizedFilename}.${container}`;
    
    // Create a web-compatible stream
    // Converting Node.js readable stream to a Web-compatible ReadableStream
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();
    
    videoStream.on('data', (chunk) => {
      writer.write(new Uint8Array(chunk));
    });
    
    videoStream.on('end', () => {
      writer.close();
    });
    
    videoStream.on('error', (err) => {
      console.error('Stream error:', err);
      writer.abort(err);
    });
    
    // Create a Response object with the stream
    const response = new NextResponse(transformStream.readable);
    
    // Set appropriate headers
    response.headers.set('Content-Disposition', `attachment; filename="${fullFilename}"`);
    response.headers.set('Content-Type', selectedFormat.mimeType || 'application/octet-stream');
    
    if (selectedFormat.contentLength) {
      response.headers.set('Content-Length', selectedFormat.contentLength);
    }
    
    return response;
  } catch (error) {
    console.error('YouTube download error:', error);
    
    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to download video: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Sanitize a filename to be safe for saving
 * @param filename The raw filename
 * @returns A sanitized filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\\/:*?"<>|]/g, '_') // Replace invalid characters
    .trim()
    .substring(0, 200); // Limit length
} 