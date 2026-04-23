import React, { useState, useRef, useCallback, type ReactNode, type ReactElement } from "react"
import { createPortal } from "react-dom"
import "./tooltip.scss"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  placement?: "top" | "bottom" | "left" | "right"
  delay?: number
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = "top",
  delay = 300,
}) => {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      let x = 0
      let y = 0
      const GAP = 8
      switch (placement) {
        case "top":
          x = rect.left + rect.width / 2
          y = rect.top - GAP
          break
        case "bottom":
          x = rect.left + rect.width / 2
          y = rect.bottom + GAP
          break
        case "left":
          x = rect.left - GAP
          y = rect.top + rect.height / 2
          break
        case "right":
          x = rect.right + GAP
          y = rect.top + rect.height / 2
          break
      }
      setCoords({ x, y })
      setVisible(true)
    }, delay)
  }, [placement, delay])

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setVisible(false)
  }, [])

  const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  // Force hide when another modal/dialog opens (detect backdrop)
  React.useEffect(() => {
    const checkBackdrop = () => {
      const backdrops = document.querySelectorAll('.backdrop, [class*="backdrop"]')
      if (backdrops.length > 0 && visible) {
        setVisible(false)
      }
    }
    
    const observer = new MutationObserver(checkBackdrop)
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => observer.disconnect()
  }, [visible])

  return (
    <>
      {React.cloneElement(child, {
        ref: (el: HTMLElement | null) => {
          triggerRef.current = el
          const existing = (child as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref
          if (typeof existing === "function") existing(el)
          else if (existing && typeof existing === "object" && "current" in existing) {
            ;(existing as React.MutableRefObject<HTMLElement | null>).current = el
          }
        },
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          show()
          child.props.onMouseEnter?.(e)
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          hide()
          child.props.onMouseLeave?.(e)
        },
        onFocus: (e: React.FocusEvent<HTMLElement>) => {
          show()
          child.props.onFocus?.(e)
        },
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
          hide()
          child.props.onBlur?.(e)
        },
      })}
      {visible &&
        createPortal(
          <div
            className={`tooltip tooltip--${placement}`}
            style={
              placement === "top" || placement === "bottom"
                ? { left: coords.x, top: coords.y }
                : { left: coords.x, top: coords.y }
            }
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}

export default Tooltip
