"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Youtube, Twitter, Instagram } from "lucide-react"

// Mock video resolutions for demo purposes
const RESOLUTIONS = {
  youtube: ["1080p", "720p", "480p", "360p", "240p"],
  twitter: ["720p", "480p", "360p"],
  tiktok: ["720p", "480p", "360p"],
  instagram: ["1080p", "720p", "480p"],
}

export default function VideoDownloader() {
  const [url, setUrl] = useState("")
  const [videoInfo, setVideoInfo] = useState<null | {
    platform: string
    title: string
    thumbnail: string
    resolutions: string[]
  }>(null)
  const [selectedResolution, setSelectedResolution] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const detectPlatform = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
    if (url.includes("twitter.com") || url.includes("x.com")) return "twitter"
    if (url.includes("tiktok.com")) return "tiktok"
    if (url.includes("instagram.com")) return "instagram"
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call to get video info
    setTimeout(() => {
      const platform = detectPlatform(url)

      if (platform) {
        const mockVideoInfo = {
          platform,
          title: `Sample ${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
          thumbnail: `/placeholder.svg?height=720&width=1280`,
          resolutions: RESOLUTIONS[platform as keyof typeof RESOLUTIONS] || [],
        }

        setVideoInfo(mockVideoInfo)
        setSelectedResolution(mockVideoInfo.resolutions[0])
      } else {
        // Handle unsupported platform
        alert("Unsupported video platform. Please enter a valid URL from YouTube, Twitter, TikTok, or Instagram.")
      }

      setIsLoading(false)
    }, 1000)
  }

  const handleDownload = () => {
    // In a real implementation, this would trigger the actual download
    // For demo purposes, we'll just show an alert
    alert(`Downloading ${videoInfo?.title} in ${selectedResolution} resolution`)
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
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Get Video"}
          </Button>
        </div>
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
              <div className="w-full sm:w-48">
                <Select value={selectedResolution} onValueChange={setSelectedResolution}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoInfo.resolutions.map((resolution) => (
                      <SelectItem key={resolution} value={resolution}>
                        {resolution}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleDownload} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download
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

