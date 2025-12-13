"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { ScrapingJob } from "@/types/scraping-jobs"

/**
 * BaseContext Interface
 * 
 * Provides access to the current active scraping job and its base_id
 * for multi-tenant data isolation across the application.
 */
interface BaseContextType {
  /** The currently active scraping job */
  activeJob: ScrapingJob | null
  
  /** The base_id from the active scraping job (source of truth) */
  baseId: string | null
  
  /** The Airtable base ID from the active scraping job */
  airtableBaseId: string | null
  
  /** Whether the context is currently loading data from Supabase */
  isLoading: boolean
  
  /** Any error that occurred while fetching the active job */
  error: string | null
  
  /** Manually refresh the active job from Supabase */
  refreshActiveJob: () => Promise<void>
  
  /** Set a specific job as active by job_id */
  setActiveJobById: (jobId: string) => Promise<void>
  
  /** Clear the active job (useful for page state reset) */
  clearActiveJob: () => void
}

const BaseContext = createContext<BaseContextType | undefined>(undefined)

/**
 * BaseProvider Component
 * 
 * Fetches the active scraping job from Supabase on mount and provides
 * the base_id to all child components. This ensures base_id is always
 * fetched from the database, never hardcoded or cached locally.
 * 
 * The active job is determined by:
 * 1. A job with status='active' (preferred)
 * 2. The most recently created job if no active job exists
 */
export function BaseProvider({ children }: { children: React.ReactNode }) {
  const [activeJob, setActiveJob] = useState<ScrapingJob | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch the active scraping job from Supabase
   * 
   * Priority:
   * 1. Job where status = 'active'
   * 2. Most recent job (fallback)
   */
  const fetchActiveJob = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First, try to get an active job
      const { data: activeJobs, error: activeError } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (activeError) {
        throw new Error(`Failed to fetch active job: ${activeError.message}`)
      }

      if (activeJobs && activeJobs.length > 0) {
        setActiveJob(activeJobs[0])
        console.log('[BaseContext] Active job loaded:', {
          job_id: activeJobs[0].job_id,
          base_id: activeJobs[0].base_id,
          influencer: activeJobs[0].influencer_name,
          platform: activeJobs[0].platform
        })
        setIsLoading(false)
        return
      }

      // Fallback: get the most recent job
      const { data: recentJobs, error: recentError } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      if (recentError) {
        throw new Error(`Failed to fetch recent job: ${recentError.message}`)
      }

      if (recentJobs && recentJobs.length > 0) {
        setActiveJob(recentJobs[0])
        console.log('[BaseContext] Most recent job loaded as fallback:', {
          job_id: recentJobs[0].job_id,
          base_id: recentJobs[0].base_id,
          influencer: recentJobs[0].influencer_name,
          platform: recentJobs[0].platform
        })
      } else {
        console.warn('[BaseContext] No scraping jobs found in database')
        setActiveJob(null)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching active job'
      console.error('[BaseContext] Error:', errorMessage)
      setError(errorMessage)
      setActiveJob(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Set a specific job as active by job_id
   */
  const setActiveJobById = useCallback(async (jobId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('job_id', jobId)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch job: ${fetchError.message}`)
      }

      if (data) {
        setActiveJob(data)
        console.log('[BaseContext] Job set as active:', {
          job_id: data.job_id,
          base_id: data.base_id,
          influencer: data.influencer_name,
          platform: data.platform
        })
      } else {
        throw new Error(`Job not found: ${jobId}`)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error setting active job'
      console.error('[BaseContext] Error:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Clear the active job - useful for page state reset
   */
  const clearActiveJob = useCallback(() => {
    console.log('[BaseContext] Clearing active job')
    setActiveJob(null)
    setError(null)
  }, [])

  // Fetch active job on mount
  useEffect(() => {
    fetchActiveJob()
  }, [fetchActiveJob])

  // Subscribe to changes in scraping_jobs table
  useEffect(() => {
    const channel = supabase
      .channel('scraping_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scraping_jobs'
        },
        (payload) => {
          console.log('[BaseContext] Scraping job changed:', payload)
          // Refresh active job when any job is modified
          fetchActiveJob()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchActiveJob])

  return (
    <BaseContext.Provider
      value={{
        activeJob,
        baseId: activeJob?.base_id || null,
        airtableBaseId: activeJob?.airtable_base_id || null,
        isLoading,
        error,
        refreshActiveJob: fetchActiveJob,
        setActiveJobById,
        clearActiveJob
      }}
    >
      {children}
    </BaseContext.Provider>
  )
}

/**
 * useBase Hook
 * 
 * Access the current base_id and active job from context.
 * 
 * @throws Error if used outside of BaseProvider
 * 
 * @example
 * const { baseId, activeJob, isLoading } = useBase()
 * 
 * if (isLoading) return <Spinner />
 * if (!baseId) return <Error message="No active job" />
 * 
 * // Use baseId in API calls
 * fetchData(baseId)
 */
export function useBase() {
  const context = useContext(BaseContext)
  if (context === undefined) {
    throw new Error("useBase must be used within a BaseProvider")
  }
  return context
}
