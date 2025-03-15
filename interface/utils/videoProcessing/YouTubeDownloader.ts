"use client";

import ytdl from 'ytdl-core';
import { VideoDownloader, VideoInfo, VideoFormat, VideoPreview } from './VideoDownloader';

/**
 * YouTube video downloader implementation using server-side API
 */
export class YouTubeDownloader extends VideoDownloader {
  private logPrefix = '[YouTubeDownloader]';
  private apiBaseUrl = '/api/youtube';

  /**
   * Log a message with timestamp
   */
  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `${this.logPrefix} [${timestamp}] ${message}`;
    
    switch (level) {
      case 'info':
        if (data) {
          console.log(logMessage, data);
        } else {
          console.log(logMessage);
        }
        break;
      case 'warn':
        if (data) {
          console.warn(logMessage, data);
        } else {
          console.warn(logMessage);
        }
        break;
      case 'error':
        if (data) {
          console.error(logMessage, data);
        } else {
          console.error(logMessage);
        }
        break;
    }
  }

  /**
   * Validate if the URL is a valid YouTube URL
   * @param url The URL to validate
   * @returns True if the URL is a valid YouTube URL
   */
  validateURL(url: string): boolean {
    this.log('info', `Validating URL: ${url}`);
    const isValid = ytdl.validateURL(url);
    
    if (isValid) {
      this.log('info', `URL is valid YouTube URL: ${url}`);
    } else {
      this.log('warn', `URL is not a valid YouTube URL: ${url}`);
    }
    
    return isValid;
  }

  /**
   * Extract the video ID from the YouTube URL
   * @param url The YouTube URL
   * @returns The video ID or null if invalid
   */
  getVideoID(url: string): string | null {
    this.log('info', `Extracting video ID from URL: ${url}`);
    
    try {
      const videoId = ytdl.getURLVideoID(url);
      this.log('info', `Successfully extracted video ID: ${videoId} from URL: ${url}`);
      return videoId;
    } catch (error) {
      this.log('error', `Failed to extract YouTube video ID from URL: ${url}`, error);
      return null;
    }
  }

  /**
   * Get video information including available formats
   * @param url The YouTube URL
   * @returns Promise with video information
   */
  async getInfo(url: string): Promise<VideoInfo> {
    this.log('info', `Getting video info for URL: ${url} via API`);
    
    try {
      // Fetch video info using our server API
      const apiUrl = `${this.apiBaseUrl}/info?url=${encodeURIComponent(url)}`;
      this.log('info', `Calling API endpoint: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.log('info', `Successfully retrieved video info from API for URL: ${url}`);
      
      return data.videoInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', `Failed to get YouTube video info for URL: ${url}. Error: ${errorMessage}`, error);
      
      throw new Error('Failed to get video information: ' + errorMessage);
    }
  }

  /**
   * Get basic preview information about the YouTube video
   * This is useful for displaying a preview before downloading
   * @param url The YouTube URL
   * @returns Promise with basic video preview information
   */
  async getPreviewInfo(url: string): Promise<VideoPreview> {
    this.log('info', `Getting preview info for URL: ${url} via API`);
    
    try {
      // Fetch video preview info using our server API (same endpoint as getInfo)
      const apiUrl = `${this.apiBaseUrl}/info?url=${encodeURIComponent(url)}`;
      this.log('info', `Calling API endpoint: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.log('info', `Successfully retrieved video preview from API for URL: ${url}`);
      
      return data.videoPreview;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', `Failed to get YouTube video preview for URL: ${url}. Error: ${errorMessage}`, error);
      
      throw new Error('Failed to get video preview information: ' + errorMessage);
    }
  }

  /**
   * Choose the best format based on the requested quality
   * @param info Video information
   * @param quality Requested quality (e.g., "1080p", "720p", "audio")
   * @returns The chosen format
   */
  chooseFormat(info: VideoInfo, quality: string): VideoFormat {
    this.log('info', `Choosing format with quality: ${quality} from ${info.formats.length} available formats`);
    
    // Filter formats based on quality
    const matchingFormats = info.formats.filter(format => {
      // For audio-only requests
      if (quality === 'audio') {
        return format.hasAudio && !format.hasVideo;
      }
      
      // Check if the format matches the selected quality string
      // Now format.quality contains more details like resolution, codec, and file size
      return format.quality.includes(quality);
    });
    
    this.log('info', `Found ${matchingFormats.length} formats matching quality: ${quality}`);
    
    // If no format matched the exact quality string (which now includes more details),
    // try to match just the resolution part
    if (matchingFormats.length === 0 && quality.includes('p')) {
      // Extract just the resolution (e.g., "1080p" from "1080p - H.264 (50.5MB)")
      const resolution = quality.split(' - ')[0].trim();
      
      const resolutionMatches = info.formats.filter(format => 
        format.quality.startsWith(resolution)
      );
      
      this.log('info', `Falling back to resolution match: found ${resolutionMatches.length} formats matching resolution: ${resolution}`);
      
      if (resolutionMatches.length > 0) {
        // Sort by bitrate for better quality selection
        const sortedFormats = resolutionMatches.sort((a, b) => {
          return (b.bitrate || 0) - (a.bitrate || 0);
        });
        
        const selectedFormat = sortedFormats[0];
        this.log('info', `Selected format by resolution: ${selectedFormat.quality}`);
        return selectedFormat;
      }
    }
    
    // Sort by bitrate for better quality selection
    const sortedFormats = matchingFormats.length > 0 ? 
      matchingFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0)) : 
      info.formats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    
    // Return the highest quality format matching the criteria, or the first format if none match
    const selectedFormat = sortedFormats[0] || info.formats[0];
    
    if (selectedFormat) {
      this.log('info', `Selected format: ${selectedFormat.quality}, hasAudio: ${selectedFormat.hasAudio}, hasVideo: ${selectedFormat.hasVideo}, bitrate: ${selectedFormat.bitrate}`);
    } else {
      this.log('warn', `No matching format found for quality: ${quality}, falling back to first available format`);
    }
    
    return selectedFormat;
  }

  /**
   * Create a download stream for the YouTube video
   * @param url The YouTube URL
   * @param format The chosen format
   * @returns A ReadableStream for the video
   */
  createDownloadStream(url: string, format: VideoFormat): ReadableStream {
    this.log('info', `Creating download stream for URL: ${url}, format: ${format.quality}`);
    
    try {
      const itag = (format as any).itag;
      
      if (!itag) {
        throw new Error("Format doesn't have an itag identifier");
      }
      
      const downloadUrl = `${this.apiBaseUrl}/download?url=${encodeURIComponent(url)}&itag=${itag}`;
      this.log('info', `Using API download URL: ${downloadUrl}`);
      
      // Create a new ReadableStream that performs the fetch when needed
      return new ReadableStream({
        async start(controller) {
          try {
            const response = await fetch(downloadUrl);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            if (!response.body) {
              throw new Error('Response body is null');
            }
            
            const reader = response.body.getReader();
            
            // Read the stream and forward to our controller
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', `Failed to create download stream for URL: ${url}. Error: ${errorMessage}`, error);
      throw new Error('Failed to create download stream: ' + errorMessage);
    }
  }

  /**
   * Download the YouTube video and save it to the user's device
   * @param url The YouTube URL
   * @param format The chosen format
   * @param filename Optional filename (without extension)
   */
  async downloadVideo(url: string, format: VideoFormat, filename?: string): Promise<void> {
    this.log('info', `Starting download for URL: ${url}, format: ${format.quality}`);
    
    try {
      const itag = (format as any).itag;
      
      if (!itag) {
        throw new Error("Format doesn't have an itag identifier");
      }
      
      // Build download URL with all parameters
      let downloadUrl = `${this.apiBaseUrl}/download?url=${encodeURIComponent(url)}&itag=${itag}`;
      
      if (filename) {
        const sanitizedFilename = this.sanitizeFilename(filename);
        downloadUrl += `&filename=${encodeURIComponent(sanitizedFilename)}`;
      }
      
      this.log('info', `Using API download URL: ${downloadUrl}`);
      
      // Create and click a download link to the API
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = ''; // Let the server set the filename
      a.style.display = 'none';
      document.body.appendChild(a);
      
      this.log('info', `Triggering download via anchor element`);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        this.log('info', `Download link element removed from DOM`);
      }, 100);
      
      this.log('info', `Download initiated successfully using API method`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', `Failed to download video for URL: ${url}. Error: ${errorMessage}`, error);
      
      throw new Error('Failed to download video: ' + errorMessage);
    }
  }
  
  /**
   * Sanitize a filename to be safe for saving
   * @param filename The raw filename
   * @returns A sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    const sanitized = filename
      .replace(/[\\/:*?"<>|]/g, '_') // Replace invalid characters
      .trim()
      .substring(0, 200); // Limit length
    
    if (sanitized !== filename) {
      this.log('info', `Sanitized filename: "${filename}" → "${sanitized}"`);
    }
    
    return sanitized;
  }
} 