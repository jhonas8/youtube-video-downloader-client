/**
 * Abstract base class for video downloading from various platforms
 */
export interface VideoInfo {
  title: string
  thumbnail: string
  formats: VideoFormat[]
  platform: string
}

export interface VideoFormat {
  quality: string
  format: string
  container: string
  hasAudio: boolean
  hasVideo: boolean
  size?: number
  bitrate?: number
}

export abstract class VideoDownloader {
  /**
   * Validate if the URL is from the supported platform
   * @param url The URL to validate
   * @returns True if the URL is valid for this platform
   */
  abstract validateURL(url: string): boolean

  /**
   * Extract the video ID from the URL
   * @param url The URL to extract the ID from
   * @returns The video ID
   */
  abstract getVideoID(url: string): string | null

  /**
   * Get video information including available formats
   * @param url The video URL
   * @returns Promise with video information
   */
  abstract getInfo(url: string): Promise<VideoInfo>

  /**
   * Choose the best format based on the requested quality
   * @param info Video information
   * @param quality Requested quality
   * @returns The chosen format
   */
  abstract chooseFormat(info: VideoInfo, quality: string): VideoFormat

  /**
   * Create a download stream for the video
   * @param url The video URL
   * @param format The chosen format
   * @returns A ReadableStream for the video
   */
  abstract createDownloadStream(url: string, format: VideoFormat): ReadableStream

  /**
   * Download the video and save it to the user's device
   * @param url The video URL
   * @param format The chosen format
   * @param filename Optional filename (without extension)
   */
  abstract downloadVideo(url: string, format: VideoFormat, filename?: string): Promise<void>
} 