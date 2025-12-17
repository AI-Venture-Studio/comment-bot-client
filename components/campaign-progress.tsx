"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Loader2, 
  CheckCircle2,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { CommentCampaign } from "@/lib/types/campaign"

type Platform = "instagram" | "tiktok" | "threads" | "x"

type CampaignPhase = 
  | "connecting"
  | "authenticating" 
  | "navigating"
  | "commenting"
  | "waiting"
  | "completed"
  | "idle"

interface CampaignState {
  phase: CampaignPhase
  currentAccount: string
  targetProfile: string
  platform: Platform
  currentPost: number
  totalPosts: number
  postsCommented: number
  postsSkipped: number
  commentText: string
  isActive: boolean
}

interface ApiProgressResponse {
  status: "idle" | "running" | "completed" | "error"
  progress: number
  latest_sentence: string
  total_events: number
}

interface CampaignProgressProps {
  campaignState?: CampaignState
}

interface ProgressEvent {
  sentence: string
  category: string
  progress?: number
  timestamp: string
  significant: boolean
}

export function CampaignProgress({ campaignState }: CampaignProgressProps) {
  const [displayedPhase, setDisplayedPhase] = useState<CampaignPhase>("idle")
  const [apiProgress, setApiProgress] = useState<ApiProgressResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeCampaign, setActiveCampaign] = useState<CommentCampaign | null>(null)
  const [previousStatus, setPreviousStatus] = useState<string | null>(null)
  const [events, setEvents] = useState<ProgressEvent[]>([])
  const [currentEventIndex, setCurrentEventIndex] = useState(0)

  // Suppress unused variable warnings for state setters we need
  void setDisplayedPhase

  // Fetch current progress from API
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/progress/current')
        const data: ApiProgressResponse = await response.json()
        setApiProgress(data)
        
        // Update phase based on API status
        if (data.status === "running") {
          // Parse the latest_sentence to determine phase
          const sentence = data.latest_sentence.toLowerCase()
          if (sentence.includes("navigating")) {
            setDisplayedPhase("navigating")
          } else if (sentence.includes("comment")) {
            setDisplayedPhase("commenting")
          } else if (sentence.includes("authenticating") || sentence.includes("login")) {
            setDisplayedPhase("authenticating")
          } else if (sentence.includes("connecting")) {
            setDisplayedPhase("connecting")
          } else if (sentence.includes("waiting") || sentence.includes("cooldown")) {
            setDisplayedPhase("waiting")
          } else {
            setDisplayedPhase("commenting")
          }
        } else if (data.status === "completed") {
          setDisplayedPhase("completed")
        } else {
          setDisplayedPhase("idle")
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching progress:", error)
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchProgress()

    // Poll every 2 seconds
    const interval = setInterval(fetchProgress, 2000)

    return () => clearInterval(interval)
  }, [])

  // Fetch events feed for carousel
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/progress/events?significant_only=true&limit=10')
        const data = await response.json()
        if (data.events && data.events.length > 0) {
          setEvents(data.events)
          
          // Check for error events in the most recent events
          const recentErrors = data.events.slice(0, 3).filter((e: ProgressEvent) => 
            e.category === 'error' && 
            (e.sentence.toLowerCase().includes('failed') || 
             e.sentence.toLowerCase().includes('could not') ||
             e.sentence.toLowerCase().includes('error'))
          )
          
          if (recentErrors.length > 0 && apiProgress?.status === 'error') {
            // Show error notification
            toast.error("Campaign encountered errors", {
              description: recentErrors[0].sentence,
              duration: 7000,
            })
          }
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      }
    }

    fetchEvents()
    const interval = setInterval(fetchEvents, 3000)

    return () => clearInterval(interval)
  }, [apiProgress?.status])

  // Auto-rotate carousel
  useEffect(() => {
    if (events.length > 1) {
      const interval = setInterval(() => {
        setCurrentEventIndex((prev) => (prev + 1) % events.length)
      }, 4000) // Change every 4 seconds

      return () => clearInterval(interval)
    }
  }, [events.length])

  // Fetch active campaign from Supabase
  useEffect(() => {
    const fetchActiveCampaign = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        const response = await fetch(
          `${supabaseUrl}/rest/v1/comment_campaigns?status=eq.in-progress&select=*`,
          {
            headers: {
              'apikey': supabaseKey!,
              'Authorization': `Bearer ${supabaseKey}`,
            }
          }
        )
        
        const data = await response.json()
        
        // Check if campaign completed or failed
        if (previousStatus === "in-progress" && (!data || data.length === 0)) {
          // Campaign transitioned from in-progress to not in-progress
          // Check API status to determine if it was success or failure
          if (apiProgress?.status === "error") {
            toast.error("Campaign failed", {
              description: "The campaign encountered errors. Check the logs and try again.",
              duration: 7000,
            })
          } else if (apiProgress?.status === "completed") {
            toast.success("Campaign completed successfully!", {
              description: "All comments have been posted.",
              duration: 5000,
            })
          }
        }
        
        if (data && data.length > 0) {
          setActiveCampaign(data[0])
          setPreviousStatus("in-progress")
        } else {
          setActiveCampaign(null)
          if (previousStatus === "in-progress") {
            setPreviousStatus("completed")
          }
        }
      } catch (error) {
        console.error("Error fetching active campaign:", error)
      }
    }

    // Initial fetch
    fetchActiveCampaign()

    // Poll every 3 seconds for more responsive updates
    const interval = setInterval(fetchActiveCampaign, 3000)

    return () => clearInterval(interval)
  }, [previousStatus, apiProgress?.status])

  // Merge API data with campaign state
  const effectiveState: CampaignState = campaignState || {
    phase: displayedPhase,
    currentAccount: activeCampaign?.user_accounts?.[0] || "",
    targetProfile: activeCampaign?.target_profiles?.[0] || "",
    platform: (activeCampaign?.platform || "instagram") as Platform,
    currentPost: apiProgress?.progress || 0,
    totalPosts: activeCampaign?.number_of_posts || 100,
    postsCommented: Math.floor((apiProgress?.progress || 0) * (activeCampaign?.number_of_posts || 100) / 100),
    postsSkipped: 0,
    commentText: activeCampaign?.custom_comment || "",
    isActive: apiProgress?.status === "running" || !!activeCampaign
  }

  if (isLoading) {
    return (
      <Card className="border-dashed border-2 bg-muted/30">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Loading campaign progress...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show empty state only when campaign is NOT in-progress (completed, idle, etc.)
  if (!activeCampaign || apiProgress?.status === "completed" || apiProgress?.status === "idle") {
    return (
      <Card className="border-dashed border-2 bg-muted/30">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="rounded-full bg-muted p-3">
              {apiProgress?.status === "completed" ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <Zap className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {apiProgress?.status === "completed" ? "Campaign completed" : "No active campaign running"}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {apiProgress?.status === "completed" 
                ? "Check the queue for campaign results" 
                : "Start a campaign from the queue to see live progress"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>Live Campaign Progress</CardTitle>
          {effectiveState.isActive && displayedPhase !== "completed" && (
            <div 
              className="flex items-center gap-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-green-600">Running</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Live Activity Carousel */}
        {events.length > 0 && (
          <div className="relative overflow-hidden p-3 rounded-lg bg-muted/50 border min-h-[80px]">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Live Activity
            </p>
            <div className="relative h-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentEventIndex}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ 
                    duration: 0.6,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                  className="absolute inset-0 flex items-center"
                >
                  <p className="text-sm">{events[currentEventIndex]?.sentence}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Live Comment Counter */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total Comments Placed
          </p>
          <motion.div
            key={effectiveState.postsCommented}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-5xl font-bold text-primary tabular-nums"
          >
            {effectiveState.postsCommented}
          </motion.div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1 p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Commenting as</p>
            <p className="text-sm font-medium truncate">{effectiveState.currentAccount || "Loading..."}</p>
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-sm font-medium truncate">{effectiveState.targetProfile || "Loading..."}</p>
          </div>
        </div>

        {/* Current Comment */}
        {effectiveState.commentText && (
          <div 
            className="p-3 rounded-lg border bg-primary/5 border-primary/20"
          >
            <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1.5">Current comment</p>
            <p className="text-sm">&ldquo;{effectiveState.commentText}&rdquo;</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
