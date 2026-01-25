/**
 * API Client for backend server communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

/**
 * Check if the backend server is reachable
 * @returns Promise<boolean> - true if server is reachable, false otherwise
 */
export async function checkServerConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      return { connected: true }
    } else {
      return { 
        connected: false, 
        error: `Server responded with status ${response.status}` 
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { 
          connected: false, 
          error: 'Connection timeout - server took too long to respond' 
        }
      }
      return { 
        connected: false, 
        error: `Connection failed: ${error.message}` 
      }
    }
    return { 
      connected: false, 
      error: 'Unknown connection error' 
    }
  }
}

/**
 * Ping the server to check API docs availability
 * @returns Promise<boolean> - true if API docs are available
 */
export async function pingServerApiDocs(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${API_URL}/api/docs`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    return response.ok
  } catch (error) {
    console.error('Failed to ping API docs:', error)
    return false
  }
}

/**
 * Get the current API URL
 * @returns string - The configured API URL
 */
export function getApiUrl(): string {
  return API_URL
}
