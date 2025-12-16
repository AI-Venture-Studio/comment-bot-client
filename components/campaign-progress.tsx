"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Loader2, 
  CheckCircle2, 
  MessageSquare, 
  User, 
  Target,
  Clock,
  Zap,
  CircleDot
} from "lucide-react"
import { cn } from "@/lib/utils"

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

interface CampaignProgressProps {
  campaignState?: CampaignState
}

const phaseConfig: Record<CampaignPhase, { 
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}> = {
  idle: {
    label: "Waiting to start",
    icon: <Clock className="h-4 w-4" />,
    color: "text-gray-500",
    bgColor: "bg-gray-100"
  },
  connecting: {
    label: "Connecting to browser",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  authenticating: {
    label: "Authenticating session",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: "text-amber-500",
    bgColor: "bg-amber-50"
  },
  navigating: {
    label: "Navigating to profile",
    icon: <Target className="h-4 w-4" />,
    color: "text-purple-500",
    bgColor: "bg-purple-50"
  },
  commenting: {
    label: "Posting comment",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  waiting: {
    label: "Waiting cooldown",
    icon: <Clock className="h-4 w-4" />,
    color: "text-orange-500",
    bgColor: "bg-orange-50"
  },
  completed: {
    label: "Campaign completed",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50"
  }
}

const platformIcons: Record<Platform, string> = {
  instagram: "IG",
  tiktok: "TT",
  threads: "TH",
  x: "X"
}

const platformColors: Record<Platform, string> = {
  instagram: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500",
  tiktok: "bg-black",
  threads: "bg-gray-900",
  x: "bg-black"
}

// Demo state for development - remove in production
const demoState: CampaignState = {
  phase: "commenting",
  currentAccount: "@kwaks419",
  targetProfile: "@hypebeastkicks",
  platform: "instagram",
  currentPost: 3,
  totalPosts: 59,
  postsCommented: 2,
  postsSkipped: 1,
  commentText: "cool shoes!",
  isActive: true
}

export function CampaignProgress({ campaignState = demoState }: CampaignProgressProps) {
  const [displayedPhase, setDisplayedPhase] = useState<CampaignPhase>(campaignState.phase)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (campaignState.phase !== displayedPhase) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setDisplayedPhase(campaignState.phase)
        setIsTransitioning(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [campaignState.phase, displayedPhase])

  const currentPhaseConfig = phaseConfig[displayedPhase]
  const progressPercentage = campaignState.totalPosts > 0 
    ? (campaignState.currentPost / campaignState.totalPosts) * 100 
    : 0

  if (!campaignState.isActive && campaignState.phase === "idle") {
    return (
      <Card className="border-dashed border-2 bg-muted/30">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="rounded-full bg-muted p-3">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No active campaign running
            </p>
            <p className="text-xs text-muted-foreground/70">
              Start a campaign from the queue to see live progress
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
          {campaignState.isActive && campaignState.phase !== "completed" && (
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
        {/* Main Progress Row */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold">{campaignState.postsCommented}</span>
                <span className="text-sm text-muted-foreground">/ {campaignState.totalPosts}</span>
              </div>
              <p className="text-xs text-muted-foreground">Posts commented</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                {Math.round(progressPercentage)}%
              </div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1 p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Commenting as</p>
            <p className="text-sm font-medium truncate">{campaignState.currentAccount}</p>
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-sm font-medium truncate">{campaignState.targetProfile}</p>
          </div>
        </div>

        {/* Current Comment */}
        {campaignState.commentText && (
          <div 
            className="p-3 rounded-lg border bg-primary/5 border-primary/20"
          >
            <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1.5">Current comment</p>
            <p className="text-sm">&ldquo;{campaignState.commentText}&rdquo;</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
