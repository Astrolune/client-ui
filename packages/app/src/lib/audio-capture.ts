import { invoke } from "./host/core"
import { listen, type UnlistenFn } from "./host/event"

export interface AudioCaptureRequest {
  deviceId?: string
  sampleRate?: number
  channels?: number
  noiseGateThreshold?: number
  chunkMs?: number
}

export interface AudioCaptureFrame {
  sessionId: string
  sampleRate: number
  channels: number
  samplesPerChannel: number
  timestampMs: number
  format: "s16le" | string
  dataBase64: string
}

export interface AudioCaptureStateEvent {
  sessionId: string
  status: "started" | "stopped" | "error"
  message?: string | null
}

export interface AudioDevice {
  id: string
  name: string
  kind: "audioinput" | "audiooutput" | string
  isDefault: boolean
}

export const startAudioCaptureNative = (request: AudioCaptureRequest) =>
  invoke<void>("start_voice", { request })

export const stopAudioCaptureNative = () => invoke<void>("stop_voice")

export const getAudioDevicesNative = () => invoke<AudioDevice[]>("list_audio_input_devices")

export const onAudioCaptureFrame = async (
  handler: (frame: AudioCaptureFrame) => void,
): Promise<UnlistenFn> => {
  return listen<AudioCaptureFrame>("capture://audio/frame", (payload) => {
    if (payload) {
      handler(payload)
    }
  })
}

export const onAudioCaptureState = async (
  handler: (event: AudioCaptureStateEvent) => void,
): Promise<UnlistenFn> => {
  return listen<AudioCaptureStateEvent>("capture://audio/state", (payload) => {
    if (payload) {
      handler(payload)
    }
  })
}

