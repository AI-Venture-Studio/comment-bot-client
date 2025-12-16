import { createClient } from "@supabase/supabase-js"
import type { CommentCampaign, CampaignStatus } from "./types/campaign"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Fetch all comment campaigns
 */
export async function getAllCampaigns() {
  try {
    const { data, error } = await supabase
      .from("comment_campaigns")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data as CommentCampaign[], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Fetch a single campaign by campaign_id
 */
export async function getCampaignById(campaignId: string) {
  try {
    const { data, error } = await supabase
      .from("comment_campaigns")
      .select("*")
      .eq("campaign_id", campaignId)
      .single()

    if (error) throw error
    return { data: data as CommentCampaign, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Fetch campaigns by status
 */
export async function getCampaignsByStatus(status: CampaignStatus) {
  try {
    const { data, error } = await supabase
      .from("comment_campaigns")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data as CommentCampaign[], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: string,
  status: CampaignStatus
) {
  try {
    const { data, error } = await supabase
      .from("comment_campaigns")
      .update({ status })
      .eq("campaign_id", campaignId)
      .select()

    if (error) throw error
    return { data: data as CommentCampaign[], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(campaignId: string) {
  try {
    const { error } = await supabase
      .from("comment_campaigns")
      .delete()
      .eq("campaign_id", campaignId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Get campaigns count by status
 */
export async function getCampaignsCountByStatus() {
  try {
    const statuses: CampaignStatus[] = ["not-started", "in-progress", "completed"]
    const counts: Record<CampaignStatus, number> = {
      "not-started": 0,
      "in-progress": 0,
      completed: 0,
    }

    for (const status of statuses) {
      const { count, error } = await supabase
        .from("comment_campaigns")
        .select("*", { count: "exact", head: true })
        .eq("status", status)

      if (!error && count !== null) {
        counts[status] = count
      }
    }

    return { data: counts, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get recent campaigns (last N days)
 */
export async function getRecentCampaigns(days: number = 7) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from("comment_campaigns")
      .select("*")
      .gte("created_at", cutoffDate.toISOString())
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data as CommentCampaign[], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get campaigns by platform
 */
export async function getCampaignsByPlatform(platform: string) {
  try {
    const { data, error } = await supabase
      .from("comment_campaigns")
      .select("*")
      .eq("platform", platform)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data as CommentCampaign[], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Search campaigns by custom comment text
 */
export async function searchCampaignsByComment(searchText: string) {
  try {
    const { data, error } = await supabase
      .from("comment_campaigns")
      .select("*")
      .ilike("custom_comment", `%${searchText}%`)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data as CommentCampaign[], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get campaigns ordered by queue position
 */
export async function getCampaignsOrderedByQueue() {
  try {
    const { data, error } = await supabase
      .from("comment_campaigns")
      .select("*")
      .order("queue_position", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data as CommentCampaign[], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Update queue positions for multiple campaigns
 */
export async function updateQueuePositions(
  campaigns: { id: string; queue_position: number }[]
) {
  try {
    const updates = campaigns.map(({ id, queue_position }) =>
      supabase
        .from("comment_campaigns")
        .update({ queue_position, updated_at: new Date().toISOString() })
        .eq("id", id)
    )

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r.error)
    
    if (errors.length > 0) {
      throw errors[0].error
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Get the currently running campaign (if any)
 */
export async function getActiveCampaign() {
  try {
    const { data, error } = await supabase
      .from("comment_campaigns")
      .select("*")
      .eq("status", "in-progress")
      .order("queue_position", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { data: data as CommentCampaign | null, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
