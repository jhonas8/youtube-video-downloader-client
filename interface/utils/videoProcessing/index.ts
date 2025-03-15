"use client";

import { VideoDownloader } from './VideoDownloader';
import { YouTubeDownloader } from './YouTubeDownloader';

// Register all platform-specific downloaders here
const downloaders = {
  youtube: new YouTubeDownloader(),
  // Add more downloaders as they are implemented
};

/**
 * Detect the platform from a video URL
 * @param url The video URL to analyze
 * @returns The platform identifier or null if not supported
 */
export const detectPlatform = (url: string): string | null => {
  if (!url) return null;
  
  // Try to match URL against each registered downloader
  for (const [platform, downloader] of Object.entries(downloaders)) {
    if (downloader.validateURL(url)) {
      return platform;
    }
  }
  
  return null;
};

/**
 * Get the appropriate video downloader for a URL
 * @param url The video URL to get a downloader for
 * @returns A VideoDownloader instance or null if platform not supported
 */
export const getDownloader = (url: string): VideoDownloader | null => {
  const platform = detectPlatform(url);
  
  if (platform && downloaders[platform as keyof typeof downloaders]) {
    return downloaders[platform as keyof typeof downloaders];
  }
  
  return null;
};

/**
 * Check if a URL is supported by any of the registered downloaders
 * @param url The URL to check
 * @returns True if the URL is supported
 */
export const isSupportedURL = (url: string): boolean => {
  return detectPlatform(url) !== null;
};

// Export types and classes
export * from './VideoDownloader';
export * from './YouTubeDownloader';

// Export the downloaders object for direct access
export { downloaders }; 