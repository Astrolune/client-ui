declare module '@astrolune/core' {
  export interface RuntimeUpdate {
    type: string
    data: unknown
  }

  export type RuntimeUpdateHandler = (update: RuntimeUpdate) => void

  export interface RuntimeClient {
    invoke<T = unknown>(cmd: string, payload?: unknown): Promise<T>
    subscribe(handler: RuntimeUpdateHandler): () => void
    dispose(): void
  }

  export const getRuntimeClient: () => RuntimeClient

  export const auth: {
    login: (username: string, password: string) => Promise<unknown>
    logout: () => Promise<unknown>
    refresh: () => Promise<unknown>
    getState: () => Promise<unknown>
  }

  export const chat: {
    getMessages: (channelId: string, limit?: number, before?: string) => Promise<unknown>
    sendMessage: (channelId: string, content: string, attachments?: string[]) => Promise<unknown>
    updateMessage: (channelId: string, messageId: string, content: string) => Promise<unknown>
    deleteMessage: (channelId: string, messageId: string) => Promise<unknown>
    addReaction: (channelId: string, messageId: string, emoji: string) => Promise<unknown>
    removeReaction: (channelId: string, messageId: string, emoji: string) => Promise<unknown>
  }

  export const voice: {
    join: (channelId: string) => Promise<unknown>
    leave: () => Promise<unknown>
    setMuted: (muted: boolean) => Promise<unknown>
    setDeafened: (deafened: boolean) => Promise<unknown>
  }

  export const media: {
    listScreens: () => Promise<unknown>
    captureScreen: (screenId: string) => Promise<unknown>
    listCameras: () => Promise<unknown>
    startCamera: (cameraId: string) => Promise<unknown>
    stopCamera: () => Promise<unknown>
  }

  export const window: {
    minimize: () => Promise<unknown>
    maximize: () => Promise<unknown>
    close: () => Promise<unknown>
    drag: () => Promise<unknown>
  }

  export const storage: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
    delete: (key: string) => Promise<void>
    clear: () => Promise<void>
  }
}
