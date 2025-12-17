'use client';

import { useEffect, useState } from "react"
import { CampaignProgress } from "@/components/campaign-progress"
import { CampaignQueueTable } from "@/components/campaign-queue-table"
import { CommentCampaign } from "@/lib/types/campaign"
import { 
  getCampaignsOrderedByQueue, 
  updateQueuePositions,
  updateCampaignStatus,
  deleteCampaign 
} from "@/lib/supabase-client"
import { toast } from "sonner"

export default function QueuePage() {
  const [campaigns, setCampaigns] = useState<CommentCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setIsLoading(true)
    const { data, error } = await getCampaignsOrderedByQueue()
    
    if (error) {
      console.error("Error fetching campaigns:", error)
      toast.error("Failed to load campaigns")
    } else if (data) {
      setCampaigns(data)
    }
    
    setIsLoading(false)
  }

  const handleReorder = async (reorderedCampaigns: CommentCampaign[]) => {
    // Update local state immediately for responsive UI
    setCampaigns(reorderedCampaigns)

    // Prepare position updates
    const positionUpdates = reorderedCampaigns.map((campaign, index) => ({
      id: campaign.id,
      queue_position: index + 1,
    }))

    // Update in database
    const { error } = await updateQueuePositions(positionUpdates)
    
    if (error) {
      console.error("Error updating queue positions:", error)
      toast.error("Failed to save queue order")
      // Revert to previous state by refetching
      fetchCampaigns()
    } else {
      toast.success("Queue order updated")
    }
  }

  const handleAction = async (action: string, campaign: CommentCampaign) => {
    switch (action) {
      case "start":
        const { error: startError } = await updateCampaignStatus(campaign.campaign_id, "in-progress")
        if (startError) {
          toast.error("Failed to start campaign")
        } else {
          toast.success("Campaign started")
          fetchCampaigns()
        }
        break

      case "pause":
        const { error: pauseError } = await updateCampaignStatus(campaign.campaign_id, "not-started")
        if (pauseError) {
          toast.error("Failed to pause campaign")
        } else {
          toast.success("Campaign paused")
          fetchCampaigns()
        }
        break

      case "delete":
        const { error: deleteError } = await deleteCampaign(campaign.campaign_id)
        if (deleteError) {
          toast.error("Failed to delete campaign")
        } else {
          toast.success("Campaign deleted")
          fetchCampaigns()
        }
        break

      case "edit":
        toast.info("Edit functionality coming soon")
        break

      default:
        break
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4">
      <div className="w-full max-w-3xl space-y-6 mt-8">
        {/* Live Campaign Progress */}
        <CampaignProgress />
        
        {/* Campaign Queue Table */}
        <CampaignQueueTable 
          campaigns={campaigns}
          onReorder={handleReorder}
          onAction={handleAction}
          onRefresh={fetchCampaigns}
        />
      </div>
      
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        Built by AIVS, 2025
      </footer>
    </div>
  );
}