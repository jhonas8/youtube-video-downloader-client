import { cn } from "@/lib/utils"

interface AdBannerProps {
  className?: string
  position: "top" | "bottom"
}

export default function AdBanner({ className, position }: AdBannerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="text-center text-muted-foreground">
        <div className="text-sm font-medium">Advertisement</div>
        <div className="text-xs">Google AdSense {position} banner</div>
      </div>
    </div>
  )
}

