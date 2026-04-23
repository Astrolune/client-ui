import { useCallback, useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { XIcon, ImageIcon, ShieldIcon, KeyIcon, TrashIcon } from "@primer/octicons-react"
import { Bell, Users, Save, SaveIcon, ChevronLeft, ChevronRight } from "lucide-react"
import cn from "classnames"
import { Backdrop } from "../backdrop/backdrop"
import { Avatar } from "../avatar/avatar"
import { Button } from "../button/button"
import { TextField } from "../text-field/text-field"
import type { Space } from "../../types"
import "./space-settings-modal.scss"

// ─── Settings Categories ─────────────────────────────────────────────────────

interface SpaceSettingsItem {
  id: string
  label: string
  icon: React.ReactNode
}

interface SpaceSettingsCategory {
  title: string
  items: SpaceSettingsItem[]
}

const SPACE_SETTINGS_CATEGORIES: SpaceSettingsCategory[] = [
  {
    title: "space_settings",
    items: [
      { id: "overview", label: "overview", icon: <ImageIcon size={18} /> },
      { id: "roles", label: "roles_permissions", icon: <ShieldIcon size={18} /> },
      { id: "moderation", label: "moderation", icon: <KeyIcon size={18} /> },
    ],
  },
  {
    title: "integrations",
    items: [
      { id: "notifications", label: "notifications", icon: <Bell size={18} /> },
      { id: "members", label: "members", icon: <Users size={18} /> },
    ],
  },
  {
    title: "danger_zone",
    items: [
      { id: "delete", label: "delete_space", icon: <TrashIcon size={18} /> },
    ],
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SpaceSettingsModalProps {
  visible: boolean
  space: Space | null
  onClose: () => void
  onSave?: (updates: Partial<Space>) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpaceSettingsModal({
  visible,
  space,
  onClose,
  onSave,
}: SpaceSettingsModalProps) {
  const { t } = useTranslation("space_settings")
  const [isClosing, setIsClosing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")
  const [spaceName, setSpaceName] = useState("")
  const [spaceDescription, setSpaceDescription] = useState("")

  useEffect(() => {
    if (visible && space) {
      setSpaceName(space.name)
      setSpaceDescription(space.description)
      setActiveSection("overview")
    }
  }, [visible, space])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    const zero = performance.now()
    requestAnimationFrame(function animateClosing(time) {
      if (time - zero <= 200) {
        requestAnimationFrame(animateClosing)
      } else {
        onClose()
        setIsClosing(false)
      }
    })
  }, [onClose])

  const handleSave = useCallback(() => {
    if (space) {
      onSave?.({
        ...space,
        name: spaceName,
        description: spaceDescription,
      })
      handleClose()
    }
  }, [space, spaceName, spaceDescription, onSave, handleClose])

  useEffect(() => {
    if (visible) {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") handleClose()
      }
      window.addEventListener("keydown", onKeyDown)
      return () => window.removeEventListener("keydown", onKeyDown)
    }
    return () => {}
  }, [visible, handleClose])

  if (!visible && !isClosing) return null

  return createPortal(
    <Backdrop isClosing={isClosing}>
      <div
        className={cn("space-settings-modal", {
          "space-settings-modal--closing": isClosing,
        })}
        role="dialog"
        aria-label={t("space_settings")}
      >
        {/* ── Header ── */}
        <div className="space-settings-modal__header">
          <h3>{t("space_settings")}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="space-settings-modal__close-button"
            aria-label={t("close")}
          >
            <XIcon size={24} />
          </button>
        </div>

        <div className="space-settings-modal__body">
          {/* ── Sidebar ── */}
          <div className={cn("space-settings-modal__sidebar", {
            "space-settings-modal__sidebar--collapsed": isCollapsed,
          })}>
            {space && (
              <div className={cn("space-settings-modal__space-info", {
                "space-settings-modal__space-info--collapsed": isCollapsed,
              })}>
                <Avatar size={48} src={space.avatar} alt={space.name} />
                {!isCollapsed && (
                  <div className="space-settings-modal__space-name">{space.name}</div>
                )}
              </div>
            )}

            <button
              type="button"
              className="space-settings-modal__collapse-toggle"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? t("expand_sidebar") : t("collapse_sidebar")}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {SPACE_SETTINGS_CATEGORIES.map((category) => (
              <div key={category.title} className="space-settings-modal__category-group">
                {!isCollapsed && (
                  <div className="space-settings-modal__category-title">
                    {t(category.title)}
                  </div>
                )}
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    className={cn("space-settings-modal__sidebar-item", {
                      "space-settings-modal__sidebar-item--active":
                        activeSection === item.id,
                      "space-settings-modal__sidebar-item--collapsed": isCollapsed,
                    })}
                    onClick={() => setActiveSection(item.id)}
                    title={isCollapsed ? t(item.label) : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && <span>{t(item.label)}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* ── Content ── */}
          <div className="space-settings-modal__content">
            <div className="space-settings-modal__content-header">
              <h2>{t(activeSection)}</h2>
            </div>

            <div className="space-settings-modal__content-body">
              {activeSection === "overview" && (
                <div className="space-settings-form">
                  <div className="space-settings-form__banner">
                    <div className="space-settings-form__banner-placeholder">
                      <ImageIcon size={32} />
                      <span>{t("upload_banner")}</span>
                    </div>
                  </div>

                  <div className="space-settings-form__avatar">
                    <Avatar size={80} src={space?.avatar} alt={space?.name} />
                    <button className="space-settings-form__avatar-edit">
                      <ImageIcon size={16} />
                    </button>
                  </div>

                  <TextField
                    label={t("space_name")}
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    placeholder="My Awesome Space"
                  />

                  <TextField
                    label={t("space_description")}
                    value={spaceDescription}
                    onChange={(e) => setSpaceDescription(e.target.value)}
                    placeholder="What is this Space about?"
                  />

                  <div className="space-settings-form__actions">
                    <Button theme="outline" onClick={handleClose}>
                      {t("cancel")}
                    </Button>
                    <Button theme="primary" onClick={handleSave}>
                      <SaveIcon size={16} />
                      {t("save_changes")}
                    </Button>
                  </div>
                </div>
              )}

              {activeSection === "roles" && (
                <div className="space-settings-placeholder">
                  <ShieldIcon size={48} />
                  <h3>{t("roles_coming_soon")}</h3>
                  <p>{t("roles_coming_soon_desc")}</p>
                </div>
              )}

              {activeSection === "moderation" && (
                <div className="space-settings-placeholder">
                  <KeyIcon size={48} />
                  <h3>{t("moderation_coming_soon")}</h3>
                  <p>{t("moderation_coming_soon_desc")}</p>
                </div>
              )}

              {activeSection === "delete" && (
                <div className="space-settings-placeholder space-settings-placeholder--danger">
                  <TrashIcon size={48} />
                  <h3>{t("delete_space_warning")}</h3>
                  <p>{t("delete_space_warning_desc")}</p>
                  <Button theme="danger">{t("delete_space")}</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Backdrop>,
    document.body
  )
}
