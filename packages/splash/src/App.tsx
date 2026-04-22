import { useEffect, useState } from 'react'
import SplashCanvas from './splash-canvas'
import './App.css'

interface SplashMessage {
  event: string
  text?: string
  progress?: number
  value?: number
}

function App() {
  const [status, setStatus] = useState('Initializing...')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Listen for messages from C# Host
    const handleMessage = (event: MessageEvent) => {
      try {
        const data: SplashMessage = typeof event.data === 'string'
          ? JSON.parse(event.data)
          : event.data

        if (data.event === 'status') {
          setStatus(data.text || 'Loading...')
          if (typeof data.progress === 'number') {
            setProgress(data.progress)
            window.AstroLuneLoader?.setProgress(data.progress)
          }
        } else if (data.event === 'progress') {
          if (typeof data.value === 'number') {
            setProgress(data.value)
            window.AstroLuneLoader?.setProgress(data.value)
          }
        } else if (data.event === 'ready') {
          setProgress(100)
          window.AstroLuneLoader?.complete()

          // Notify host that splash is ready to close
          setTimeout(() => {
            if (window.chrome?.webview) {
              window.chrome.webview.postMessage(JSON.stringify({ event: 'ready' }))
            } else {
              window.postMessage({ event: 'ready' }, '*')
            }
          }, 500)
        }
      } catch (error) {
        console.error('Failed to parse splash message:', error)
      }
    }

    window.addEventListener('message', handleMessage)

    // Start loading animation
    setTimeout(() => {
      window.AstroLuneLoader?.start()
    }, 100)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return (
    <div className="splash-container">
      <SplashCanvas />
      <div className="splash-status">
        <div className="status-text">{status}</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">{progress}%</div>
      </div>
    </div>
  )
}

export default App
