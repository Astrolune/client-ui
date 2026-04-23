import { useCallback, useEffect, useMemo, useState } from "react"
import {
  listAudioInputDevicesNative,
  startVoiceNative,
  stopVoiceNative,
  type AudioInputDevice,
} from "../lib/media"
import { invoke, isHostBridgeAvailable, listen } from "../lib/host/bridge"

export interface VoiceJoinOptions {
  inputDeviceId?: string
  channelId?: string
}

export interface UseVoiceResult {
  active: boolean
  loading: boolean
  error: string | null
  devices: AudioInputDevice[]
  join: (options?: VoiceJoinOptions) => Promise<void>
  leave: () => Promise<void>
  refreshDevices: () => Promise<void>
}

export const useVoice = (): UseVoiceResult => {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<AudioInputDevice[]>([])

  useEffect(() => {
    if (!isHostBridgeAvailable()) {
      return
    }

    let disposeState: (() => void) | null = null
    let disposeError: (() => void) | null = null
    let disposed = false

    void (async () => {
      try {
        disposeState = await listen<Record<string, unknown>>("voice.state", (payload) => {
          if (disposed) {
            return
          }

          const joined = payload?.joined === true
          setActive(joined)
        })
      } catch {
        // no-op for environments without voice events
      }

      try {
        disposeError = await listen<Record<string, unknown>>("voice.error", (payload) => {
          if (disposed) {
            return
          }

          const reason = typeof payload?.reason === "string" ? payload.reason : "Voice operation failed"
          setError(reason)
        })
      } catch {
        // no-op
      }
    })()

    return () => {
      disposed = true
      disposeState?.()
      disposeError?.()
    }
  }, [])

  const refreshDevices = useCallback(async () => {
    try {
      const nextDevices = await listAudioInputDevicesNative()
      setDevices(nextDevices)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to list input devices"
      setError(message)
    }
  }, [])

  useEffect(() => {
    void refreshDevices()
  }, [refreshDevices])

  const join = useCallback(async (options?: VoiceJoinOptions) => {
    setLoading(true)
    setError(null)
    try {
      const channelId = options?.channelId?.trim()
      if (isHostBridgeAvailable() && channelId) {
        try {
          await invoke("voice.join", { channelId })
        } catch {
          await startVoiceNative({
            inputDeviceId: options?.inputDeviceId,
          })
        }
      } else {
        await startVoiceNative({
          inputDeviceId: options?.inputDeviceId,
        })
      }
      setActive(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start voice"
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const leave = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (isHostBridgeAvailable()) {
        try {
          await invoke("voice.leave")
        } catch {
          await stopVoiceNative()
        }
      } else {
        await stopVoiceNative()
      }
      setActive(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to stop voice"
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return useMemo(
    () => ({
      active,
      loading,
      error,
      devices,
      join,
      leave,
      refreshDevices,
    }),
    [active, devices, error, join, leave, loading, refreshDevices],
  )
}
