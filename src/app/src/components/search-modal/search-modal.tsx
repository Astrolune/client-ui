import { useCallback, useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { XIcon, SearchIcon, GlobeIcon } from "@primer/octicons-react"
import { Users, Hash, X, LayoutGrid, List } from "lucide-react"
import cn from "classnames"
import { Backdrop } from "../backdrop/backdrop"
import { Avatar } from "../avatar/avatar"
import { TextField } from "../text-field/text-field"
import type { Space, User as UserType } from "../../types"
import "./search-modal.scss"

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SPACES: Space[] = [
  {
    id: "space-1",
    name: "Gaming Hub",
    avatar: null,
    banner: null,
    description: "A place for gamers to connect and share",
    ownerId: "user-1",
    memberCount: 1243,
    createdAt: "2024-01-01",
    categories: [],
    roles: [],
  },
  {
    id: "space-2",
    name: "Dev Community",
    avatar: null,
    banner: null,
    description: "For developers by developers",
    ownerId: "user-2",
    memberCount: 567,
    createdAt: "2024-02-01",
    categories: [],
    roles: [],
  },
  {
    id: "space-3",
    name: "Art & Design",
    avatar: null,
    banner: null,
    description: "Creative minds unite",
    ownerId: "user-3",
    memberCount: 892,
    createdAt: "2024-03-01",
    categories: [],
    roles: [],
  },
]

const MOCK_USERS: UserType[] = [
  { id: "u1", name: "Alex", avatar: null, status: "online" },
  { id: "u2", name: "Sarah", avatar: null, status: "dnd" },
  { id: "u3", name: "Mike", avatar: null, status: "offline" },
  { id: "u4", name: "Emma", avatar: null, status: "online" },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchCategory = "spaces" | "users" | "groups"

interface SearchCategoryItem {
  id: SearchCategory
  label: string
  icon: React.ReactNode
}

const SEARCH_CATEGORIES: SearchCategoryItem[] = [
  { id: "spaces", label: "Spaces", icon: <GlobeIcon size={14} /> },
  { id: "users", label: "Users", icon: <Users size={14} /> },
  { id: "groups", label: "Groups", icon: <Hash size={14} /> },
]

// ─── Component ────────────────────────────────────────────────────────────────

export interface SearchModalProps {
  visible: boolean
  onClose: () => void
  onSpaceSelect?: (space: Space) => void
  onUserSelect?: (user: UserType) => void
}

export function SearchModal({
  visible,
  onClose,
  onSpaceSelect,
  onUserSelect,
}: SearchModalProps) {
  const { t } = useTranslation("search")
  const [isClosing, setIsClosing] = useState(false)
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("spaces")
  const [query, setQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const modalRef = useRef<HTMLDivElement | null>(null)
  const backdropClicked = useRef(false)

  const handleClose = useCallback(() => {
    if (isClosing) return
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
  }, [onClose, isClosing])

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      backdropClicked.current = true
      handleClose()
    }
  }, [handleClose])

  useEffect(() => {
    if (visible) {
      setQuery("")
      setActiveCategory("spaces")
      backdropClicked.current = false
    }
  }, [visible])

  useEffect(() => {
    if (visible) {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !isClosing) {
          handleClose()
        }
      }
      window.addEventListener("keydown", onKeyDown)
      return () => window.removeEventListener("keydown", onKeyDown)
    }
    return () => {}
  }, [visible, handleClose, isClosing])

  if (!visible && !isClosing) return null

  const filteredSpaces = MOCK_SPACES.filter((s) =>
    !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.description.toLowerCase().includes(query.toLowerCase())
  )
  const filteredUsers = MOCK_USERS.filter((u) =>
    !query || u.name.toLowerCase().includes(query.toLowerCase())
  )

  const categoryTitle = SEARCH_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? ""

  return createPortal(
    <Backdrop visible={visible} isClosing={isClosing} onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className={cn("search-modal", { "search-modal--closing": isClosing })}
        role="dialog"
        aria-label={t("search")}
      >
        {/* ── Sidebar ── */}
        <aside className="search-sidebar">
          <div className="search-sidebar__search">
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              theme="dark"
            />
          </div>

          <nav className="search-sidebar__nav">
            {SEARCH_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={cn("search-sidebar__nav-item", {
                  "search-sidebar__nav-item--active": activeCategory === cat.id,
                })}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <section className="search-content">
          <header className="search-content__header">
            <h2 className="search-content__title">{categoryTitle}</h2>
            
            {activeCategory === "spaces" && filteredSpaces.length > 0 && (
              <div className="search-content__view-toggle">
                <button
                  className={cn("search-content__view-toggle-btn", {
                    "search-content__view-toggle-btn--active": viewMode === "grid",
                  })}
                  onClick={() => setViewMode("grid")}
                  aria-label={t("grid_view")}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  className={cn("search-content__view-toggle-btn", {
                    "search-content__view-toggle-btn--active": viewMode === "list",
                  })}
                  onClick={() => setViewMode("list")}
                  aria-label={t("list_view")}
                >
                  <List size={16} />
                </button>
              </div>
            )}

            <button
              className="search-content__close"
              onClick={handleClose}
              aria-label="Close search"
            >
              <XIcon size={18} />
            </button>
          </header>

          <div className="search-content__body">
            {/* ── Spaces ── */}
            {activeCategory === "spaces" && (
              <div className="search-section">
                {filteredSpaces.length === 0 ? (
                  <div className="search-empty">
                    <GlobeIcon size={28} />
                    <p>{query ? t("no_spaces_found") : t("no_spaces_yet")}</p>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="space-grid">
                    {filteredSpaces.map((space) => (
                      <button
                        key={space.id}
                        className="space-grid-card"
                        onClick={() => onSpaceSelect?.(space)}
                      >
                        <div className="space-grid-card__banner">
                          {space.banner ? (
                            <img
                              src={space.banner}
                              alt={space.name}
                              className="space-grid-card__banner-image"
                            />
                          ) : null}
                          <div className="space-grid-card__banner-overlay">
                            <span>View</span>
                          </div>
                        </div>

                        <div className="space-grid-card__avatar-wrapper">
                          <div className="space-grid-card__avatar">
                            {space.avatar ? (
                              <img src={space.avatar} alt={space.name} />
                            ) : (
                              <GlobeIcon size={24} />
                            )}
                          </div>
                        </div>

                        <div className="space-grid-card__content">
                          <h3 className="space-grid-card__name">{space.name}</h3>
                          <div className="space-grid-card__members">
                            <span className="space-grid-card__members-dot" />
                            <span>{space.memberCount.toLocaleString()}</span>
                          </div>
                          {space.description && (
                            <p className="space-grid-card__description">{space.description}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  filteredSpaces.map((space) => (
                    <button
                      key={space.id}
                      className="space-card"
                      onClick={() => onSpaceSelect?.(space)}
                    >
                      <div className="space-card__avatar">
                        {space.avatar ? (
                          <img src={space.avatar} alt={space.name} />
                        ) : (
                          <GlobeIcon size={28} />
                        )}
                      </div>

                      <div className="space-card__content">
                        <div className="space-card__header">
                          <h3 className="space-card__name">{space.name}</h3>
                          <div className="space-card__members">
                            <span className="space-card__members-dot" />
                            <span>{space.memberCount.toLocaleString()}</span>
                          </div>
                        </div>

                        {space.description && (
                          <p className="space-card__description">{space.description}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ── Users/Friends ── */}
            {activeCategory === "users" && (
              <div className="search-section">
                {filteredUsers.length === 0 ? (
                  <div className="search-empty">
                    <Users size={28} />
                    <p>{query ? t("no_users_found") : t("no_friends_yet")}</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      className="list-item"
                      onClick={() => onUserSelect?.(user)}
                    >
                      <div className="list-item__avatar">
                        <Avatar size={40} src={user.avatar} alt={user.name} status={user.status as any} />
                      </div>
                      <div className="list-item__content">
                        <div className="list-item__name">{user.name}</div>
                        <div className="list-item__subtitle">{user.status}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ── Groups ── */}
            {activeCategory === "groups" && (
              <div className="search-section">
                <div className="search-empty">
                  <Hash size={28} />
                  <p>{t("no_groups_yet")}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </Backdrop>,
    document.body,
  )
}