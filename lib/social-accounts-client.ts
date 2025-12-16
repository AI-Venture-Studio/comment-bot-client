import { createClient } from "@supabase/supabase-js"
import type { 
  SocialAccount, 
  SocialPlatform, 
  CreateSocialAccountInput, 
  UpdateSocialAccountInput 
} from "./types/social-account"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Get all social accounts
 */
export async function getAllSocialAccounts() {
  try {
    const { data, error } = await supabase
      .from("social_accounts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data as SocialAccount[], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get social accounts by platform
 */
export async function getSocialAccountsByPlatform(platform: SocialPlatform) {
  try {
    const { data, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("platform", platform)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data as SocialAccount[], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get a single social account by ID
 */
export async function getSocialAccountById(id: string) {
  try {
    const { data, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error
    return { data: data as SocialAccount, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Create a new social account
 */
export async function createSocialAccount(input: CreateSocialAccountInput) {
  try {
    const { data, error } = await supabase
      .from("social_accounts")
      .insert({
        platform: input.platform,
        username: input.username,
        password: input.password,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return { data: data as SocialAccount, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Update a social account
 */
export async function updateSocialAccount(id: string, input: UpdateSocialAccountInput) {
  try {
    const { data, error } = await supabase
      .from("social_accounts")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return { data: data as SocialAccount, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Delete a social account
 */
export async function deleteSocialAccount(id: string) {
  try {
    const { error } = await supabase
      .from("social_accounts")
      .delete()
      .eq("id", id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Get account counts by platform
 */
export async function getAccountCountsByPlatform() {
  try {
    const platforms: SocialPlatform[] = ["instagram", "tiktok", "threads", "x", "facebook"]
    const counts: Record<SocialPlatform, number> = {
      instagram: 0,
      tiktok: 0,
      threads: 0,
      x: 0,
      facebook: 0,
    }

    for (const platform of platforms) {
      const { count, error } = await supabase
        .from("social_accounts")
        .select("*", { count: "exact", head: true })
        .eq("platform", platform)

      if (!error && count !== null) {
        counts[platform] = count
      }
    }

    return { data: counts, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get active accounts for a platform (for use in campaigns)
 */
export async function getActiveAccountsForPlatform(platform: SocialPlatform) {
  try {
    const { data, error } = await supabase
      .from("social_accounts")
      .select("id, username")
      .eq("platform", platform)
      .eq("is_active", true)
      .order("username", { ascending: true })

    if (error) throw error
    return { data: data as Pick<SocialAccount, "id" | "username">[], error: null }
  } catch (error) {
    return { data: null, error }
  }
}
