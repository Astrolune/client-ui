"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { LOGO_PATH_LEFT, LOGO_PATH_RIGHT, LOGO_BOUNDS } from "./logo-path"
import { loaderConfig } from "./loader-config"
import type { LoaderProgress, LoaderAPI } from "./loader-config"

export default function SplashCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Loading state refs (for animation loop access)
  const loaderStateRef = useRef<LoaderProgress>({
    state: "idle",
    currentStep: 0,
    totalSteps: 100,
    progress: loaderConfig.loading.startProgress,
    timestamp: Date.now(),
  })
  const stateListenersRef = useRef<Set<(state: LoaderProgress) => void>>(new Set())
  const externalProgressRef = useRef<number | null>(null)

  // Update state and notify listeners
  const updateState = useCallback((newState: Partial<LoaderProgress>) => {
    loaderStateRef.current = {
      ...loaderStateRef.current,
      ...newState,
      timestamp: Date.now(),
    }
    // Notify all listeners
    stateListenersRef.current.forEach(cb => cb(loaderStateRef.current))
    
    // Also dispatch custom event for C# WebView
    window.dispatchEvent(new CustomEvent("astrolune-loader-state", {
      detail: loaderStateRef.current
    }))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const config = loaderConfig

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      setIsMobile(window.innerWidth < 768)
    }

    updateCanvasSize()

    type Particle = {
      x: number
      y: number
      baseX: number
      baseY: number
      // Scattered position (initial random position near base)
      scatterX: number
      scatterY: number
      // Current interpolated position for smooth animation
      currentX: number
      currentY: number
      size: number
      color: string
      scatteredColor: string
      isRight: boolean
      // Distance from logo center (normalized 0-1) for wave animation
      distFromCenter: number
      // Idle drift properties
      driftAngle: number
      driftSpeed: number
      driftOffset: number
    }

    let particles: Particle[] = []
    let textImageData: ImageData | null = null
    let currentProgress = config.loading.startProgress // Start from configured start progress
    let displayProgress = config.loading.startProgress // Smoothly interpolated progress
    let lastFrameTime = 0
    let animationStarted = false
    let animationComplete = false
    let totalTime = 0 // For idle drift animation

    function createTextImage() {
      if (!ctx || !canvas) return 0

      ctx.save()

      const logoHeight = isMobile ? config.logo.mobileHeight : config.logo.desktopHeight
      const scale = logoHeight / LOGO_BOUNDS.height

      const logoWidth = LOGO_BOUNDS.width * scale

      const xOffset = (canvas.width - logoWidth) / 2 - LOGO_BOUNDS.minX * scale
      const yOffset = (canvas.height - logoHeight) / 2 - LOGO_BOUNDS.minY * scale

      ctx.translate(xOffset, yOffset)
      ctx.scale(scale, scale)

      // Left part - white
      ctx.fillStyle = "white"
      ctx.fill(new Path2D(LOGO_PATH_LEFT))

      // Right part - marker color (green for detection)
      ctx.fillStyle = "#00ff00"
      ctx.fill(new Path2D(LOGO_PATH_RIGHT))

      ctx.restore()

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      return scale
    }

    // Store logo center for wave animation
    let logoCenterX = 0
    let logoCenterY = 0
    let maxDistFromCenter = 1

    function createParticle(_scale: number) {
      if (!ctx || !canvas || !textImageData) return null

      const data = textImageData.data

      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * canvas.width)
        const y = Math.floor(Math.random() * canvas.height)
        const index = (y * canvas.width + x) * 4

        if (data[index + 3] > 128) {
          const isRight = data[index] === 0 && data[index + 1] === 255 && data[index + 2] === 0

          // Calculate scattered position - small random offset near the base position
          const scatterAngle = Math.random() * Math.PI * 2
          const scatterDist = config.loading.scatterRadius * (0.5 + Math.random() * 0.5)
          const scatterX = x + Math.cos(scatterAngle) * scatterDist
          const scatterY = y + Math.sin(scatterAngle) * scatterDist

          const startX = config.loading.enabled ? scatterX : x
          const startY = config.loading.enabled ? scatterY : y

          // Calculate distance from logo center for wave effect
          const dx = x - logoCenterX
          const dy = y - logoCenterY
          const distFromCenter = Math.sqrt(dx * dx + dy * dy)

          return {
            x: startX,
            y: startY,
            baseX: x,
            baseY: y,
            scatterX,
            scatterY,
            currentX: startX,
            currentY: startY,
            size: Math.random() * config.particles.sizeRange + config.particles.minSize,
            color: isRight ? config.colors.rightColor : config.colors.leftColor,
            scatteredColor: isRight ? config.colors.rightScatteredColor : config.colors.leftScatteredColor,
            isRight,
            distFromCenter,
            // Idle drift - each particle has its own random drift pattern
            driftAngle: Math.random() * Math.PI * 2,
            driftSpeed: 0.5 + Math.random() * 1.5,
            driftOffset: Math.random() * Math.PI * 2,
          }
        }
      }

      return null
    }

    function createInitialParticles(scale: number) {
      if (!canvas) return
      
      logoCenterX = canvas.width / 2
      logoCenterY = canvas.height / 2
      
      const count = Math.floor(
        config.particles.baseCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080))
      )
      for (let i = 0; i < count; i++) {
        const particle = createParticle(scale)
        if (particle) particles.push(particle)
      }
      
      // Normalize distances for wave effect
      if (particles.length > 0) {
        maxDistFromCenter = Math.max(...particles.map(p => p.distFromCenter))
        particles.forEach(p => {
          p.distFromCenter = p.distFromCenter / maxDistFromCenter
        })
      }
    }

    let animationFrameId: number

    function animate(scale: number) {
      if (!ctx || !canvas) return

      const now = Date.now()
      const deltaTime = lastFrameTime ? (now - lastFrameTime) / 1000 : 0.016
      lastFrameTime = now
      totalTime += deltaTime

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = config.colors.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Handle loading animation
      if (config.loading.enabled && !animationComplete) {
        // Start delay
        if (!animationStarted) {
          if (now - loaderStateRef.current.timestamp >= config.loading.startDelay) {
            animationStarted = true
            updateState({ state: "loading", progress: config.loading.startProgress })
          }
        }

        // Check for external progress control
        if (externalProgressRef.current !== null) {
          currentProgress = externalProgressRef.current
        } else if (animationStarted && config.loading.autoProgressSpeed > 0) {
          // Auto-progress (if enabled)
          currentProgress += config.loading.autoProgressSpeed * deltaTime
          currentProgress = Math.min(currentProgress, 100)
        }

        // Smooth interpolation towards target progress
        displayProgress += (currentProgress - displayProgress) * config.loading.smoothSpeed
        
        // Update state
        const roundedProgress = Math.round(displayProgress)
        if (roundedProgress !== loaderStateRef.current.progress) {
          updateState({ 
            progress: roundedProgress,
            currentStep: roundedProgress,
            state: roundedProgress >= 100 ? "complete" : "loading"
          })
        }

        // Check if animation is complete
        if (displayProgress >= 99.5) {
          animationComplete = true
          displayProgress = 100
          updateState({ state: "interactive", progress: 100, currentStep: 100 })
        }
      }

      // Calculate interpolation factor (0 = scattered, 1 = formed)
      // Progress goes from startProgress to 100, so normalize it
      const normalizedProgress = (displayProgress - config.loading.startProgress) / (100 - config.loading.startProgress)
      const globalT = Math.max(0, Math.min(1, normalizedProgress))

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Calculate target position based on loading progress with wave effect
        if (config.loading.enabled && !animationComplete) {
          // Wave effect: particles closer to center form first
          // distFromCenter is 0 at center, 1 at edge
          const waveDelay = p.distFromCenter * config.loading.waveIntensity
          const particleProgress = Math.max(0, Math.min(1, (globalT - waveDelay) / (1 - waveDelay)))
          
          // Use easeOutCubic for smooth deceleration
          const easedT = 1 - Math.pow(1 - particleProgress, 3)
          
          // Smooth interpolation between scattered and base position
          const targetX = p.scatterX + (p.baseX - p.scatterX) * easedT
          const targetY = p.scatterY + (p.baseY - p.scatterY) * easedT
          
          // Smooth movement towards target
          p.currentX += (targetX - p.currentX) * config.loading.smoothSpeed
          p.currentY += (targetY - p.currentY) * config.loading.smoothSpeed
          
          p.x = p.currentX
          p.y = p.currentY
        }

        // Idle drift animation (when animation is complete)
        if (animationComplete || !config.loading.enabled) {
          // Calculate drift offset using sine wave
          const driftTime = totalTime * p.driftSpeed + p.driftOffset
          const driftX = Math.cos(p.driftAngle) * Math.sin(driftTime) * config.animation.idleDriftRadius
          const driftY = Math.sin(p.driftAngle) * Math.cos(driftTime * 0.7) * config.animation.idleDriftRadius
          
          p.x = p.baseX + driftX
          p.y = p.baseY + driftY
          ctx.fillStyle = p.color
        } else {
          // During loading animation - blend colors based on particle's individual progress
          const waveDelay = p.distFromCenter * config.loading.waveIntensity
          const particleProgress = Math.max(0, Math.min(1, (globalT - waveDelay) / (1 - waveDelay)))
          ctx.fillStyle = particleProgress > 0.5 ? p.color : p.scatteredColor
        }

        ctx.fillRect(p.x, p.y, p.size, p.size)
      }

      animationFrameId = requestAnimationFrame(() => animate(scale))
    }

    // Setup global API for C# WebView integration
    const loaderAPI: LoaderAPI = {
      getState: () => loaderStateRef.current,
      
      setProgress: (progress: number) => {
        externalProgressRef.current = Math.max(config.loading.startProgress, Math.min(100, progress))
      },
      
      start: () => {
        currentProgress = config.loading.startProgress
        displayProgress = config.loading.startProgress
        lastFrameTime = 0
        animationStarted = false
        animationComplete = false
        externalProgressRef.current = null
        
        // Reset particles to scattered positions
        particles.forEach(p => {
          p.x = p.scatterX
          p.y = p.scatterY
          p.currentX = p.scatterX
          p.currentY = p.scatterY
        })
        
        updateState({ state: "idle", currentStep: 0, progress: config.loading.startProgress })
      },
      
      complete: () => {
        currentProgress = 100
        displayProgress = 100
        animationComplete = true
        externalProgressRef.current = null
        
        // Snap all particles to final positions
        particles.forEach(p => {
          p.x = p.baseX
          p.y = p.baseY
          p.currentX = p.baseX
          p.currentY = p.baseY
        })
        
        updateState({ state: "interactive", currentStep: 100, progress: 100 })
      },
      
      reset: () => {
        currentProgress = config.loading.startProgress
        displayProgress = config.loading.startProgress
        lastFrameTime = 0
        animationStarted = false
        animationComplete = false
        externalProgressRef.current = null
        
        // Reset particles to scattered positions
        particles.forEach(p => {
          p.x = p.scatterX
          p.y = p.scatterY
          p.currentX = p.scatterX
          p.currentY = p.scatterY
        })
        
        updateState({ state: "idle", currentStep: 0, progress: config.loading.startProgress })
      },
      
      onStateChange: (callback: (state: LoaderProgress) => void) => {
        stateListenersRef.current.add(callback)
        return () => stateListenersRef.current.delete(callback)
      },
    }

    // Expose API globally
    window.AstroLuneLoader = loaderAPI

    const scale = createTextImage()
    createInitialParticles(scale)
    animate(scale)

    const handleResize = () => {
      updateCanvasSize()
      const newScale = createTextImage()
      particles = []
      createInitialParticles(newScale)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
      delete window.AstroLuneLoader
    }
  }, [isMobile, updateState])

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} className="particle-canvas" aria-label="Logo" />
    </div>
  )
}
