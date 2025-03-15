import VideoDownloader from "@/components/video-downloader"
import AdBanner from "@/components/ad-banner"
import AdSidebar from "@/components/ad-sidebar"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Ad Banner */}
      <AdBanner className="w-full h-24 bg-muted" position="top" />

      <div className="flex flex-1 w-full">
        {/* Left Sidebar Ads */}
        <AdSidebar className="hidden lg:block w-40 xl:w-64 shrink-0" position="left" />

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Video Downloader</h1>
            <p className="text-center text-muted-foreground mb-8">
              Download videos from YouTube, Twitter, TikTok, and Instagram
            </p>

            <VideoDownloader />
          </div>
        </main>

        {/* Right Sidebar Ads */}
        <AdSidebar className="hidden lg:block w-40 xl:w-64 shrink-0" position="right" />
      </div>

      {/* Footer Ad Banner */}
      <AdBanner className="w-full h-24 bg-muted" position="bottom" />
    </div>
  )
}

