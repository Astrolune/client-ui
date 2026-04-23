type PendingCall = {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}

type EventHandler<T> = (payload: T) => void

const pendingCalls = new Map<string, PendingCall>()
const eventHandlers = new Map<string, Set<EventHandler<unknown>>>()

let initialized = false

const ensureInitialized = () => {
  if (initialized) {
    return
  }

  if (typeof window === "undefined" || !window.chrome?.webview) {
    return
  }

  window.chrome.webview.addEventListener("message", (event) => {
    const data = event.data as Record<string, unknown> | null
    if (!data) {
      return
    }

    if (data.type === "event" && typeof data.event === "string") {
      const handlers = eventHandlers.get(data.event)
      if (!handlers || handlers.size === 0) {
        return
      }
      handlers.forEach((handler) => {
        handler(data.payload)
      })
      return
    }

    const id = typeof data.id === "string" ? data.id : null
    if (!id) {
      return
    }

    const pending = pendingCalls.get(id)
    if (!pending) {
      return
    }
    pendingCalls.delete(id)

    if (data.error) {
      const message =
        typeof data.error === "string"
          ? data.error
          : typeof (data.error as Record<string, unknown>).message === "string"
            ? (data.error as Record<string, unknown>).message
            : "Unknown bridge error"
      pending.reject(new Error(message))
      return
    }

    pending.resolve(data.result)
  })

  initialized = true
}

export const invoke = async <T>(
  cmd: string,
  payload?: Record<string, unknown>,
): Promise<T> => {
  ensureInitialized()

  if (typeof window === "undefined" || !window.chrome?.webview) {
    throw new Error("WebView bridge is not available.")
  }

  const id = crypto.randomUUID()
  const message = {
    id,
    cmd,
    payload: payload ?? {},
  }

  return new Promise<T>((resolve, reject) => {
    pendingCalls.set(id, { resolve, reject })
    window.chrome.webview.postMessage(message)
  })
}

export const listen = async <T>(
  eventName: string,
  handler: EventHandler<T>,
): Promise<() => void> => {
  ensureInitialized()

  const handlers = eventHandlers.get(eventName) ?? new Set()
  handlers.add(handler as EventHandler<unknown>)
  eventHandlers.set(eventName, handlers)

  return () => {
    const current = eventHandlers.get(eventName)
    if (!current) {
      return
    }
    current.delete(handler as EventHandler<unknown>)
    if (current.size === 0) {
      eventHandlers.delete(eventName)
    }
  }
}

export const isHostBridgeAvailable = () =>
  typeof window !== "undefined" && Boolean(window.chrome?.webview)
