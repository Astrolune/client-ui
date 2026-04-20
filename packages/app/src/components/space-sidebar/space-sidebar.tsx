import { useState, useCallback, useEffect, useRef } from "react"
import { Hash, Volume2, Settings, Bell, Users, Mail, ChevronDown, ChevronRight } from "lucide-react"
import cn from "classnames"
import { useTranslation } from "react-i18next"
import { ContextMenu } from "../context-menu/context-menu"
import type { Space } from "../../types"
import "./space-sidebar.scss"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SpaceSidebarProps {
  space: Space | null
  activeChannelId: string | null
  onChannelSelect: (channelId: string) => void
  onOpenSettings: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_WIDTH = 200
const MAX_WIDTH = 360
const DEFAULT_WIDTH = 240
const STORAGE_KEY = "space_sidebar_width"

// ─── Component ────────────────────────────────────────────────────────────────

export function SpaceSidebar({
  space,
  activeChannelId,
  onChannelSelect,
  onOpenSettings,
}: SpaceSidebarProps) {
  const { t } = useTranslation("space")
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(0)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Load persisted width
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        setSidebarWidth(parsed)
      }
    }
  }, [])

  // Load persisted collapsed categories
  useEffect(() => {
    const stored = localStorage.getItem("space_collapsed_categories")
    if (stored) {
      try {
        setCollapsedCategories(new Set(JSON.parse(stored)))
      } catch {
        // ignore parse errors
      }
    }
  }, [])

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)
      resizeStartX.current = e.clientX
      resizeStartWidth.current = sidebarWidth
    },
    [],
  )

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStartWidth.current + delta))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      localStorage.setItem(STORAGE_KEY, String(sidebarWidth))
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, sidebarWidth])

  const toggleCategory = useCallback((categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      localStorage.setItem("space_collapsed_categories", JSON.stringify([...next]))
      return next
    })
  }, [])

  const handleBannerClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleMenuAction = useCallback(
    (action: string) => {
      setContextMenu(null)
      if (action === "settings") {
        onOpenSettings()
      }
    },
    [onOpenSettings],
  )

  if (!space) return null

  const contextMenuItems = [
    {
      label: t("space_settings", "Space Settings"),
      icon: <Settings size={14} />,
      onClick: () => handleMenuAction("settings"),
    },
    {
      label: t("invite_people", "Invite People"),
      icon: <Mail size={14} />,
      onClick: () => handleMenuAction("invite"),
    },
    {
      label: t("notifications", "Notifications"),
      icon: <Bell size={14} />,
      onClick: () => handleMenuAction("notifications"),
    },
    {
      label: t("members", "Members"),
      icon: <Users size={14} />,
      onClick: () => handleMenuAction("members"),
    },
  ]

  return (
    <div
      ref={sidebarRef}
      className="space-sidebar"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* ── Banner / Space Name Button ── */}
      <div className="space-sidebar__banner-area">
        {space.banner && (
          <img
            src={space.banner}
            alt=""
            className="space-sidebar__banner-image"
          />
        )}
        <div className="space-sidebar__banner-overlay" />
        <button
          className="space-sidebar__banner-button"
          onClick={handleBannerClick}
        >
          <span className="space-sidebar__name">{space.name}</span>
        </button>
      </div>

      {/* ── Channels ── */}
      <div className="space-sidebar__channels">
        {space.categories.map((category) => (
          <div key={category.id} className="space-sidebar__category">
            <button
              className="space-sidebar__category-header"
              onClick={() => toggleCategory(category.id)}
            >
              {collapsedCategories.has(category.id) ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
              <span>{category.name}</span>
            </button>

            {!collapsedCategories.has(category.id) && (
              <div className="space-sidebar__channels-list">
                {category.channels.map((channel) => (
                  <button
                    key={channel.id}
                    className={cn("space-sidebar__channel", {
                      "space-sidebar__channel--active": channel.id === activeChannelId,
                    })}
                    onClick={() => onChannelSelect(channel.id)}
                  >
                    {channel.type === "voice" ? (
                      <Volume2 size={14} />
                    ) : (
                      <Hash size={14} />
                    )}
                    <span>{channel.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Resize Handle ── */}
      <div
        className={cn("space-sidebar__resize-handle", {
          "space-sidebar__resize-handle--active": isResizing,
        })}
        onMouseDown={handleResizeStart}
      />

      {/* ── Context Menu ── */}
      {contextMenu && (
        <ContextMenu position={contextMenu} items={contextMenuItems} onClose={handleContextMenuClose} />
      )}
    </div>
  )
}
