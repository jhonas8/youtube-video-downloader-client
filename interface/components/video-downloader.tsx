"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Youtube, Twitter, Instagram, Loader2, Clock, User, Eye, HelpCircle } from "lucide-react"

// Import the VideoDownloader and YouTubeDownloader classes
import { VideoInfo, VideoFormat, VideoPreview } from "@/utils/videoProcessing/VideoDownloader"
import { YouTubeDownloader } from "@/utils/videoProcessing/YouTubeDownloader"

// Create instances of platform downloaders
const youtubeDownloader = new YouTubeDownloader()

export default function VideoDownloader() {
  const [url, setUrl] = useState("")
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [videoPreview, setVideoPreview] = useState<VideoPreview | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const detectPlatform = (url: string): string | null => {
    if (youtubeDownloader.validateURL(url)) return "youtube"
    if (url.includes("twitter.com") || url.includes("x.com")) return "twitter"
    if (url.includes("tiktok.com")) return "tiktok"
    if (url.includes("instagram.com")) return "instagram"
    return null
  }

  const getMockInfo = (platform: string): VideoInfo => {
    // Mock data for platforms other than YouTube
    const resolutions = {
      twitter: ["720p", "480p", "360p"],
      tiktok: ["720p", "480p", "360p"],
      instagram: ["1080p", "720p", "480p"],
    }

    const mockFormats = (resolutions[platform as keyof typeof resolutions] || []).map(resolution => ({
      quality: resolution,
      format: 'video/mp4',
      container: 'mp4',
      hasAudio: true,
      hasVideo: true,
      bitrate: resolution === '720p' ? 2000000 : resolution === '480p' ? 1000000 : 500000
    }))

    return {
      title: `Sample ${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
      thumbnail: `/placeholder.svg?height=720&width=1280`,
      formats: mockFormats,
      platform
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setVideoPreview(null)
    setVideoInfo(null)

    // Show processing toast
    const toastId = toast.loading("Processing video link...")

    try {
      const platform = detectPlatform(url)
      
      if (!platform) {
        toast.error("Unsupported video platform", {
          id: toastId,
          description: "Please enter a valid URL from YouTube, Twitter, TikTok, or Instagram.",
        })
        setIsLoading(false)
        return
      }

      // First get preview info to show immediately
      try {
        if (platform === 'youtube') {
          const preview = await youtubeDownloader.getPreviewInfo(url)
          setVideoPreview(preview)
          
          // Update loading toast to show we're fetching formats
          toast.loading("Fetching available formats...", {
            id: toastId,
          })
        } else {
          // For other platforms, set basic mock preview
          setVideoPreview({
            title: `Sample ${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
            thumbnail: `/placeholder.svg?height=720&width=1280`,
            platform
          })
        }
      } catch (previewError) {
        console.error('Error getting video preview:', previewError)
        // Continue even if preview fails - don't update the toast
      }

      // Then get detailed format info
      let info: VideoInfo
      
      if (platform === 'youtube') {
        info = await youtubeDownloader.getInfo(url)
      } else {
        // For other platforms, use mock data for now
        info = getMockInfo(platform)
      }
      
      setVideoInfo(info)
      
      // Select the highest quality format by default
      if (info.formats.length > 0) {
        // Sort formats by quality (prefer formats with both audio and video)
        const sortedFormats = [...info.formats].sort((a, b) => {
          // Prefer formats with both audio and video
          if (a.hasAudio && a.hasVideo && (!b.hasAudio || !b.hasVideo)) {
            return -1
          }
          if (b.hasAudio && b.hasVideo && (!a.hasAudio || !a.hasVideo)) {
            return 1
          }
          // Otherwise sort by bitrate
          return (b.bitrate || 0) - (a.bitrate || 0)
        })
        
        setSelectedFormat(sortedFormats[0])
        
        // Success toast
        toast.success("Video processed successfully", {
          id: toastId,
          description: `Found ${info.formats.length} available formats`,
        })
      }
    } catch (err) {
      console.error('Error getting video info:', err)
      toast.error("Failed to process video", {
        id: toastId,
        description: "Please check the URL and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!videoInfo || !selectedFormat) return
    
    setIsDownloading(true)
    
    // Show download starting toast
    const toastId = toast.loading(`Starting download...`, {
      description: `${videoInfo.title} (${selectedFormat.quality})`,
    })
    
    try {
      if (videoInfo.platform === 'youtube') {
        await youtubeDownloader.downloadVideo(url, selectedFormat, videoInfo.title)
        
        // Success toast for download
        toast.success(`Download complete!`, {
          id: toastId,
          description: `${videoInfo.title} has been downloaded in ${selectedFormat.quality}`,
        })
      } else {
        // For other platforms (mock implementation)
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        toast.success(`Download complete!`, {
          id: toastId,
          description: `${videoInfo.title} has been downloaded in ${selectedFormat.quality}`,
          action: {
            label: "Open",
            onClick: () => toast.info("This would open the file in a real implementation"),
          },
        })
      }
    } catch (err) {
      console.error('Download error:', err)
      toast.error("Download failed", {
        id: toastId,
        description: "Please try again or select a different format.",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const getFormatLabel = (format: VideoFormat): string => {
    let label = format.quality
    
    if (format.hasVideo && !format.hasAudio) {
      label += " (Video Only)"
    } else if (!format.hasVideo && format.hasAudio) {
      label += " (Audio Only)"
    }
    
    return label
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return <Youtube className="h-5 w-5 text-red-500" />
      case "twitter":
        return <Twitter className="h-5 w-5 text-blue-400" />
      case "instagram":
        return <Instagram className="h-5 w-5 text-pink-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="url"
            placeholder="Paste video URL (YouTube, Twitter, TikTok, Instagram)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              "Get Video"
            )}
          </Button>
        </div>
      </form>

      {videoPreview && (
        <Card className="overflow-hidden">
          <div className="aspect-video relative bg-muted">
            <img
              src={videoPreview.thumbnail || "/placeholder.svg"}
              alt={videoPreview.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1">
              {getPlatformIcon(videoPreview.platform)}
            </div>
          </div>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">{videoPreview.title}</h2>
            
            {/* Additional video metadata if available */}
            {(videoPreview.author || videoPreview.duration || videoPreview.views) && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                {videoPreview.author && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{videoPreview.author}</span>
                  </div>
                )}
                {videoPreview.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{videoPreview.duration}</span>
                  </div>
                )}
                {videoPreview.views && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{videoPreview.views}</span>
                  </div>
                )}
              </div>
            )}

            {/* Format selection and download button */}
            {videoInfo ? (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full sm:w-64">
                  <Select 
                    value={selectedFormat ? videoInfo.formats.indexOf(selectedFormat).toString() : ""}
                    onValueChange={(value) => setSelectedFormat(videoInfo.formats[parseInt(value)])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoInfo.formats.map((format, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {getFormatLabel(format)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleDownload} 
                  className="w-full sm:w-auto"
                  disabled={isDownloading || !selectedFormat}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-12">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="text-muted-foreground">Loading available formats...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-medium mb-2">Supported Platforms</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            <span>YouTube</span>
          </div>
          <div className="flex items-center gap-2">
            <Twitter className="h-5 w-5 text-blue-400" />
            <span>Twitter</span>
          </div>
          <div className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            <span>Instagram</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.589 6.686a4.793 4.793 0 0 0-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
            </svg>
            <span>TikTok</span>
          </div>
        </div>
      </div>

      {/* Add a helper button to demonstrate toast notifications */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => {
            toast.info("Try pasting a video URL", {
              description: "This app supports YouTube, Twitter, TikTok, and Instagram videos",
            })
          }}
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Need help?
        </Button>
      </div>
    </div>
  )
}

