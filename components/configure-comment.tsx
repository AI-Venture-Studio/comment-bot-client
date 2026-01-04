"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { CalendarIcon, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import { getActiveAccountsForPlatform } from "@/lib/social-accounts-client"
import type { SocialAccount, SocialPlatform } from "@/lib/types/social-account"

type Platform = "instagram" | "tiktok" | "threads" | "x"
type TargetingMode = "date" | "posts"
type CampaignStatus = "not-started" | "in-progress" | "completed"

interface CampaignConfig {
  customComment: string
  platform: Platform | ""
  userAccounts: string[]
  targetProfiles: string[]
  targetingMode: TargetingMode
  targetDate?: Date
  numberOfPosts?: number
  postDelay: number  // Time between comments in seconds (8-20)
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export function ConfigureComment() {
  const [config, setConfig] = useState<CampaignConfig>({
    customComment: "",
    platform: "",
    userAccounts: [],
    targetProfiles: [],
    targetingMode: "posts",
    numberOfPosts: 5,
    postDelay: 15,  // Default 15 seconds between comments
  })

  const [currentUserAccount, setCurrentUserAccount] = useState("")
  const [currentTargetProfile, setCurrentTargetProfile] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [availableAccounts, setAvailableAccounts] = useState<Pick<SocialAccount, "id" | "username" | "is_active">[]>([])
  const [accountSearchQuery, setAccountSearchQuery] = useState("")
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)

  const platforms: { id: Platform; label: string }[] = [
    { id: "instagram", label: "Instagram" },
    { id: "tiktok", label: "TikTok" },
    { id: "threads", label: "Threads" },
    { id: "x", label: "X (Twitter)" },
  ]

  // Load saved form state from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('campaignConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        // Convert targetDate string back to Date object if present
        if (parsed.targetDate) {
          parsed.targetDate = new Date(parsed.targetDate)
        }
        setConfig(parsed)
      } catch (error) {
        console.error('Error loading saved config:', error)
      }
    }
  }, [])

  // Save form state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('campaignConfig', JSON.stringify(config))
  }, [config])

  // Fetch available accounts when platform changes
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!config.platform) {
        setAvailableAccounts([])
        return
      }

      setIsLoadingAccounts(true)
      const { data, error } = await getActiveAccountsForPlatform(config.platform as SocialPlatform)
      
      if (error) {
        console.error("Error fetching accounts:", error)
        toast.error("Failed to load accounts for this platform")
        setAvailableAccounts([])
      } else if (data) {
        setAvailableAccounts(data)
      }
      
      setIsLoadingAccounts(false)
    }

    fetchAccounts()
  }, [config.platform])

  const addUserAccount = (username?: string) => {
    const accountToAdd = username || currentUserAccount.trim()
    if (accountToAdd && !config.userAccounts.includes(accountToAdd)) {
      setConfig((prev) => ({
        ...prev,
        userAccounts: [...prev.userAccounts, accountToAdd],
      }))
      setCurrentUserAccount("")
      setAccountSearchQuery("")
      setAccountDropdownOpen(false)
    }
  }

  const removeUserAccount = (account: string) => {
    setConfig((prev) => ({
      ...prev,
      userAccounts: prev.userAccounts.filter((a) => a !== account),
    }))
  }

  const addTargetProfile = () => {
    if (config.targetProfiles.length >= 5) {
      toast.error("Maximum of 5 target profiles allowed")
      return
    }
    
    if (currentTargetProfile.trim() && !config.targetProfiles.includes(currentTargetProfile.trim())) {
      setConfig((prev) => ({
        ...prev,
        targetProfiles: [...prev.targetProfiles, currentTargetProfile.trim()],
      }))
      setCurrentTargetProfile("")
      
      // Show success message with remaining slots
      const remaining = 5 - config.targetProfiles.length - 1
      if (remaining > 0) {
        toast.success(`Target added (${remaining} slot${remaining !== 1 ? 's' : ''} remaining)`)
      } else {
        toast.success("Target added (maximum reached)")
      }
    }
  }

  const removeTargetProfile = (profile: string) => {
    setConfig((prev) => ({
      ...prev,
      targetProfiles: prev.targetProfiles.filter((p) => p !== profile),
    }))
  }

  const getPlatformLabel = (platformId: Platform | "") => {
    if (!platformId) return ""
    const platform = platforms.find((p) => p.id === platformId)
    return platform?.label || ""
  }

  const isFormComplete = () => {
    const hasComment = config.customComment.trim().length > 0
    const hasPlatform = config.platform !== ""
    const hasUserAccounts = config.userAccounts.length > 0
    const hasTargets = config.targetProfiles.length > 0
    const hasValidTargeting = 
      (config.targetingMode === "posts" && config.numberOfPosts && config.numberOfPosts > 0) ||
      (config.targetingMode === "date" && config.targetDate !== undefined)
    
    return hasComment && hasPlatform && hasUserAccounts && hasTargets && hasValidTargeting
  }

  const getActionSummary = () => {
    const comment = config.customComment.length > 40 
      ? config.customComment.slice(0, 40) + "..." 
      : config.customComment
    
    const targets = config.targetProfiles.map(p => `@${p}`).join(", ")
    const platform = getPlatformLabel(config.platform)
    
    let targeting = ""
    if (config.targetingMode === "posts") {
      targeting = `latest ${config.numberOfPosts} ${config.numberOfPosts === 1 ? 'post' : 'posts'}`
    } else if (config.targetDate) {
      targeting = `posts from ${format(config.targetDate, "MMM d, yyyy")} to now`
    }

    return { comment, targets, platform, targeting }
  }

  const handleAddToQueue = async () => {
    // Validation
    if (!config.customComment.trim()) {
      toast.error("Please enter a custom comment")
      return
    }

    if (!config.platform) {
      toast.error("Please select a platform")
      return
    }

    if (config.userAccounts.length === 0) {
      toast.error("Please add at least one user account")
      return
    }

    if (config.targetProfiles.length === 0) {
      toast.error("Please add at least one target profile")
      return
    }

    if (config.targetingMode === "date" && !config.targetDate) {
      toast.error("Please select a target date")
      return
    }

    if (config.targetingMode === "posts" && (!config.numberOfPosts || config.numberOfPosts < 1)) {
      toast.error("Please enter a valid number of posts")
      return
    }

    setIsSaving(true)

    try {
      // Generate a unique campaign ID
      const campaignId = `campaign_${uuidv4().substring(0, 8)}_${Date.now()}`

      // Prepare data for Supabase
      const campaignData = {
        campaign_id: campaignId,
        custom_comment: config.customComment,
        platform: config.platform,
        user_accounts: config.userAccounts,
        target_profiles: config.targetProfiles,
        targeting_mode: config.targetingMode,
        target_date: config.targetingMode === "date" ? config.targetDate?.toISOString() : null,
        number_of_posts: config.targetingMode === "posts" ? config.numberOfPosts : null,
        post_delay: config.postDelay,  // Save user-configured delay
        status: "not-started" as CampaignStatus,
      }

      // Save to Supabase
      const { error } = await supabase
        .from("comment_campaigns")
        .insert([campaignData])
        .select()

      if (error) {
        console.error("Supabase error:", error)
        toast.error(`Failed to save campaign: ${error.message}`)
        return
      }

      toast.success(`Comment Campaign saved successfully!`)

      // Reset form after successful save
      const resetConfig = {
        customComment: "",
        platform: "" as Platform | "",
        userAccounts: [],
        targetProfiles: [],
        targetingMode: "posts" as TargetingMode,
        numberOfPosts: 5,
        postDelay: 15,  // Reset to default
      }
      setConfig(resetConfig)
      localStorage.removeItem('campaignConfig')
    } catch (error) {
      console.error("Error saving campaign:", error)
      toast.error("Failed to save campaign. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <CardTitle>Configure Comment Campaign</CardTitle>
        </div>
        <CardDescription>
          Set up your automated commenting campaign across social media platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Custom Comment */}
        <div className="space-y-2">
          <Label htmlFor="custom-comment">Custom Comment</Label>
          <Textarea
            id="custom-comment"
            placeholder="Enter the comment you want to post on targeted profiles..."
            className="min-h-[100px] resize-none"
            value={config.customComment}
            onChange={(e) => setConfig((prev) => ({ ...prev, customComment: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            {config.customComment.length} characters
          </p>
        </div>

        <Separator />

        {/* Time Between Comments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="post-delay" className="text-base font-medium">
                Time Between Comments
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Delay applied between commenting on posts (randomized ±20%)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="post-delay"
                type="number"
                min="8"
                max="20"
                value={config.postDelay}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 15
                  const clamped = Math.max(8, Math.min(20, value))
                  setConfig((prev) => ({ ...prev, postDelay: clamped }))
                }}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">seconds</span>
            </div>
          </div>
          <Slider
            value={[config.postDelay]}
            onValueChange={([value]) => setConfig((prev) => ({ ...prev, postDelay: value }))}
            min={8}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Faster (8s)</span>
            <span>Safer (20s)</span>
          </div>
        </div>

        <Separator />

        {/* Campaign Platform & Post Targeting side by side */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6">
          {/* Campaign Platform */}
          <div className="space-y-3">
            <Label>Campaign Platform</Label>
            <Select
              value={config.platform}
              onValueChange={(value) => setConfig((prev) => ({ ...prev, platform: value as Platform }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => (
                  <SelectItem 
                    key={platform.id} 
                    value={platform.id}
                    disabled={platform.id !== "instagram"}
                  >
                    {platform.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vertical Separator */}
          <div className="hidden md:flex items-center">
            <Separator orientation="vertical" className="h-full" />
          </div>

          {/* Post Targeting Method */}
          <div className="space-y-3">
            <Label>Post Targeting Method</Label>
            <RadioGroup
              value={config.targetingMode}
              onValueChange={(value) =>
                setConfig((prev) => ({ ...prev, targetingMode: value as TargetingMode }))
              }
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="posts" id="posts" className="mt-1" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="posts" className="cursor-pointer font-normal">
                      Target by Number of Posts
                    </Label>
                    {config.targetingMode === "posts" && (
                      <Input
                        type="number"
                        min="1"
                        placeholder="Number of posts"
                        value={config.numberOfPosts || ""}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            numberOfPosts: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="max-w-[150px]"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="date" id="date" className="mt-1" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="date" className="cursor-pointer font-normal">
                      Target posts from date to now
                    </Label>
                    {config.targetingMode === "date" && (
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full max-w-[200px] justify-start text-left font-normal",
                              !config.targetDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {config.targetDate ? format(config.targetDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={config.targetDate}
                            onSelect={(date) => {
                              setConfig((prev) => ({ ...prev, targetDate: date }))
                              setDatePickerOpen(false)
                            }}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        <Separator />

        {/* User Accounts */}
        <div className="space-y-3">
          <Label htmlFor="user-account">Your User Accounts</Label>
          <p className="text-xs text-muted-foreground">
            {config.platform 
              ? `Search and select ${platforms.find(p => p.id === config.platform)?.label} accounts from your saved accounts`
              : "Select a platform first to choose accounts"
            }
          </p>
          <Popover open={accountDropdownOpen} onOpenChange={setAccountDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                disabled={!config.platform || isLoadingAccounts}
              >
                <span className="text-muted-foreground">
                  {isLoadingAccounts 
                    ? "Loading accounts..." 
                    : !config.platform
                    ? "Select a platform first"
                    : availableAccounts.length === 0
                    ? "No accounts available - add accounts first"
                    : "Search and select account"}
                </span>
                <Search className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search accounts..."
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="max-h-[200px] overflow-y-auto p-1">
                {availableAccounts
                  .filter((account) =>
                    account.username.toLowerCase().includes(accountSearchQuery.toLowerCase())
                  )
                  .filter((account) => !config.userAccounts.includes(account.username))
                  .map((account) => (
                    <button
                      key={account.id}
                      onClick={() => addUserAccount(account.username)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-sm transition-colors"
                    >
                      @{account.username}
                    </button>
                  ))}
                {availableAccounts.filter(
                  (account) =>
                    account.username.toLowerCase().includes(accountSearchQuery.toLowerCase()) &&
                    !config.userAccounts.includes(account.username)
                ).length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {accountSearchQuery
                      ? "No accounts found matching your search"
                      : config.userAccounts.length === availableAccounts.length
                      ? "All accounts already selected"
                      : "No accounts available"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {config.userAccounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.userAccounts.map((account) => {
                const accountData = availableAccounts.find(a => a.username === account)
                const isActive = accountData?.is_active ?? true
                return (
                  <Badge 
                    key={account} 
                    className={cn(
                      "gap-1",
                      isActive 
                        ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-300" 
                        : "bg-red-100 text-red-800 hover:bg-red-200 border-red-300"
                    )}
                  >
                    @{account}
                    <button
                      type="button"
                      onClick={() => removeUserAccount(account)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Target Profiles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="target-profile">Target Profiles</Label>
            <span className="text-xs text-muted-foreground">
              {config.targetProfiles.length}/5 profiles
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              id="target-profile"
              placeholder="Enter target username or profile"
              value={currentTargetProfile}
              onChange={(e) => setCurrentTargetProfile(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addTargetProfile()
                }
              }}
              disabled={config.targetProfiles.length >= 5}
            />
            <Button 
              type="button" 
              onClick={addTargetProfile} 
              variant="secondary"
              disabled={config.targetProfiles.length >= 5}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {config.targetProfiles.length >= 5 && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Maximum limit reached. Remove a profile to add another.
            </p>
          )}
          {config.targetProfiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.targetProfiles.map((profile) => (
                <Badge key={profile} variant="default" className="gap-1">
                  @{profile}
                  <button
                    type="button"
                    onClick={() => removeTargetProfile(profile)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Action Summary - Only show when form is complete */}
        {isFormComplete() && (
          <div className="rounded-lg border bg-primary/5 border-primary/20 p-4 space-y-2">
            <p className="text-xs font-medium text-primary uppercase tracking-wide">Comment Campaign Summary</p>
            <div className="space-y-1.5">
              {(() => {
                const summary = getActionSummary()
                return (
                  <>
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted-foreground min-w-[80px]">Comment:</span>
                      <span className="font-medium">&ldquo;{summary.comment}&rdquo;</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted-foreground min-w-[80px]">Platform:</span>
                      <span className="font-medium">{summary.platform}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted-foreground min-w-[80px]">Targets:</span>
                      <span className="font-medium">{summary.targets}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted-foreground min-w-[80px]">Posts:</span>
                      <span className="font-medium">{summary.targeting}</span>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const resetConfig = {
                customComment: "",
                platform: "" as Platform | "",
                userAccounts: [],
                targetProfiles: [],
                targetingMode: "posts" as TargetingMode,
                numberOfPosts: 5,
                postDelay: 15,  // Reset to default
              }
              setConfig(resetConfig)
              localStorage.removeItem('campaignConfig')
              toast.info("Form cleared")
            }}
          >
            Clear
          </Button>
          <Button onClick={handleAddToQueue} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="mr-2">Adding...</span>
                <span className="animate-spin">⏳</span>
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add to Queue
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
