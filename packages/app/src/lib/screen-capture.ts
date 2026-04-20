import { invoke } from "./host/core"
import { listen, type UnlistenFn } from "./host/event"

import type { CaptureSource } from "./media"

export interface ScreenCaptureRequest {
  sourceId?: string
  fps?: number
  cursor?: boolean
}

export interface ScreenCaptureFrame {
  sessionId: string
  width: number
  height: number
  stride: number
  timestampUs: number
  format: "bgra" | string
  dataBase64: string
}

export interface ScreenCaptureStateEvent {
  sessionId: string
  status: "started" | "stopped" | "error"
  message?: string | null
}

export const startScreenCaptureNative = (request: ScreenCaptureRequest) =>
  invoke<string>("start_screen_share", { request })

export const stopScreenCaptureNative = () => invoke<void>("stop_screen_share")

export const getCaptureSourcesNative = () => invoke<CaptureSource[]>("list_capture_sources")

export const onScreenCaptureFrame = async (
  handler: (frame: ScreenCaptureFrame) => void,
): Promise<UnlistenFn> => {
  return listen<ScreenCaptureFrame>("capture://screen/frame", (payload) => {
    if (payload) {
      handler(payload)
    }
  })
}

export const onScreenCaptureState = async (
  handler: (event: ScreenCaptureStateEvent) => void,
): Promise<UnlistenFn> => {
  return listen<ScreenCaptureStateEvent>("capture://screen/state", (payload) => {
    if (payload) {
      handler(payload)
    }
  })
}

