export const loaderConfig = {
  // Particle settings
  particles: {
    // Base count of particles (scales with screen size)
    baseCount: 1700,
    // Minimum particle size
    minSize: 0.1,
    // Maximum particle size (minSize + sizeRange)
    sizeRange: 1,
  },

  // Animation settings
  animation: {
    // Idle drift - subtle movement when logo is formed
    idleDriftSpeed: 0.1, // Speed of idle drift (0 = no drift)
    // Max distance particles can drift from base position
    idleDriftRadius: 0.5,
  },

  // Loading animation settings
  loading: {
    // Enable loading animation mode
    enabled: true,
    // Progress starts from this value (10 = 10%)
    startProgress: 1,
    // Smooth interpolation speed (0.01 - 0.2, lower = smoother)
    smoothSpeed: 0.1,
    // Scatter radius - how far particles scatter from their base position (in pixels)
    scatterRadius: 150,
    // Wave effect - particles form from center outward (0 = no wave, 1 = full wave)
    waveIntensity: 0.0001,
    // Delay before animation starts (ms)
    startDelay: 0,
    // Auto-animate speed (progress per second, 0 = manual only)
    autoProgressSpeed: 10,
  },

  // Logo settings
  logo: {
    // Logo height on desktop in pixels
    desktopHeight: 150,
    // Logo height on mobile in pixels
    mobileHeight: 80,
    // Original logo viewBox height for scaling
    originalHeight: 35,
  },

  // Colors
  colors: {
    // Background color
    background: "black",
    // Left part of O (white part)
    leftColor: "white",
    // Right part of O (accent color)
    rightColor: "#ff0000",
    // Color when particles are scattered (left part)
    leftScatteredColor: "#FFFFFF",
    // Color when particles are scattered (right part)
    rightScatteredColor: "#ff6666",
  },
}

export type LoaderConfig = typeof loaderConfig

// Loading states for C# WebView integration
export type LoaderState = 
  | "idle"           // Not started
  | "initializing"   // Setting up particles
  | "loading"        // Animation in progress (particles forming)
  | "complete"       // Logo fully formed
  | "interactive"    // User can interact with particles

export interface LoaderProgress {
  state: LoaderState
  // Current step (0 to steps-1)
  currentStep: number
  // Total steps
  totalSteps: number
  // Progress percentage (0-100)
  progress: number
  // Timestamp when state changed
  timestamp: number
}

// Global API for C# WebView integration
export interface LoaderAPI {
  // Get current state
  getState: () => LoaderProgress
  // Set loading progress externally (0-100)
  setProgress: (progress: number) => void
  // Start the loading animation
  start: () => void
  // Complete the animation immediately
  complete: () => void
  // Reset to initial state
  reset: () => void
  // Subscribe to state changes
  onStateChange: (callback: (state: LoaderProgress) => void) => () => void
}

// Declare global window interface for TypeScript
declare global {
  interface Window {
    AstroLuneLoader?: LoaderAPI
  }
}
