import { invoke } from './host/core'

export interface CaptureSource {
  id: string
  kind: 'monitor' | 'window'
  name: string
  thumbnail: string
  width: number
  height: number
  is_primary: boolean
}

export interface CaptureOptions {
  fps: 30 | 60
  resolution: [number, number]
  cursor: boolean
  hdr: boolean
}

export interface CaptureStats {
  fps_actual: number
  resolution: [number, number]
  bitrate_kbps: number
  dropped_frames: number
  encoder: string
}

export const getCaptureSources = () => invoke<CaptureSource[]>('list_capture_sources')

export const startScreenCapture = (sourceId: string, options: CaptureOptions) =>
  invoke<string>('start_screen_share', {
    request: {
      sourceId,
      fps: options.fps,
      resolution: options.resolution,
      cursor: options.cursor,
    },
  })

export const stopScreenCapture = (sessionId: string) =>
  invoke<void>('stop_screen_share', { sessionId })

export const getCaptureStats = (sessionId: string) =>
  invoke<CaptureStats>('media.capture.stats', { sessionId })
