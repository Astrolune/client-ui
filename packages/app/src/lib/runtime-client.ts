/**
 * Astrolune Runtime Client for React
 * Communicates with the C# Host via WebView2 bridge
 */

export interface RuntimeUpdate {
  type: string
  data: unknown
}

export type RuntimeUpdateHandler = (update: RuntimeUpdate) => void

interface BridgeCommand {
  id: string
  cmd: string
  payload?: unknown
}

interface BridgeResponse {
  id: string
  result?: unknown
  error?: { message: string }
}

class RuntimeClient {
  private pendingRequests = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>()
  private updateHandlers = new Set<RuntimeUpdateHandler>()
  private requestId = 0

  constructor() {
    // Listen for messages from the Host (WebView2)
    if (typeof window !== 'undefined' && window.chrome?.webview) {
      window.chrome.webview.addEventListener('message', this.handleWebViewMessage)
    }
  }

  private handleWebViewMessage = (event: any) => {
    const data = event.data
    if (!data || typeof data !== 'object') return

    // Handle responses
    if ('id' in data) {
      const response = data as BridgeResponse
      const pending = this.pendingRequests.get(response.id)
      if (pending) {
        this.pendingRequests.delete(response.id)
        if (response.error) {
          pending.reject(new Error(response.error.message))
        } else {
          pending.resolve(response.result)
        }
      }
      return
    }

    // Handle updates/events
    if ('type' in data && data.type === 'event') {
      const update: RuntimeUpdate = {
        type: data.event as string,
        data: data.payload,
      }
      this.updateHandlers.forEach((handler) => handler(update))
    }
  }

  async invoke<T = unknown>(cmd: string, payload?: unknown): Promise<T> {
    const id = `req_${++this.requestId}`
    const command: BridgeCommand = { id, cmd, payload }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject })

      // Send to Host via WebView2 postMessage
      if (window.chrome?.webview) {
        window.chrome.webview.postMessage(JSON.stringify(command))
      } else {
        reject(new Error('WebView2 not available'))
        return
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error(`Request timeout: ${cmd}`))
        }
      }, 30000)
    }) as Promise<T>
  }

  subscribe(handler: RuntimeUpdateHandler): () => void {
    this.updateHandlers.add(handler)
    return () => {
      this.updateHandlers.delete(handler)
    }
  }

  dispose() {
    if (typeof window !== 'undefined' && window.chrome?.webview) {
      window.chrome.webview.removeEventListener('message', this.handleWebViewMessage)
    }
    this.pendingRequests.clear()
    this.updateHandlers.clear()
  }
}

// Singleton instance
let runtimeClient: RuntimeClient | null = null

export const getRuntimeClient = (): RuntimeClient => {
  if (!runtimeClient) {
    runtimeClient = new RuntimeClient()
  }
  return runtimeClient
}

// Auth API
export const auth = {
  login: async (username: string, password: string) => {
    return getRuntimeClient().invoke('core.auth.login', { username, password })
  },
  logout: async () => {
    return getRuntimeClient().invoke('core.auth.logout')
  },
  refresh: async () => {
    return getRuntimeClient().invoke('core.auth.refresh')
  },
  getState: async () => {
    return getRuntimeClient().invoke('core.auth.get_state')
  },
}

// Chat API
export const chat = {
  getMessages: async (channelId: string, limit = 50, before?: string) => {
    return getRuntimeClient().invoke('chat.messages.list', { channelId, limit, before })
  },
  sendMessage: async (channelId: string, content: string, attachments?: string[]) => {
    return getRuntimeClient().invoke('chat.messages.create', { channelId, content, attachments })
  },
  updateMessage: async (channelId: string, messageId: string, content: string) => {
    return getRuntimeClient().invoke('chat.messages.update', { channelId, messageId, content })
  },
  deleteMessage: async (channelId: string, messageId: string) => {
    return getRuntimeClient().invoke('chat.messages.delete', { channelId, messageId })
  },
  addReaction: async (channelId: string, messageId: string, emoji: string) => {
    return getRuntimeClient().invoke('chat.messages.add_reaction', { channelId, messageId, emoji })
  },
  removeReaction: async (channelId: string, messageId: string, emoji: string) => {
    return getRuntimeClient().invoke('chat.messages.remove_reaction', { channelId, messageId, emoji })
  },
}

// Voice API
export const voice = {
  join: async (channelId: string) => {
    return getRuntimeClient().invoke('voice.join', { channelId })
  },
  leave: async () => {
    return getRuntimeClient().invoke('voice.leave')
  },
  setMuted: async (muted: boolean) => {
    return getRuntimeClient().invoke('voice.mute', { muted })
  },
  setDeafened: async (deafened: boolean) => {
    return getRuntimeClient().invoke('voice.deafen', { deafened })
  },
}

// Media API
export const media = {
  listScreens: async () => {
    return getRuntimeClient().invoke('media.screen.list')
  },
  captureScreen: async (screenId: string) => {
    return getRuntimeClient().invoke('media.screen.capture', { screenId })
  },
  listCameras: async () => {
    return getRuntimeClient().invoke('media.camera.list')
  },
  startCamera: async (cameraId: string) => {
    return getRuntimeClient().invoke('media.camera.start', { cameraId })
  },
  stopCamera: async () => {
    return getRuntimeClient().invoke('media.camera.stop')
  },
}

// Window controls
export const window = {
  minimize: async () => {
    return getRuntimeClient().invoke('window_minimize')
  },
  maximize: async () => {
    return getRuntimeClient().invoke('window_maximize')
  },
  close: async () => {
    return getRuntimeClient().invoke('window_close')
  },
  drag: async () => {
    return getRuntimeClient().invoke('window_drag')
  },
}

// Storage API (uses keyring)
export const storage = {
  get: async (key: string): Promise<string | null> => {
    const result = await getRuntimeClient().invoke<{ password?: string }>('keyring_get_password', { key })
    return result?.password || null
  },
  set: async (key: string, value: string): Promise<void> => {
    await getRuntimeClient().invoke('keyring_set_password', { key, password: value })
  },
  delete: async (key: string): Promise<void> => {
    await getRuntimeClient().invoke('keyring_delete_password', { key })
  },
  clear: async (): Promise<void> => {
    // Not implemented - would need to track keys
    throw new Error('Storage.clear() not implemented')
  },
}

export default {
  auth,
  chat,
  voice,
  media,
  window,
  storage,
  getRuntimeClient,
}
