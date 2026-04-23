export interface LoaderProgress {
  state: 'idle' | 'loading' | 'complete' | 'interactive'
  currentStep: number
  totalSteps: number
  progress: number
  timestamp: number
}

export interface LoaderAPI {
  getState: () => LoaderProgress
  setProgress: (progress: number) => void
  start: () => void
  complete: () => void
  reset: () => void
  onStateChange: (callback: (state: LoaderProgress) => void) => () => void
}

export const loaderConfig = {
  colors: {
    background: '#0a0a0a',
    leftColor: '#ffffff',
    rightColor: '#00d4aa',
    leftScatteredColor: '#666666',
    rightScatteredColor: '#008866',
  },
  particles: {
    baseCount: 8000,
    minSize: 1.5,
    sizeRange: 1.5,
  },
  logo: {
    desktopHeight: 120,
    mobileHeight: 80,
  },
  loading: {
    enabled: true,
    startProgress: 0,
    autoProgressSpeed: 0,
    smoothSpeed: 0.08,
    scatterRadius: 300,
    waveIntensity: 0.3,
    startDelay: 100,
  },
  animation: {
    idleDriftRadius: 2,
  },
}

declare global {
  interface Window {
    AstroLuneLoader?: LoaderAPI
    chrome?: {
      webview?: {
        postMessage: (message: string) => void
      }
    }
  }
}
