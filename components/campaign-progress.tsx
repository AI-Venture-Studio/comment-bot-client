"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Loader2, 
  CheckCircle2,
  Zap,
  StopCircle,
  XCircle,
  User,
  MessageSquare,
  LogIn,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { CommentCampaign } from "@/lib/types/campaign"
import { Button } from "@/components/ui/button"

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

// Checkpoint from the new API
interface Checkpoint {
  type: "campaign" | "login" | "target" | "posts" | "comment"
  status: "success" | "failure"
  message: string
  target?: string
  index?: number
  total?: number
  timestamp: string
}

interface CheckpointsResponse {
  checkpoints: Checkpoint[]
  total: number
  comment_count: number
  status: "idle" | "running" | "completed" | "error"
}

// Get icon for checkpoint type and status
function getCheckpointIcon(type: string, status: string, message: string) {
  if (status === "failure") {
    return <XCircle className="h-4 w-4 text-red-500" />
  }
  
  // Check message content to determine more specific icon
  const lowerMessage = message.toLowerCase()
  
  switch (type) {
    case "campaign":
      // Login messages use campaign type
      if (lowerMessage.includes("login")) {
        return <LogIn className="h-4 w-4 text-green-500" />
      }
      return <Zap className="h-4 w-4 text-primary" />
    case "target":
      // Posts scanned messages use target type
      if (lowerMessage.includes("scanned") || lowerMessage.includes("posts")) {
        return <Search className="h-4 w-4 text-purple-500" />
      }
      // Finished/completed target
      if (lowerMessage.includes("finished")) {
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      }
      return <User className="h-4 w-4 text-blue-500" />
    case "comment":
      return <MessageSquare className="h-4 w-4 text-green-500" />
    default:
      return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
  }
}

export function CampaignProgress({ campaignState }: CampaignProgressProps) {
  const [displayedPhase, setDisplayedPhase] = useState<CampaignPhase>("idle")
  const [apiProgress, setApiProgress] = useState<ApiProgressResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeCampaign, setActiveCampaign] = useState<CommentCampaign | null>(null)
  const [previousStatus, setPreviousStatus] = useState<string | null>(null)
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0)
  const [isAborting, setIsAborting] = useState(false)
  
  // Track seen checkpoint IDs to prevent duplicates
  const seenCheckpointIds = useRef<Set<string>>(new Set())
  // Track which errors we've already shown toasts for
  const shownErrorToasts = useRef<Set<string>>(new Set())

  // Suppress unused variable warnings for state setters we need
  void setDisplayedPhase

  // Fetch current progress from API
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        const response = await fetch(`${apiUrl}/api/progress/current`)
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
          // Reset checkpoints state when idle to prepare for next campaign
          if (data.status === "idle") {
            seenCheckpointIds.current.clear()
            shownErrorToasts.current.clear()
            setCheckpoints([])
            setCommentCount(0)
            setCurrentCheckpointIndex(0)
          }
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

  // Fetch checkpoints for carousel (final outcomes only)
  useEffect(() => {
    const fetchCheckpoints = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/progress/checkpoints?limit=10`)
        const data: CheckpointsResponse = await response.json()
        
        if (data.checkpoints && data.checkpoints.length > 0) {
          // Only add new checkpoints that we haven't seen
          const newCheckpoints = data.checkpoints.filter(checkpoint => {
            const checkpointId = `${checkpoint.type}-${checkpoint.status}-${checkpoint.timestamp}`
            if (seenCheckpointIds.current.has(checkpointId)) {
              return false
            }
            seenCheckpointIds.current.add(checkpointId)
            return true
          })
          
          if (newCheckpoints.length > 0) {
            setCheckpoints(prev => {
              // Append new checkpoints, keeping most recent 10
              const updated = [...prev, ...newCheckpoints].slice(-10)
              return updated
            })
          }
          
          // Update comment count from API
          setCommentCount(data.comment_count)
          
          // Check for NEW failure checkpoints and show toast (only once per unique error)
          const recentFailures = data.checkpoints.slice(0, 3).filter(c => c.status === 'failure')
          if (recentFailures.length > 0 && apiProgress?.status === 'error') {
            const latestError = recentFailures[0]
            const errorId = `${latestError.timestamp}-${latestError.message}`
            
            // Only show toast if we haven't shown it for this specific error
            if (!shownErrorToasts.current.has(errorId)) {
              shownErrorToasts.current.add(errorId)
              const isSuspensionError = latestError.message.toLowerCase().includes('suspended')
              toast.error(isSuspensionError ? "Account Suspended" : "Campaign encountered errors", {
                description: latestError.message,
                duration: 7000,
              })
            }
          }
        }
      } catch (error) {
        console.error("Error fetching checkpoints:", error)
      }
    }

    fetchCheckpoints()
    const interval = setInterval(fetchCheckpoints, 2000)

    return () => clearInterval(interval)
  }, [apiProgress?.status])

  // Auto-rotate carousel through checkpoints
  useEffect(() => {
    if (checkpoints.length > 1) {
      const interval = setInterval(() => {
        setCurrentCheckpointIndex((prev) => (prev + 1) % checkpoints.length)
      }, 4000) // Change every 4 seconds

      return () => clearInterval(interval)
    }
  }, [checkpoints.length])

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
            // Check if it's a suspension error
            const isSuspensionError = apiProgress.latest_sentence?.toLowerCase().includes('suspended')
            
            toast.error(isSuspensionError ? "Account Suspended" : "Campaign failed", {
              description: isSuspensionError 
                ? apiProgress.latest_sentence 
                : "The campaign encountered errors. Check the logs and try again.",
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
  const handleAbortCampaign = async () => {
    if (!activeCampaign) return
    
    setIsAborting(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      
      // Step 1: Signal the backend to abort and clean up resources
      const abortResponse = await fetch(`${apiUrl}/api/abort`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          campaign_id: activeCampaign.campaign_id 
        })
      })
      
      if (!abortResponse.ok) {
        throw new Error('Failed to signal abort to backend')
      }
      
      // Step 2: Update campaign status in database
      const dbResponse = await fetch(
        `${supabaseUrl}/rest/v1/comment_campaigns?campaign_id=eq.${activeCampaign.campaign_id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ status: 'aborted' })
        }
      )
      
      if (dbResponse.ok) {
        toast.success("Campaign aborted", {
          description: "Resources are being cleaned up. Campaign moved to aborted section.",
          duration: 3000,
        })
        setActiveCampaign(null)
      } else {
        throw new Error('Failed to update campaign status')
      }
    } catch (error) {
      console.error('Error aborting campaign:', error)
      toast.error("Failed to abort campaign", {
        description: "Please try again or check the logs.",
        duration: 5000,
      })
    } finally {
      setIsAborting(false)
    }
  }

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
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Live Campaign Progress</CardTitle>
            {effectiveState.isActive && displayedPhase !== "completed" && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-green-600">Running</span>
              </div>
            )}
          </div>
          {effectiveState.isActive && displayedPhase !== "completed" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleAbortCampaign}
              disabled={isAborting}
              className="gap-2"
            >
              <StopCircle className="h-4 w-4" />
              {isAborting ? "Aborting..." : "Abort"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Live Activity Carousel - Shows checkpoint outcomes only */}
        <div className="relative overflow-hidden p-4 rounded-lg bg-muted/50 border min-h-[100px]">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Live Activity
          </p>
          <div className="relative h-16 overflow-hidden">
            {checkpoints.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`checkpoint-${currentCheckpointIndex}-${checkpoints[currentCheckpointIndex]?.timestamp}`}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ 
                    duration: 0.6,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                  className="absolute inset-0 flex items-center"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getCheckpointIcon(
                        checkpoints[currentCheckpointIndex]?.type, 
                        checkpoints[currentCheckpointIndex]?.status,
                        checkpoints[currentCheckpointIndex]?.message || ''
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm leading-relaxed">{checkpoints[currentCheckpointIndex]?.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(checkpoints[currentCheckpointIndex]?.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Waiting for campaign checkpoints...</p>
              </div>
            )}
          </div>
          {/* Carousel indicators */}
          {checkpoints.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {checkpoints.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCheckpointIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentCheckpointIndex 
                      ? 'w-6 bg-primary' 
                      : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to checkpoint ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Comment Counter - Uses checkpoint-based count */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total Comments Placed
          </p>
          <motion.div
            key={commentCount}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-5xl font-bold text-primary tabular-nums"
          >
            {commentCount}
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
