"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Loader2,
  Users,
  Search,
  X,
  Info
} from "lucide-react"
import { toast } from "sonner"
import { 
  SocialAccount, 
  SocialPlatform, 
  platformConfig,
  CreateSocialAccountInput 
} from "@/lib/types/social-account"
import {
  getAllSocialAccounts,
  createSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
  getAccountCountsByPlatform,
} from "@/lib/social-accounts-client"
import { ProtectedRoute } from "@/components/protected-route"

export default function AccountsSetupPage() {
  // State
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("instagram")
  const [platformCounts, setPlatformCounts] = useState<Record<SocialPlatform, number>>({
    instagram: 0,
    tiktok: 0,
    threads: 0,
    x: 0,
    facebook: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all")
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    platform: "instagram" as SocialPlatform,
    username: "",
    password: "",
    browser_profile: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await getAllSocialAccounts()
    
    if (error) {
      console.error("Error fetching accounts:", error)
      const errorMessage = getErrorMessage(error)
      toast.error("Failed to load accounts", {
        description: errorMessage,
        duration: 5000,
      })
    } else if (data) {
      setAccounts(data)
    }
    
    setIsLoading(false)
  }, [])

  const fetchPlatformCounts = async () => {
    const { data } = await getAccountCountsByPlatform()
    if (data) {
      setPlatformCounts(data)
    }
  }

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts()
    fetchPlatformCounts()
  }, [fetchAccounts])

  const getErrorMessage = (error: { code?: string; message?: string } | null): string => {
    // Handle PostgreSQL error codes
    if (error?.code === "23505") {
      // Unique constraint violation
      return "An account with this username already exists for this platform"
    }
    
    if (error?.code === "23502") {
      // Not null violation
      return "Required fields are missing. Please fill in all required information."
    }
    
    if (error?.code === "23514") {
      // Check constraint violation
      return "Invalid platform selected"
    }
    
    // Handle network/connection errors
    if (error?.message?.includes("fetch") || error?.message?.includes("network")) {
      return "Connection error. Please check your internet connection and try again."
    }
    
    // Handle authentication errors
    if (error?.message?.includes("JWT") || error?.message?.includes("auth")) {
      return "Authentication error. Please refresh the page and try again."
    }
    
    // Generic error with message
    if (error?.message) {
      return error.message
    }
    
    return "An unexpected error occurred. Please try again."
  }

  const resetForm = () => {
    setFormData({
      platform: selectedPlatform,
      username: "",
      password: "",
      browser_profile: "",
    })
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.username.trim()) {
      errors.username = "Username is required"
    }
    
    if (!formData.password.trim()) {
      errors.password = "Password is required"
    }
    
    if (!formData.browser_profile.trim()) {
      errors.browser_profile = "Browser profile is required"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddAccount = () => {
    resetForm()
    setFormData((prev) => ({ ...prev, platform: selectedPlatform }))
    setIsAddModalOpen(true)
  }

  const handleEditAccount = (account: SocialAccount) => {
    setSelectedAccount(account)
    setFormData({
      platform: account.platform,
      username: account.username,
      password: account.password,
      browser_profile: account.browser_profile || "",
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (account: SocialAccount) => {
    setSelectedAccount(account)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveNewAccount = async () => {
    if (!validateForm()) return
    
    setIsSaving(true)
    
    const input: CreateSocialAccountInput = {
      platform: formData.platform,
      username: formData.username.trim(),
      password: formData.password,
      browser_profile: formData.browser_profile.trim(),
    }
    
    const { error } = await createSocialAccount(input)
    
    if (error) {
      console.error("Error creating account:", error)
      const errorMessage = getErrorMessage(error)
      toast.error(errorMessage, {
        description: "Please check your input and try again.",
        duration: 5000,
      })
    } else {
      toast.success("Account created successfully!", {
        description: `@${input.username} on ${platformConfig[input.platform].label}`,
        duration: 3000,
      })
      setIsAddModalOpen(false)
      resetForm()
      fetchAccounts()
      fetchPlatformCounts()
    }
    
    setIsSaving(false)
  }

  const handleUpdateAccount = async () => {
    if (!validateForm() || !selectedAccount) return
    
    setIsSaving(true)
    
    const { error } = await updateSocialAccount(selectedAccount.id, {
      username: formData.username.trim(),
      password: formData.password,
      browser_profile: formData.browser_profile.trim(),
    })
    
    if (error) {
      console.error("Error updating account:", error)
      const errorMessage = getErrorMessage(error)
      toast.error(errorMessage, {
        description: "Your changes were not saved.",
        duration: 5000,
      })
    } else {
      toast.success("Account updated successfully!", {
        description: `@${formData.username} has been updated`,
        duration: 3000,
      })
      setIsEditModalOpen(false)
      fetchAccounts()
    }
    
    setIsSaving(false)
  }

  const handleConfirmDelete = async () => {
    if (!selectedAccount) return
    
    const { error } = await deleteSocialAccount(selectedAccount.id)
    
    if (error) {
      console.error("Error deleting account:", error)
      const errorMessage = getErrorMessage(error)
      toast.error(errorMessage, {
        description: "The account was not deleted.",
        duration: 5000,
      })
    } else {
      toast.success("Account deleted successfully", {
        description: `@${selectedAccount.username} has been removed`,
        duration: 3000,
      })
      setIsDeleteDialogOpen(false)
      setSelectedAccount(null)
      fetchAccounts()
      fetchPlatformCounts()
    }
  }

  // Platform sidebar items
  const platforms: SocialPlatform[] = ["instagram", "tiktok", "threads", "x", "facebook"]

  // Filter accounts based on search and active status
  const filterAccounts = (platformAccounts: SocialAccount[]) => {
    let filtered = platformAccounts

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(account => 
        account.username.toLowerCase().includes(query) ||
        account.browser_profile?.toLowerCase().includes(query)
      )
    }

    // Apply active/inactive filter
    if (activeFilter === "active") {
      filtered = filtered.filter(account => account.is_active)
    } else if (activeFilter === "inactive") {
      filtered = filtered.filter(account => !account.is_active)
    }

    return filtered
  }

  const renderAccountsList = (platformAccounts: SocialAccount[]) => {
    const filteredAccounts = filterAccounts(platformAccounts)
    
    return (
      <div className="space-y-3">
        {/* Search and Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as "all" | "active" | "inactive")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Accounts List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAccounts.length === 0 && platformAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No accounts configured</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Add your first account to get started
            </p>
            <Button 
              onClick={handleAddAccount}
              disabled={!platformConfig[selectedPlatform].enabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Configure New Account
            </Button>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No accounts found</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {searchQuery ? `No results for "${searchQuery}"` : "No accounts match the selected filter"}
            </p>
            {(searchQuery || activeFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setActiveFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {filteredAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-2.5 rounded-md border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">@{account.username}</p>
                      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                        {account.is_active ? (
                          <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                          </>
                        ) : (
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(account)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center bg-background p-4">
        <div className="w-full max-w-3xl space-y-6 mt-8">
          {/* Accounts Card with Tabs */}
          <Card className="w-full">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Social Media Accounts</CardTitle>
                  <CardDescription className="mt-2">
                    Manage your social media accounts for automation
                  </CardDescription>
                </div>
              <Button 
                onClick={handleAddAccount}
                disabled={!platformConfig[selectedPlatform].enabled}
              >
                <Plus className="h-4 w-4 mr-2" />
                Configure New Account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as SocialPlatform)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {platforms.filter(p => p !== 'facebook').map((platform) => {
                  const config = platformConfig[platform]
                  const count = platformCounts[platform]
                  
                  return (
                    <TabsTrigger 
                      key={platform} 
                      value={platform}
                      disabled={!config.enabled}
                      className="relative"
                    >
                      {config.label}
                      {count > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              {platforms.filter(p => p !== 'facebook').map((platform) => {
                const platformAccounts = accounts.filter(acc => acc.platform === platform)
                
                return (
                  <TabsContent key={platform} value={platform} className="mt-4">
                    {renderAccountsList(platformAccounts)}
                  </TabsContent>
                )
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        Built by AIVS, 2025
      </footer>

      {/* Add Account Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure New Account</DialogTitle>
            <DialogDescription>
              Add a new social media account for automation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Platform Select */}
            <div className="space-y-2">
              <Label htmlFor="platform">Social Media Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => 
                  setFormData((prev) => ({ ...prev, platform: value as SocialPlatform }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.filter(p => p !== 'facebook').map((platform) => (
                    <SelectItem 
                      key={platform} 
                      value={platform}
                      disabled={!platformConfig[platform].enabled}
                    >
                      {platformConfig[platform].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                className={formErrors.username ? "border-destructive" : ""}
              />
              {formErrors.username && (
                <p className="text-xs text-destructive">{formErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className={formErrors.password ? "border-destructive" : ""}
              />
              {formErrors.password && (
                <p className="text-xs text-destructive">{formErrors.password}</p>
              )}
            </div>

            {/* Browser Profile */}
            <div className="space-y-2">
              <Label htmlFor="browser_profile">Browser Profile</Label>
              <Input
                id="browser_profile"
                placeholder="Enter browser profile"
                value={formData.browser_profile}
                onChange={(e) => setFormData((prev) => ({ ...prev, browser_profile: e.target.value }))}
                className={formErrors.browser_profile ? "border-destructive" : ""}
              />
              {formErrors.browser_profile && (
                <p className="text-xs text-destructive">{formErrors.browser_profile}</p>
              )}
              <p className="text-xs text-muted-foreground">Assigned browser profile for automation</p>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewAccount} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update account details for @{selectedAccount?.username}
            </DialogDescription>
          </DialogHeader>
          
          {/* Inactive Account Warning */}
          {selectedAccount && !selectedAccount.is_active && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200">
              <Info className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">
                Manually resolve account before proceeding with it
              </p>
            </div>
          )}
          
          <div className="space-y-4 py-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                className={formErrors.username ? "border-destructive" : ""}
              />
              {formErrors.username && (
                <p className="text-xs text-destructive">{formErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className={formErrors.password ? "border-destructive" : ""}
              />
              {formErrors.password && (
                <p className="text-xs text-destructive">{formErrors.password}</p>
              )}
            </div>

            {/* Browser Profile */}
            <div className="space-y-2">
              <Label htmlFor="edit-browser_profile">Browser Profile</Label>
              <Input
                id="edit-browser_profile"
                placeholder="Enter browser profile"
                value={formData.browser_profile}
                onChange={(e) => setFormData((prev) => ({ ...prev, browser_profile: e.target.value }))}
                className={formErrors.browser_profile ? "border-destructive" : ""}
              />
              {formErrors.browser_profile && (
                <p className="text-xs text-destructive">{formErrors.browser_profile}</p>
              )}
              <p className="text-xs text-muted-foreground">Assigned browser profile for automation</p>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAccount} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete @{selectedAccount?.username}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </ProtectedRoute>
  )
}