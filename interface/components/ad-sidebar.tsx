import { cn } from "@/lib/utils"

interface AdSidebarProps {
  className?: string
  position: "left" | "right"
}

export default function AdSidebar({ className, position }: AdSidebarProps) {
  return (
    <div className={cn("flex flex-col items-center justify-start p-4", className)}>
      <div className="sticky top-4 w-full space-y-4">
        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-sm font-medium">Advertisement</div>
            <div className="text-xs">Google AdSense {position} sidebar</div>
          </div>
        </div>

        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-sm font-medium">Advertisement</div>
            <div className="text-xs">Google AdSense {position} sidebar</div>
          </div>
        </div>
      </div>
    </div>
  )
}

