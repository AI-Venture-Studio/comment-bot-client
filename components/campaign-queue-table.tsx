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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
  ListOrdered,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CommentCampaign, CampaignStatus, Platform } from "@/lib/types/campaign"

// Platform labels
const platformConfig: Record<Platform, { label: string }> = {
  instagram: { label: "Instagram" },
  tiktok: { label: "TikTok" },
  threads: { label: "Threads" },
  x: { label: "X (Twitter)" },
}

const statusConfig: Record<CampaignStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  "not-started": { label: "Queued", variant: "secondary" },
  "in-progress": { label: "Running", variant: "info" },
  "completed": { label: "Completed", variant: "success" },
}

interface QueueItemProps {
  campaign: CommentCampaign
  position: number
  onAction: (action: string, campaign: CommentCampaign) => void
  showDragHandle?: boolean
  showPosition?: boolean
}

function SortableQueueItem({ campaign, position, onAction, showDragHandle = true, showPosition = true }: QueueItemProps) {
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
        campaign.status === "in-progress" && "bg-green-50/50"
      )}
    >
      {/* Drag Handle */}
      {showDragHandle && (
        <TableCell className="w-8 px-1">
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
      )}

      {/* Position */}
      {showPosition && (
        <TableCell className="w-8 px-1 font-mono text-xs text-muted-foreground">
          #{position}
        </TableCell>
      )}

      {/* Platform */}
      <TableCell className="w-20">
        <div className="text-xs font-medium truncate">{platformInfo.label}</div>
      </TableCell>

      {/* Target Profiles */}
      <TableCell className="w-24">
        <div className="flex flex-wrap gap-0.5">
          {campaign.target_profiles.slice(0, 1).map((profile) => (
            <Badge key={profile} variant="outline" className="text-xs px-1 py-0">
              {profile}
            </Badge>
          ))}
          {campaign.target_profiles.length > 1 && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              +{campaign.target_profiles.length - 1}
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Comment Preview */}
      <TableCell className="flex-1 min-w-0">
        <p className="text-xs truncate text-muted-foreground">
          &ldquo;{campaign.custom_comment}&rdquo;
        </p>
      </TableCell>

      {/* Status */}
      <TableCell className="w-20">
        <Badge variant={statusInfo.variant} className="text-xs">
          {campaign.status === "in-progress" && (
            <span className="relative flex h-1.5 w-1.5 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
            </span>
          )}
          {statusInfo.label}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="w-8 px-1">
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
  campaigns: CommentCampaign[]
  onReorder: (campaigns: CommentCampaign[]) => void
  onAction: (action: string, campaign: CommentCampaign) => void
  onRefresh?: () => void | Promise<void>
}

export function CampaignQueueTable({ 
  campaigns, 
  onReorder,
  onAction,
  onRefresh
}: CampaignQueueTableProps) {
  const [items, setItems] = useState<CommentCampaign[]>(campaigns)
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleRefresh = async () => {
    if (!onRefresh) return
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filter campaigns by status
  const queuedCampaigns = useMemo(() => {
    // Only show not-started campaigns in the queued tab
    let filtered = items.filter((item) => item.status === "not-started")
    
    // Apply platform filter
    if (platformFilter !== "all") {
      filtered = filtered.filter((item) => item.platform === platformFilter)
    }
    
    return filtered
  }, [items, platformFilter])

  const completedCampaigns = useMemo(() => {
    let filtered = items.filter((item) => item.status === "completed")
    
    // Apply platform filter
    if (platformFilter !== "all") {
      filtered = filtered.filter((item) => item.platform === platformFilter)
    }
    
    // Sort by most recent first (descending order)
    return filtered.sort((a, b) => {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return dateB - dateA
    })
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
  const completedCount = items.filter((i) => i.status === "completed").length

  const renderTable = (campaigns: CommentCampaign[], isDraggable = true) => {
    const content = (
      <Table className="text-sm">
        <TableHeader>
          <TableRow>
            {isDraggable && <TableHead className="w-8"></TableHead>}
            {isDraggable && <TableHead className="w-8">#</TableHead>}
            <TableHead className="w-20">Platform</TableHead>
            <TableHead className="w-24">Targets</TableHead>
            <TableHead className="flex-1 min-w-0">Comment</TableHead>
            <TableHead className="w-20">Status</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <SortableContext
          items={campaigns.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <TableBody>
            {campaigns.length > 0 ? (
              campaigns.map((campaign, index) => (
                <SortableQueueItem
                  key={campaign.id}
                  campaign={campaign}
                  position={index + 1}
                  onAction={handleAction}
                  showDragHandle={isDraggable}
                  showPosition={isDraggable}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isDraggable ? 7 : 5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <ListOrdered className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No campaigns found</p>
                    <p className="text-xs">Add a campaign to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </SortableContext>
      </Table>
    )

    if (isDraggable) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {content}
        </DndContext>
      )
    }

    return content
  }

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
              {queuedCount} queued · {runningCount} running · {completedCount} completed
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh campaigns"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
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
                <SelectItem value="tiktok" disabled>TikTok</SelectItem>
                <SelectItem value="threads" disabled>Threads</SelectItem>
                <SelectItem value="x" disabled>X (Twitter)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="queued" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="queued">
              Queued ({queuedCampaigns.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedCampaigns.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="queued" className="mt-4">
            {renderTable(queuedCampaigns, true)}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            {renderTable(completedCampaigns, false)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
