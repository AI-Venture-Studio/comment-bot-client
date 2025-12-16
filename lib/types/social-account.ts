export type SocialPlatform = "instagram" | "tiktok" | "threads" | "x" | "facebook"

export interface SocialAccount {
  id: string
  platform: SocialPlatform
  username: string
  password: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateSocialAccountInput {
  platform: SocialPlatform
  username: string
  password: string
}

export interface UpdateSocialAccountInput {
  username?: string
  password?: string
  is_active?: boolean
}

export const platformConfig: Record<SocialPlatform, { 
  label: string
  enabled: boolean
}> = {
  instagram: { 
    label: "Instagram", 
    enabled: true 
  },
  tiktok: { 
    label: "TikTok", 
    enabled: false 
  },
  threads: { 
    label: "Threads", 
    enabled: false 
  },
  x: { 
    label: "X (Twitter)", 
    enabled: false 
  },
  facebook: { 
    label: "Facebook", 
    enabled: false 
  },
}
