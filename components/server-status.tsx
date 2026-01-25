'use client';

import { useEffect, useState } from "react"
import { checkServerConnection, getApiUrl } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ServerStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkStatus = async () => {
    setStatus('checking')
    const { connected } = await checkServerConnection()
    setStatus(connected ? 'connected' : 'disconnected')
    setLastChecked(new Date())
  }

  useEffect(() => {
    checkStatus()
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Server Connected'
      case 'disconnected':
        return 'Server Disconnected'
      default:
        return 'Checking...'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4" />
      case 'disconnected':
        return <XCircle className="h-4 w-4" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2 flex-1">
        <Badge 
          variant={status === 'connected' ? 'default' : 'destructive'}
          className="flex items-center gap-1.5"
        >
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        
        <span className="text-xs text-muted-foreground">
          {getApiUrl()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {lastChecked && (
          <span className="text-xs text-muted-foreground">
            Last checked: {lastChecked.toLocaleTimeString()}
          </span>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={checkStatus}
          disabled={status === 'checking'}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  )
}
