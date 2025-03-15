"use client"

import { useState, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Youtube, Twitter, Instagram, Loader2 } from "lucide-react"
import { detectPlatform, getDownloader, VideoInfo, VideoFormat } from "@/utils/videoProcessing"

export default function VideoDownloader() {
  const [url, setUrl] = useState("")
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const downloader = getDownloader(url)
      
      if (!downloader) {
        setError("Unsupported video platform. Please enter a valid URL from YouTube, Twitter, TikTok, or Instagram.")
        setIsLoading(false)
        return
      }

      // Get video information
      const info = await downloader.getInfo(url)
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
      }
    } catch (err) {
      console.error('Error getting video info:', err)
      setError("Failed to get video information. Please check the URL and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!videoInfo || !selectedFormat) return
    
    try {
      setIsLoading(true)
      const downloader = getDownloader(url)
      
      if (!downloader) {
        setError("Downloader not found for this URL")
        return
      }
      
      await downloader.downloadVideo(url, selectedFormat)
    } catch (err) {
      console.error('Download error:', err)
      setError("Failed to download video. Please try again or try a different format.")
    } finally {
      setIsLoading(false)
    }
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

  const formatQualityLabel = (format: VideoFormat): string => {
    let label = format.quality
    
    if (format.hasVideo && !format.hasAudio) {
      label += " (Video Only)"
    } else if (!format.hasVideo && format.hasAudio) {
      label += " (Audio Only)"
    }
    
    return label
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
                Loading...
              </>
            ) : (
              "Get Video"
            )}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
      </form>

      {videoInfo && (
        <Card className="overflow-hidden">
          <div className="aspect-video relative bg-muted">
            <img
              src={videoInfo.thumbnail || "/placeholder.svg"}
              alt={videoInfo.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1">
              {getPlatformIcon(videoInfo.platform)}
            </div>
          </div>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">{videoInfo.title}</h2>

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
                        {formatQualityLabel(format)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleDownload} 
                className="w-full sm:w-auto"
                disabled={isLoading || !selectedFormat}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            </div>
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
    </div>
  )
} 