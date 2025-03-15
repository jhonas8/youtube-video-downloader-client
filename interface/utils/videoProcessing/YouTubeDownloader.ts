"use client";

import ytdl from 'ytdl-core';
import { VideoDownloader, VideoInfo, VideoFormat, VideoPreview } from './VideoDownloader';

/**
 * YouTube video downloader implementation using ytdl-core
 */
export class YouTubeDownloader extends VideoDownloader {
  /**
   * Validate if the URL is a valid YouTube URL
   * @param url The URL to validate
   * @returns True if the URL is a valid YouTube URL
   */
  validateURL(url: string): boolean {
    return ytdl.validateURL(url);
  }

  /**
   * Extract the video ID from the YouTube URL
   * @param url The YouTube URL
   * @returns The video ID or null if invalid
   */
  getVideoID(url: string): string | null {
    try {
      return ytdl.getURLVideoID(url);
    } catch (error) {
      console.error('Failed to extract YouTube video ID:', error);
      return null;
    }
  }

  /**
   * Get video information including available formats
   * @param url The YouTube URL
   * @returns Promise with video information
   */
  async getInfo(url: string): Promise<VideoInfo> {
    try {
      // Fetch video info using ytdl-core
      const info = await ytdl.getInfo(url);
      
      // Map ytdl-core formats to our VideoFormat interface
      const formats = info.formats.map((format) => ({
        quality: this.formatQualityLabel(format),
        format: format.mimeType?.split(';')[0] || 'unknown',
        container: format.container || 'mp4',
        hasAudio: !!format.hasAudio,
        hasVideo: !!format.hasVideo,
        size: format.contentLength ? parseInt(format.contentLength) : undefined,
        bitrate: format.bitrate,
        url: format.url  // Include direct URL for downloading
      }));

      return {
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url || '',
        formats,
        platform: 'youtube'
      };
    } catch (error) {
      console.error('Failed to get YouTube video info:', error);
      throw new Error('Failed to get video information');
    }
  }

  /**
   * Get basic preview information about the YouTube video
   * This is useful for displaying a preview before downloading
   * @param url The YouTube URL
   * @returns Promise with basic video preview information
   */
  async getPreviewInfo(url: string): Promise<VideoPreview> {
    try {
      // Use getBasicInfo to minimize data usage for preview
      const info = await ytdl.getBasicInfo(url);
      
      // Format duration from seconds to readable time
      let durationStr = '';
      if (info.videoDetails.lengthSeconds) {
        const duration = parseInt(info.videoDetails.lengthSeconds);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        if (hours > 0) {
          durationStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      }
      
      // Format view count with commas
      const views = info.videoDetails.viewCount ? 
        parseInt(info.videoDetails.viewCount).toLocaleString() : 
        'Unknown';

      return {
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url || '',
        duration: durationStr,
        author: info.videoDetails.author?.name || 'Unknown',
        views: `${views} views`,
        platform: 'youtube'
      };
    } catch (error) {
      console.error('Failed to get YouTube video preview:', error);
      throw new Error('Failed to get video preview information');
    }
  }

  /**
   * Format the quality label to a user-friendly format
   * @param format The ytdl-core format object
   * @returns A user-friendly quality label
   */
  private formatQualityLabel(format: ytdl.videoFormat): string {
    if (format.qualityLabel) {
      return format.qualityLabel;
    }
    
    if (format.hasAudio && !format.hasVideo) {
      return `Audio ${format.audioBitrate}kbps`;
    }
    
    return format.quality.toString() || 'unknown';
  }

  /**
   * Choose the best format based on the requested quality
   * @param info Video information
   * @param quality Requested quality (e.g., "1080p", "720p", "audio")
   * @returns The chosen format
   */
  chooseFormat(info: VideoInfo, quality: string): VideoFormat {
    // Filter formats based on quality
    const matchingFormats = info.formats.filter(format => {
      // For audio-only requests
      if (quality === 'audio') {
        return format.hasAudio && !format.hasVideo;
      }
      
      // For specific video quality
      return format.quality.includes(quality);
    });
    
    // Sort by bitrate for better quality selection
    const sortedFormats = matchingFormats.sort((a, b) => {
      return (b.bitrate || 0) - (a.bitrate || 0);
    });
    
    // Return the highest quality format matching the criteria, or the first format if none match
    return sortedFormats[0] || info.formats[0];
  }

  /**
   * Create a download stream for the YouTube video
   * @param url The YouTube URL
   * @param format The chosen format
   * @returns A ReadableStream for the video
   */
  createDownloadStream(url: string, format: VideoFormat): ReadableStream {
    try {
      // If format already has a direct URL, use it
      if (format.url) {
        // Return a new ReadableStream that fetches the content
        return new ReadableStream({
          async start(controller) {
            try {
              const response = await fetch(format.url!);
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              if (!response.body) {
                throw new Error('Response body is null');
              }
              
              const reader = response.body.getReader();
              
              // Read the stream
              while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                  controller.close();
                  break;
                }
                
                controller.enqueue(value);
              }
            } catch (error) {
              console.error('Error in fetch stream:', error);
              controller.error(error);
            }
          }
        });
      }
      
      // Otherwise, set up ytdl options based on the format
      const ytdlOptions: ytdl.downloadOptions = {
        quality: format.quality,
        filter: (f) => {
          const hasMatchingFormat = f.mimeType?.includes(format.format) || false;
          const hasMatchingContainer = f.container === format.container;
          
          const audioMatch = format.hasAudio ? f.hasAudio : true;
          const videoMatch = format.hasVideo ? f.hasVideo : true;
          
          return hasMatchingFormat && hasMatchingContainer && audioMatch && videoMatch;
        }
      };

      // Create ytdl stream
      const ytdlStream = ytdl(url, ytdlOptions);
      
      // Convert Node.js stream to Web ReadableStream
      return new ReadableStream({
        start(controller) {
          ytdlStream.on('data', (chunk) => {
            controller.enqueue(chunk);
          });
          
          ytdlStream.on('end', () => {
            controller.close();
          });
          
          ytdlStream.on('error', (error) => {
            console.error('Error in ytdl stream:', error);
            controller.error(error);
          });
        },
        cancel() {
          ytdlStream.destroy();
        }
      });
    } catch (error) {
      console.error('Failed to create download stream:', error);
      throw new Error('Failed to create download stream');
    }
  }

  /**
   * Download the YouTube video and save it to the user's device
   * @param url The YouTube URL
   * @param format The chosen format
   * @param filename Optional filename (without extension)
   */
  async downloadVideo(url: string, format: VideoFormat, filename?: string): Promise<void> {
    try {
      // Get video info to get title if filename is not provided
      const info = filename ? null : await ytdl.getBasicInfo(url);
      
      // Determine the filename
      const videoFilename = filename || this.sanitizeFilename(info?.videoDetails.title || 'youtube-video');
      const extension = format.container;
      const fullFilename = `${videoFilename}.${extension}`;
      
      // Use direct URL if available
      if (format.url) {
        const downloadUrl = format.url;
        
        // Create and click a download link
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fullFilename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
        }, 100);
        
        return;
      }
      
      // Otherwise create download stream
      const stream = this.createDownloadStream(url, format);
      
      // Create a download link
      const response = new Response(stream);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      // Create and click a download link
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fullFilename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }, 100);
    } catch (error) {
      console.error('Failed to download video:', error);
      throw new Error('Failed to download video');
    }
  }
  
  /**
   * Sanitize a filename to be safe for saving
   * @param filename The raw filename
   * @returns A sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[\\/:*?"<>|]/g, '_') // Replace invalid characters
      .trim()
      .substring(0, 200); // Limit length
  }
} 