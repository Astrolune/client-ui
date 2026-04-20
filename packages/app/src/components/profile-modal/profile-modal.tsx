"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import {
  X,
  Plus,
  Phone,
  MessageSquare,
  Bell,
  BellOff,
  MoreHorizontal,
  Share2,
  UserPlus,
  Flag,
  Settings,
  Copy,
  Shield,
  Code2,
  Star,
  Crown,
  CheckCircle2,
  Layers,
  Coins,
  BadgeCheck,
} from "lucide-react"
import { Avatar } from "../avatar/avatar"
import { Backdrop } from "../backdrop/backdrop"
import cn from "classnames"
import type { UserData } from "../../types"
import "./profile-modal.scss"

interface ProfileModalProps {
  visible: boolean
  onClose: () => void
  user: UserData
  onOpenSettings?: () => void
}

export interface UserBadge {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  description: string
}

const USER_BADGES: UserBadge[] = [
  {
    id: "dev",
    label: "Developer",
    icon: <Code2 size={12} />,
    color: "#00d4ff",
    description: "Active developer of the platform",
  },
  {
    id: "admin",
    label: "Administrator",
    icon: <Crown size={12} />,
    color: "#f0b232",
    description: "Platform administrator with full access",
  },
  {
    id: "mod",
    label: "Moderator",
    icon: <Shield size={12} />,
    color: "#4ade80",
    description: "Community moderator",
  },
  {
    id: "premium",
    label: "Premium",
    icon: <Star size={12} />,
    color: "#ff0000",
    description: "Premium subscriber",
  },
  {
    id: "verified",
    label: "Verified",
    icon: <BadgeCheck size={12} />,
    color: "#60a5fa",
    description: "Verified account",
  },
  {
    id: "member",
    label: "Member",
    icon: <CheckCircle2 size={12} />,
    color: "#8e919b",
    description: "Community member",
  },
]

type ProfileTab = "nft" | "transactions" | "trust" | "activity"

const PROFILE_TABS: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { id: "nft", label: "NFT", icon: <Layers size={14} /> },
  { id: "transactions", label: "Transactions", icon: <Coins size={14} /> },
  { id: "trust", label: "Trust Factor", icon: <Shield size={14} /> },
  { id: "activity", label: "Activity", icon: <CheckCircle2 size={14} /> },
]

const CONTEXT_MENU_ITEMS = [
  { id: "share", label: "Share Profile", icon: <Share2 size={14} /> },
  { id: "copy", label: "Copy User ID", icon: <Copy size={14} /> },
  { id: "add", label: "Add Friend", icon: <UserPlus size={14} /> },
  { id: "report", label: "Report", icon: <Flag size={14} />, danger: true },
]

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  user,
  onOpenSettings,
}) => {
  const [isClosing, setIsClosing] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>("nft")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }, [onClose])

  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [visible, handleClose])

  useEffect(() => {
    if (!visible) return

    const handleClickOutside = (e: MouseEvent) => {
      if (showContextMenu && contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false)
        return
      }
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }

    const id = setTimeout(() => {
      window.addEventListener("mousedown", handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(id)
      window.removeEventListener("mousedown", handleClickOutside)
    }
  }, [visible, handleClose, showContextMenu])

  const renderTabContent = () => {
    switch (activeTab) {
      case "nft":
        return (
          <div className="pm-tab-content">
            <div className="pm-tab-empty">
              <Layers size={28} className="pm-tab-empty__icon" />
              <p>No NFTs yet</p>
            </div>
          </div>
        )
      case "transactions":
        return (
          <div className="pm-tab-content">
            <div className="pm-tab-empty">
              <Coins size={28} className="pm-tab-empty__icon" />
              <p>No transactions</p>
            </div>
          </div>
        )
      case "trust":
        return (
          <div className="pm-tab-content">
            <div className="pm-trust">
              <div className="pm-trust__score-wrap">
                <svg viewBox="0 0 80 80" className="pm-trust__ring" aria-hidden="true">
                  <circle cx="40" cy="40" r="34" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="pm-trust__ring-fill"
                    strokeDasharray="213.6"
                    strokeDashoffset="42.7"
                  />
                </svg>
                <div className="pm-trust__score">80</div>
              </div>
              <div className="pm-trust__label">Trust Score</div>
              <div className="pm-trust__desc">Based on account age, activity and behaviour</div>
            </div>
          </div>
        )
      case "activity":
        return (
          <div className="pm-tab-content">
            <div className="pm-tab-empty">
              <CheckCircle2 size={28} className="pm-tab-empty__icon" />
              <p>No recent activity</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (!visible) return null

  return createPortal(
    <Backdrop visible={visible}>
      <div
        ref={modalRef}
        className={cn("profile-modal", { "profile-modal--closing": isClosing })}
      >
        {/* ─── Left: profile sidebar ─────────────────────────────── */}
        <aside className="pm-sidebar">
          {/* Banner (no padding, flush) */}
          <div className="pm-sidebar__banner">
            <div className="pm-sidebar__banner-deco pm-sidebar__banner-deco--tl">+</div>
            <div className="pm-sidebar__banner-deco pm-sidebar__banner-deco--tr">✦</div>
            <div className="pm-sidebar__banner-deco pm-sidebar__banner-deco--bl">✦</div>
          </div>

          {/* Avatar + status button row */}
          <div className="pm-sidebar__avatar-row">
            <div className="pm-sidebar__avatar-wrap">
              <Avatar size={72} src={user.avatar.src} alt={user.nickname} />
              <span
                className={cn(
                  "pm-sidebar__status-dot",
                  `pm-sidebar__status-dot--${user.status ?? "online"}`,
                )}
              />
            </div>
            <button className="pm-sidebar__status-btn">
              <Plus size={11} />
              Set status
            </button>
          </div>

          {/* Badges */}
          <div className="pm-sidebar__badges">
            {USER_BADGES.map((badge) => (
              <div key={badge.id} className="pm-badge-wrap">
                <span
                  className="pm-badge"
                  style={{ "--badge-color": badge.color } as React.CSSProperties}
                  onMouseEnter={() => setHoveredBadge(badge.id)}
                  onMouseLeave={() => setHoveredBadge(null)}
                >
                  {badge.icon}
                  {badge.label}
                </span>
                {hoveredBadge === badge.id && (
                  <div className="pm-badge__tooltip">{badge.description}</div>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="pm-sidebar__divider" />

          {/* User info */}
          <div className="pm-sidebar__info">
            <div className="pm-sidebar__nickname">{user.nickname}</div>
            <div className="pm-sidebar__username">@{user.username}</div>
            {user.pronouns && (
              <div className="pm-sidebar__pronouns">{user.pronouns}</div>
            )}
            {user.bio && (
              <p className="pm-sidebar__bio">{user.bio}</p>
            )}
          </div>

          {/* Three-dot context menu */}
          <div className="pm-sidebar__context-wrap" ref={contextMenuRef}>
            <button
              className="pm-sidebar__dots-btn"
              onClick={() => setShowContextMenu((v) => !v)}
              aria-label="More actions"
            >
              <MoreHorizontal size={16} />
            </button>
            {showContextMenu && (
              <div className="pm-context-menu">
                {CONTEXT_MENU_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    className={cn("pm-context-menu__item", {
                      "pm-context-menu__item--danger": item.danger,
                    })}
                    onClick={() => setShowContextMenu(false)}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pm-sidebar__actions">
            <button className="pm-action-btn" title="Call">
              <Phone size={15} />
            </button>
            <button className="pm-action-btn" title="Message">
              <MessageSquare size={15} />
            </button>
            <button
              className={cn("pm-action-btn", { "pm-action-btn--active": !notificationsEnabled })}
              title={notificationsEnabled ? "Mute notifications" : "Unmute notifications"}
              onClick={() => setNotificationsEnabled((v) => !v)}
            >
              {notificationsEnabled ? <Bell size={15} /> : <BellOff size={15} />}
            </button>
            <button
              className="pm-action-btn"
              title="Settings"
              onClick={() => {
                handleClose()
                onOpenSettings?.()
              }}
            >
              <Settings size={15} />
            </button>
          </div>
        </aside>

        {/* ─── Right: tabs + content ─────────────────────────────── */}
        <section className="pm-content">
          <header className="pm-content__header">
            <nav className="pm-tabs">
              {PROFILE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={cn("pm-tab", { "pm-tab--active": activeTab === tab.id })}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
            <button className="pm-content__close" onClick={handleClose} aria-label="Close profile">
              <X size={18} />
            </button>
          </header>

          <div className="pm-content__body">
            {renderTabContent()}
          </div>
        </section>
      </div>
    </Backdrop>,
    document.body,
  )
}

export default ProfileModal
