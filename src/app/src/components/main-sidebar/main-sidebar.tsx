"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { Avatar } from "../avatar/avatar"
import { Tooltip } from "../tooltip/tooltip"
import {
  Plus,
  Search,
  Settings,
  User,
  ChevronUp,
  Shield,
  Code2,
  Star,
  Crown,
  BadgeCheck,
  CheckCircle2,
  MessageSquare,
  Users,
  X,
} from "lucide-react"
import { DeviceContextMenu, type AudioDevice } from "../device-context-menu/device-context-menu"
import { CommandMenu } from "../command-menu/command-menu"
import { SearchModal } from "../search-modal/search-modal"
import { Modal } from "../modal/modal"
import { TextField } from "../text-field/text-field"
import { Button } from "../button/button"
import { useCall } from "../../contexts/call-context"
import type { Chat, User as UserType, UserData, Space, SpaceChannel } from "../../types"
import "./main-sidebar.scss"
import cn from "classnames"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

const SIDEBAR_MIN_WIDTH = 240
const SIDEBAR_INITIAL_WIDTH = 309
const SIDEBAR_MAX_WIDTH = 420

const getInitialSidebarWidth = (): number => {
  if (typeof window === "undefined") return SIDEBAR_INITIAL_WIDTH
  const stored = window.localStorage.getItem("sidebarWidth")
  return stored ? Number(stored) : SIDEBAR_INITIAL_WIDTH
}

export interface UserBadge {
  id: string
  label: string
  icon: React.ReactNode
  color: string
}

const USER_BADGES: UserBadge[] = [
  { id: "dev",      label: "Developer",     icon: <Code2 size={12} />,       color: "#00d4ff" },
  { id: "admin",    label: "Administrator", icon: <Crown size={12} />,       color: "#f0b232" },
  { id: "mod",      label: "Moderator",     icon: <Shield size={12} />,      color: "#4ade80" },
  { id: "premium",  label: "Premium",       icon: <Star size={12} />,        color: "#ff0000" },
  { id: "verified", label: "Verified",      icon: <BadgeCheck size={12} />,  color: "#60a5fa" },
  { id: "member",   label: "Member",        icon: <CheckCircle2 size={12} />, color: "#8e919b" },
]

// ─── New Chat Modal ─────────────────────────────────────────────────────────

interface NewChatModalProps {
  visible: boolean
  onClose: () => void
  chats: Chat[]
  onSelectChat: (chatId: string) => void
}

const NewChatModal: React.FC<NewChatModalProps> = ({ visible, onClose, chats, onSelectChat }) => {
  const [search, setSearch] = useState("")

  const pinned = chats.slice(0, 5)
  const filtered = chats.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.status ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  const handleSelect = useCallback(
    (chatId: string) => {
      onSelectChat(chatId)
      onClose()
    },
    [onSelectChat, onClose],
  )

  return (
    <Modal
      visible={visible}
      title="New Message"
      description="Start a direct message or create a group"
      onClose={onClose}
    >
      <div className="ncm">
        <div className="ncm__search-wrapper">
          <TextField
            placeholder="Search people or chats…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <Search size={16} className="ncm__search-icon" />
        </div>

        <div className="ncm__body">
          {!search && pinned.length > 0 && (
            <>
              <div className="ncm__section-label">Recent</div>
              <div className="ncm__pinned-row">
                {pinned.map((chat) => (
                  <button
                    key={chat.id}
                    className="ncm__pinned-item"
                    onClick={() => handleSelect(chat.id)}
                  >
                    <Avatar size={40} src={chat.avatar} alt={chat.name} rounded />
                    <span className="ncm__pinned-name">{chat.name}</span>
                  </button>
                ))}
              </div>
              <div className="ncm__divider" />
            </>
          )}

          {!search && pinned.length === 0 && (
            <div className="ncm__empty">
              <Users size={32} className="ncm__empty-icon" />
              <p className="ncm__empty-title">No conversations yet</p>
              <p className="ncm__empty-subtitle">Search for people or start a new chat</p>
            </div>
          )}

          {search && filtered.length === 0 && (
            <div className="ncm__empty">
              <Search size={32} className="ncm__empty-icon" />
              <p className="ncm__empty-title">No results found</p>
              <p className="ncm__empty-subtitle">Try a different search term</p>
            </div>
          )}

          {search && filtered.length > 0 && (
            <>
              <div className="ncm__section-label">Results</div>
              {filtered.map((chat) => (
                <button
                  key={chat.id}
                  className="ncm__result-item"
                  onClick={() => handleSelect(chat.id)}
                >
                  <Avatar size={36} src={chat.avatar} alt={chat.name} rounded />
                  <div className="ncm__result-info">
                    <div className="ncm__result-name">{chat.name}</div>
                    {chat.status && <div className="ncm__result-status">{chat.status}</div>}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="ncm__footer">
          <Button theme="outline" onClick={onClose}>
            <Users size={14} />
            Create Group
          </Button>
          <Button theme="outline" onClick={onClose}>
            <MessageSquare size={14} />
            New Direct Message
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Sidebar ───────────────────────────────────────────────────────────

interface MainSidebarProps {
  chats: Chat[]
  user: UserType
  profileUser: UserData
  onOpenSettings?: () => void
  onOpenFriends?: () => void
  onOpenProfile?: () => void
  activeSpace?: Space | null
  onSpaceChange?: (space: Space | null) => void
  spaces: Space[]
}

export const MainSidebar: React.FC<MainSidebarProps> = ({
  chats,
  user,
  profileUser,
  onOpenSettings,
  onOpenProfile,
  activeSpace,
  onSpaceChange,
  spaces,
}) => {
  const [isResizing, setIsResizing] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(getInitialSidebarWidth)
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showUserPanel, setShowUserPanel] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [activeChannel, setActiveChannel] = useState<SpaceChannel | null>(null)

  const currentSpace = activeSpace ?? null

  const call = useCall()

  const [micContextMenu, setMicContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [speakerContextMenu, setSpeakerContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [micVolume, setMicVolume] = useState(100)
  const [speakerVolume, setSpeakerVolume] = useState(100)

  const sidebarRef = useRef<HTMLElement>(null)
  const userPanelRef = useRef<HTMLDivElement>(null)
  const userSectionRef = useRef<HTMLDivElement>(null)
  const cursorPos = useRef({ x: 0 })
  const sidebarInitialWidth = useRef(0)

  const { t } = useTranslation(["sidebar", "call", "settings"])
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showUserPanel &&
        userPanelRef.current &&
        userSectionRef.current &&
        !userPanelRef.current.contains(e.target as Node) &&
        !userSectionRef.current.contains(e.target as Node)
      ) {
        setShowUserPanel(false)
      }
    }
    if (showUserPanel) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showUserPanel])

  const handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = useCallback((event) => {
    setIsResizing(true)
    cursorPos.current.x = event.clientX
    sidebarInitialWidth.current = sidebarRef.current?.clientWidth || SIDEBAR_INITIAL_WIDTH
  }, [])

  const handleChatClick = useCallback(
    (chatId: string) => {
      navigate(`/chat/${chatId}`)
    },
    [navigate],
  )

  const handleSpaceSelect = useCallback((space: Space) => {
    onSpaceChange?.(space)
    setShowSearchModal(false)
    navigate(`/space/${space.id}`)
  }, [onSpaceChange, navigate])

  const handleSpaceClick = useCallback((space: Space) => {
    onSpaceChange?.(space)
    navigate(`/space/${space.id}`)
  }, [onSpaceChange, navigate])

  const handleCreateSpace = useCallback(() => {
    navigate("/spaces/create")
  }, [navigate])

  const handleChannelSelect = useCallback((channelId: string) => {
    setActiveChannel((prev) => (prev?.id === channelId ? prev : { ...prev!, id: channelId } as SpaceChannel))
    navigate(`/space/${currentSpace?.id}/channel/${channelId}`)
  }, [navigate, currentSpace])

  const handleSearchOpen = useCallback(() => {
    setShowSearchModal(true)
  }, [])

  const handleMicSelect = useCallback((deviceId: string) => {
    void call.setAudioDevice(deviceId)
  }, [call])

  const handleSpeakerSelect = useCallback((deviceId: string) => {
    void call.setAudioOutputDevice(deviceId)
  }, [call])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (event: MouseEvent) => {
      const cursorXDelta = event.clientX - cursorPos.current.x
      const newWidth = Math.max(
        SIDEBAR_MIN_WIDTH,
        Math.min(sidebarInitialWidth.current + cursorXDelta, SIDEBAR_MAX_WIDTH),
      )
      setSidebarWidth(newWidth)
      window.localStorage.setItem("sidebarWidth", String(newWidth))
    }

    const handleMouseUp = () => setIsResizing(false)

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  const micDevices: AudioDevice[] = call.audioInputDevices.map((d) => ({
    deviceId: d.id,
    label: d.name,
    kind: "audioinput",
  }))
  const speakerDevices: AudioDevice[] = call.audioOutputDevices.map((d) => ({
    deviceId: d.id,
    label: d.name,
    kind: "audiooutput",
  }))

  const statusLabel = call.isConnected
    ? `${t("call:speaking")} – ${call.roomName}`
    : user.status

  const userStatus = (profileUser.status ?? "online") as "online" | "dnd" | "inactive" | "offline" | "invisible"

  return (
    <aside
      ref={sidebarRef}
      className={cn("sidebar", { "sidebar--resizing": isResizing })}
      style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}
    >
      <div className="sidebar__container">
        {/* ── Search ── */}
        <div className="top-buttons">
          <button className="search-button" onClick={handleSearchOpen}>
            <Search size={16} />
            <span className="search-button-text">{t("sidebar:search")}</span>
          </button>
        </div>

        {/* ── Space Bar ── */}
        <section className="space-bar">
          <div className="space-bar__list">
            {spaces.map((space) => (
              <button
                key={space.id}
                className={cn("space-bar__item", {
                  "space-bar__item--active": activeSpace?.id === space.id,
                })}
                onClick={() => handleSpaceClick(space)}
              >
                {space.avatar ? (
                  <Avatar size={48} src={space.avatar} alt={space.name} rounded />
                ) : (
                  <div className="space-bar__fallback">
                    <MessageSquare size={20} />
                  </div>
                )}
              </button>
            ))}
            <Tooltip content="Create a Space" placement="right">
              <button
                className="space-bar__item space-bar__add"
                onClick={handleCreateSpace}
              >
                <Plus size={20} />
              </button>
            </Tooltip>
          </div>
        </section>

        {/* ── Chats section ── */}
        <section className="section">
          <div className="chat-header">
            <small className="section-title">{t("sidebar:chats")}</small>
            <Tooltip content="New message or group" placement="top">
              <button
                className="top-button"
                onClick={() => setShowNewChatModal(true)}
              >
                <Plus size={14} />
              </button>
            </Tooltip>
          </div>

          <div className="chats">
            {chats.length === 0 ? (
              <div className="chats-empty">
                <MessageSquare size={40} className="chats-empty-icon" />
                <p className="chats-empty-title">No conversations yet</p>
                <p className="chats-empty-subtitle">Start a new conversation or join a channel</p>
                <Button theme="outline" onClick={() => setShowNewChatModal(true)}>
                  <Plus size={14} />
                  Start a Conversation
                </Button>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  className="chat-item"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <Avatar size={36} src={chat.avatar} alt={chat.name} rounded />
                  <div className="chat-info">
                    <div className="chat-name">{chat.name}</div>
                    <div className="chat-status">{chat.status}</div>
                  </div>
                  <span
                    className="chat-close-button"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <X size={14} />
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        {/* ── Inline user panel (slides up) ── */}
        <div
          ref={userPanelRef}
          className={cn("sidebar-user-panel", { "sidebar-user-panel--open": showUserPanel })}
        >
          <div className="sidebar-user-panel__banner" />

          <div className="sidebar-user-panel__avatar-row">
            <div className="sidebar-user-panel__avatar-wrap">
              <Avatar size={52} src={profileUser.avatar.src} alt={profileUser.nickname} status={userStatus} />
            </div>
            <button className="sidebar-user-panel__status-btn">
              <Plus size={10} />
              {t("settings:add_status") || "Set status"}
            </button>
          </div>

          {/* Icon-only badges */}
          <div className="sidebar-user-panel__badges">
            {USER_BADGES.map((badge) => (
              <Tooltip key={badge.id} content={badge.label} placement="top">
                <span
                  className="sidebar-user-panel__badge-icon"
                  style={{ "--badge-color": badge.color } as React.CSSProperties}
                >
                  {badge.icon}
                </span>
              </Tooltip>
            ))}
          </div>

          <div className="sidebar-user-panel__info">
            <div className="sidebar-user-panel__name">{profileUser.nickname}</div>
            <div className="sidebar-user-panel__username">@{profileUser.username}</div>
            {profileUser.bio && (
              <div className="sidebar-user-panel__bio">{profileUser.bio}</div>
            )}
          </div>

          <div className="sidebar-user-panel__actions">
            <button
              className="sidebar-user-panel__action-btn sidebar-user-panel__action-btn--primary"
              onClick={() => { setShowUserPanel(false); onOpenProfile?.() }}
            >
              <User size={12} />
              My Profile
            </button>
            <button
              className="sidebar-user-panel__action-btn"
              onClick={() => { setShowUserPanel(false); onOpenSettings?.() }}
            >
              <Settings size={12} />
              Settings
            </button>
          </div>
        </div>

        {/* ── User section (single button) ── */}
        <div ref={userSectionRef} className="user-section">
          <button
            className={cn("user-section__btn", { "user-section__btn--active": showUserPanel })}
            onClick={() => setShowUserPanel((v) => !v)}
          >
            <Avatar size={32} src={user.avatar} alt={user.name} status={userStatus} />
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className={cn("user-status", { "user-status--in-call": call.isConnected })}>
                {statusLabel}
              </div>
            </div>
            <ChevronUp
              size={13}
              className={cn("user-section__chevron", {
                "user-section__chevron--open": showUserPanel,
              })}
            />
          </button>
        </div>
      </div>

      <button type="button" className="sidebar__handle" onMouseDown={handleMouseDown} />

      <CommandMenu isOpen={showCommandMenu} onClose={() => setShowCommandMenu(false)} />

      <SearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSpaceSelect={handleSpaceSelect}
        onUserSelect={(user) => {
          console.log("Selected user:", user)
          setShowSearchModal(false)
        }}
      />

      <NewChatModal
        visible={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        chats={chats}
        onSelectChat={handleChatClick}
      />

      <DeviceContextMenu
        isOpen={!!micContextMenu}
        position={micContextMenu || { x: 0, y: 0 }}
        onClose={() => setMicContextMenu(null)}
        type="microphone"
        inputDevices={micDevices}
        outputDevices={speakerDevices}
        selectedInputDeviceId={call.selectedAudioInput}
        selectedOutputDeviceId={call.selectedAudioOutput}
        volume={micVolume}
        onInputDeviceSelect={handleMicSelect}
        onOutputDeviceSelect={handleSpeakerSelect}
        onVolumeChange={setMicVolume}
        onOpenSettings={() => { setMicContextMenu(null); onOpenSettings?.() }}
      />

      <DeviceContextMenu
        isOpen={!!speakerContextMenu}
        position={speakerContextMenu || { x: 0, y: 0 }}
        onClose={() => setSpeakerContextMenu(null)}
        type="speaker"
        inputDevices={micDevices}
        outputDevices={speakerDevices}
        selectedInputDeviceId={call.selectedAudioInput}
        selectedOutputDeviceId={call.selectedAudioOutput}
        volume={speakerVolume}
        onInputDeviceSelect={handleMicSelect}
        onOutputDeviceSelect={handleSpeakerSelect}
        onVolumeChange={setSpeakerVolume}
        onOpenSettings={() => { setSpeakerContextMenu(null); onOpenSettings?.() }}
      />
    </aside>
  )
}

export default MainSidebar
