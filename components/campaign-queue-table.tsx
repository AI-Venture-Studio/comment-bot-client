"use client"

import { useState, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  GripVertical, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Trash2, 
  Edit,
  Filter,
  ListOrdered
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CommentCampaign, CampaignStatus, Platform } from "@/lib/types/campaign"

// Platform icons and colors
const platformConfig: Record<Platform, { icon: string; label: string; color: string }> = {
  instagram: { icon: "IG", label: "Instagram", color: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" },
  tiktok: { icon: "TT", label: "TikTok", color: "bg-black" },
  threads: { icon: "TH", label: "Threads", color: "bg-gray-900" },
  x: { icon: "X", label: "X (Twitter)", color: "bg-black" },
}

const statusConfig: Record<CampaignStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  "not-started": { label: "Queued", variant: "secondary" },
  "in-progress": { label: "Running", variant: "warning" },
  "completed": { label: "Completed", variant: "success" },
}

interface QueueItemProps {
  campaign: CommentCampaign
  position: number
  onAction: (action: string, campaign: CommentCampaign) => void
}

function SortableQueueItem({ campaign, position, onAction }: QueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: campaign.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const platformInfo = platformConfig[campaign.platform]
  const statusInfo = statusConfig[campaign.status]

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b transition-colors hover:bg-muted/50",
        isDragging && "bg-muted shadow-lg z-50 relative",
        campaign.status === "in-progress" && "bg-amber-50/50"
      )}
    >
      {/* Drag Handle */}
      <TableCell className="w-10 px-2">
        <button
          {...attributes}
          {...listeners}
          className={cn(
            "p-1 rounded cursor-grab active:cursor-grabbing hover:bg-muted",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>

      {/* Position */}
      <TableCell className="w-12 font-mono text-sm text-muted-foreground">
        #{position}
      </TableCell>

      {/* Platform */}
      <TableCell className="w-28">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{platformInfo.label}</span>
        </div>
      </TableCell>

      {/* Target Profiles */}
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {campaign.target_profiles.slice(0, 2).map((profile) => (
            <Badge key={profile} variant="outline" className="text-xs">
              {profile}
            </Badge>
          ))}
          {campaign.target_profiles.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{campaign.target_profiles.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Comment Preview */}
      <TableCell className="max-w-[200px]">
        <p className="text-sm truncate text-muted-foreground">
          &ldquo;{campaign.custom_comment}&rdquo;
        </p>
      </TableCell>

      {/* Status */}
      <TableCell className="w-28">
        <Badge variant={statusInfo.variant}>
          {campaign.status === "in-progress" && (
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
          )}
          {statusInfo.label}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="w-12">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {campaign.status === "not-started" && (
              <DropdownMenuItem onClick={() => onAction("start", campaign)}>
                <Play className="mr-2 h-4 w-4" />
                Start Now
              </DropdownMenuItem>
            )}
            {campaign.status === "in-progress" && (
              <DropdownMenuItem onClick={() => onAction("pause", campaign)}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onAction("edit", campaign)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAction("delete", campaign)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </tr>
  )
}

interface CampaignQueueTableProps {
  campaigns?: CommentCampaign[]
  onReorder?: (campaigns: CommentCampaign[]) => void
  onAction?: (action: string, campaign: CommentCampaign) => void
}

// Demo data for development - remove in production
const demoCampaigns: CommentCampaign[] = [
  {
    id: "1",
    campaign_id: "campaign_abc12345_1702475982",
    custom_comment: "Great content! 🔥",
    platform: "instagram",
    user_accounts: ["@myaccount1", "@myaccount2"],
    target_profiles: ["@hypebeastkicks", "@sneakerhead"],
    targeting_mode: "date",
    target_date: "2025-12-12",
    number_of_posts: null,
    status: "in-progress",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    campaign_id: "campaign_def67890_1702475983",
    custom_comment: "Love this! 💯",
    platform: "tiktok",
    user_accounts: ["@tiktokuser"],
    target_profiles: ["@fashionpage", "@styleinspo", "@outfitcheck"],
    targeting_mode: "posts",
    target_date: null,
    number_of_posts: 10,
    status: "not-started",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    campaign_id: "campaign_ghi11223_1702475984",
    custom_comment: "So cool!",
    platform: "instagram",
    user_accounts: ["@another_account"],
    target_profiles: ["@techreviews"],
    targeting_mode: "posts",
    target_date: null,
    number_of_posts: 5,
    status: "not-started",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    campaign_id: "campaign_jkl44556_1702475985",
    custom_comment: "This is amazing content!",
    platform: "x",
    user_accounts: ["@xuser"],
    target_profiles: ["@elonmusk", "@twitter"],
    targeting_mode: "date",
    target_date: "2025-12-10",
    number_of_posts: null,
    status: "not-started",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    campaign_id: "campaign_mno77889_1702475986",
    custom_comment: "Incredible thread! 🧵",
    platform: "threads",
    user_accounts: ["@threadsuser"],
    target_profiles: ["@meta"],
    targeting_mode: "posts",
    target_date: null,
    number_of_posts: 8,
    status: "completed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function CampaignQueueTable({ 
  campaigns = demoCampaigns, 
  onReorder,
  onAction 
}: CampaignQueueTableProps) {
  const [items, setItems] = useState<CommentCampaign[]>(campaigns)
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter and sort campaigns
  const filteredItems = useMemo(() => {
    let filtered = items
    
    // Apply platform filter
    if (platformFilter !== "all") {
      filtered = items.filter((item) => item.platform === platformFilter)
    }
    
    // Sort: in-progress first, then not-started, then completed
    const statusOrder: Record<CampaignStatus, number> = {
      "in-progress": 0,
      "not-started": 1,
      "completed": 2,
    }
    
    return [...filtered].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
  }, [items, platformFilter])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.id === active.id)
        const newIndex = currentItems.findIndex((item) => item.id === over.id)
        
        const newOrder = arrayMove(currentItems, oldIndex, newIndex)
        onReorder?.(newOrder)
        return newOrder
      })
    }
  }

  const handleAction = (action: string, campaign: CommentCampaign) => {
    onAction?.(action, campaign)
    
    // Demo handling for status changes
    if (action === "start") {
      setItems((current) =>
        current.map((item) =>
          item.id === campaign.id ? { ...item, status: "in-progress" as CampaignStatus } : item
        )
      )
    } else if (action === "pause") {
      setItems((current) =>
        current.map((item) =>
          item.id === campaign.id ? { ...item, status: "not-started" as CampaignStatus } : item
        )
      )
    } else if (action === "delete") {
      setItems((current) => current.filter((item) => item.id !== campaign.id))
    }
  }

  const queuedCount = items.filter((i) => i.status === "not-started").length
  const runningCount = items.filter((i) => i.status === "in-progress").length

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                Campaign Queue
              </CardTitle>
            </div>
            <CardDescription className="mt-2">
              {queuedCount} queued · {runningCount} running
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={platformFilter}
              onValueChange={(value) => setPlatformFilter(value as Platform | "all")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="threads">Threads</SelectItem>
                <SelectItem value="x">X (Twitter)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-28">Platform</TableHead>
                <TableHead>Targets</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext
              items={filteredItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((campaign, index) => (
                    <SortableQueueItem
                      key={campaign.id}
                      campaign={campaign}
                      position={index + 1}
                      onAction={handleAction}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ListOrdered className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No campaigns in queue</p>
                        <p className="text-xs">Add a campaign to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
      </CardContent>
    </Card>
  )
}
