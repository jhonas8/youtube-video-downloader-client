import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

/**
 * API route for fetching YouTube video information
 * 
 * @param request Next.js request object
 * @returns JSON response with video info or error
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: 'Missing URL parameter' },
      { status: 400 }
    );
  }

  try {
    // Validate the URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Get basic video info
    const info = await ytdl.getBasicInfo(url);
    
    // Extract relevant information
    const videoDetails = info.videoDetails;
    
    // Filter out very low quality options and format them with more details
    const formats = info.formats
      .filter(format => {
        // Filter out 'tiny' and very low-quality formats
        return format.quality !== 'tiny' && 
               format.quality !== 'audio_quality_ultralow' &&
               !format.qualityLabel?.includes('144p'); // Filter out 144p which is generally too low quality
      })
      .map(format => ({
        quality: formatQualityLabel(format),
        format: format.mimeType?.split(';')[0] || 'unknown',
        codec: extractCodec(format.mimeType || ''),
        container: format.container || 'mp4',
        hasAudio: !!format.hasAudio,
        hasVideo: !!format.hasVideo,
        size: format.contentLength ? parseInt(format.contentLength) : undefined,
        bitrate: format.bitrate,
        itag: format.itag,
        fps: format.fps || undefined,
      }));

    // Format duration from seconds to readable time
    let durationStr = '';
    if (videoDetails.lengthSeconds) {
      const duration = parseInt(videoDetails.lengthSeconds);
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = duration % 60;
      
      if (hours > 0) {
        durationStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    // Format view count
    const views = videoDetails.viewCount ? 
      parseInt(videoDetails.viewCount).toLocaleString() : 
      'Unknown';

    return NextResponse.json({
      videoInfo: {
        title: videoDetails.title,
        thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url || '',
        formats,
        platform: 'youtube'
      },
      videoPreview: {
        title: videoDetails.title,
        thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url || '',
        duration: durationStr,
        author: videoDetails.author?.name || 'Unknown',
        views: `${views} views`,
        platform: 'youtube'
      }
    });
  } catch (error) {
    console.error('YouTube API error:', error);
    
    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Video unavailable')) {
      return NextResponse.json(
        { error: 'Video unavailable - it may be private, deleted, or region-restricted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to get video information: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Format the quality label to a user-friendly format with more detailed information
 * @param format The ytdl-core format object
 * @returns A detailed user-friendly quality label
 */
function formatQualityLabel(format: ytdl.videoFormat): string {
  // Build a comprehensive label with relevant information
  let label = '';
  
  // Add video quality if available
  if (format.qualityLabel) {
    label = format.qualityLabel; // e.g. "1080p", "720p"
    
    // Add FPS for video formats (if not standard 30fps)
    if (format.fps && format.fps !== 30) {
      label += ` ${format.fps}fps`;
    }
  }
  
  // For audio-only formats
  if (format.hasAudio && !format.hasVideo) {
    label = `Audio ${format.audioBitrate}kbps`;
    
    // Add audio quality descriptor if available
    if (format.audioQuality) {
      const audioQuality = format.audioQuality.replace('AUDIO_QUALITY_', '');
      if (audioQuality === 'LOW') {
        label += ' (Low)';
      } else if (audioQuality === 'MEDIUM') {
        label += ' (Medium)';
      } else if (audioQuality === 'HIGH') {
        label += ' (High)';
      }
    }
  }
  
  // Add codec information if we have it
  const codec = extractCodec(format.mimeType || '');
  if (codec) {
    label += ` - ${codec}`;
  }
  
  // Add file size if available
  if (format.contentLength) {
    const sizeInMB = Math.round(parseInt(format.contentLength) / 1024 / 1024 * 10) / 10;
    label += ` (${sizeInMB}MB)`;
  }
  
  // Fallback if we couldn't generate a good label
  if (!label) {
    return format.quality.toString() || 'unknown';
  }
  
  return label;
}

/**
 * Extract codec information from mimeType
 * @param mimeType The format mimeType string
 * @returns The extracted codec
 */
function extractCodec(mimeType: string): string {
  // Try to extract codec from format like "video/mp4; codecs=\"avc1.42001E, mp4a.40.2\""
  const codecsMatch = mimeType.match(/codecs="([^"]+)"/);
  if (codecsMatch && codecsMatch[1]) {
    // Simplify codec names for user-friendliness
    const codecs = codecsMatch[1].split(', ').map(codec => {
      if (codec.startsWith('avc1')) return 'H.264';
      if (codec.startsWith('av01')) return 'AV1';
      if (codec.startsWith('vp9')) return 'VP9';
      if (codec.startsWith('mp4a')) return 'AAC';
      if (codec.startsWith('opus')) return 'Opus';
      return codec;
    });
    
    return codecs.join('/');
  }
  
  // Extract basic type (video/mp4, audio/webm, etc.)
  const basicType = mimeType.split(';')[0];
  if (basicType) {
    return basicType.split('/')[1]?.toUpperCase() || '';
  }
  
  return '';
} 