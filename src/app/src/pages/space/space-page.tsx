import { useState, useCallback, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { SpaceSidebar } from "../../components/space-sidebar/space-sidebar"
import { SpaceSettingsModal } from "../../components/space-settings-modal/space-settings-modal"
import { ChatPage } from "../../pages/chat/chat"
import { toUserData } from "../../lib/auth/user-data"
import { useAuthSession } from "../../contexts/auth-context"
import type { Space, SpaceChannel } from "../../types"

// Mock space data - replace with API later
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
    categories: [
      {
        id: "cat-1",
        spaceId: "space-1",
        name: "Information",
        position: 0,
        collapsed: false,
        channels: [
          { id: "ch-1", spaceId: "space-1", name: "rules", type: "text", position: 0, parentId: "cat-1", description: "Server rules" },
          { id: "ch-2", spaceId: "space-1", name: "announcements", type: "text", position: 1, parentId: "cat-1" },
        ],
      },
      {
        id: "cat-2",
        spaceId: "space-1",
        name: "Text Channels",
        position: 1,
        collapsed: false,
        channels: [
          { id: "ch-3", spaceId: "space-1", name: "general", type: "text", position: 0, parentId: "cat-2" },
          { id: "ch-4", spaceId: "space-1", name: "gaming", type: "text", position: 1, parentId: "cat-2" },
        ],
      },
      {
        id: "cat-3",
        spaceId: "space-1",
        name: "Voice Channels",
        position: 2,
        collapsed: false,
        channels: [
          { id: "ch-5", spaceId: "space-1", name: "General Voice", type: "voice", position: 0, parentId: "cat-3" },
          { id: "ch-6", spaceId: "space-1", name: "Gaming", type: "voice", position: 1, parentId: "cat-3" },
        ],
      },
    ],
    roles: [],
  },
]

export function SpacePage() {
  const { spaceId, channelId } = useParams<{ spaceId: string; channelId: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuthSession()
  const currentUser = useMemo(() => toUserData(authUser), [authUser])

  const [showSettings, setShowSettings] = useState(false)
  const [activeChannelId, setActiveChannelId] = useState<string | null>(channelId ?? null)

  const space = MOCK_SPACES.find((s) => s.id === spaceId) ?? null

  // Sync URL channelId with state
  useEffect(() => {
    if (channelId) {
      setActiveChannelId(channelId)
    }
  }, [channelId])

  const handleChannelSelect = useCallback((channelId: string) => {
    setActiveChannelId(channelId)
    navigate(`/space/${spaceId}/channel/${channelId}`)
  }, [spaceId, navigate])

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true)
  }, [])

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false)
  }, [])

  const handleSaveSpace = useCallback((updates: Partial<Space>) => {
    console.log("Saving space updates:", updates)
    // TODO: API call to save
  }, [])

  // Find active channel info
  const activeChannel = useMemo(() => {
    if (!space || !activeChannelId) return null
    return space.categories
      .flatMap((c) => c.channels)
      .find((ch) => ch.id === activeChannelId) ?? null
  }, [space, activeChannelId])

  if (!space) {
    return (
      <div className="space-page__not-found">
        <h2>Space not found</h2>
        <button onClick={() => navigate("/")}>Go back home</button>
      </div>
    )
  }

  return (
    <div className="space-page">
      <SpaceSidebar
        space={space}
        activeChannelId={activeChannelId}
        onChannelSelect={handleChannelSelect}
        onOpenSettings={handleOpenSettings}
      />

      <div className="space-page__content">
        {activeChannel ? (
          activeChannel.type === "text" ? (
            <ChatPage
              currentUser={currentUser}
              channelId={activeChannel.id}
              channelName={activeChannel.name}
              spaceName={space.name}
            />
          ) : (
            <div className="space-page__voice-channel">
              <h2>🔊 {activeChannel.name}</h2>
              <p>Voice channel — join from the InCallPanel</p>
            </div>
          )
        ) : (
          <div className="space-page__welcome">
            <h1>Welcome to {space.name}</h1>
            <p>{space.description}</p>
          </div>
        )}
      </div>

      <SpaceSettingsModal
        visible={showSettings}
        space={space}
        onClose={handleCloseSettings}
        onSave={handleSaveSpace}
      />
    </div>
  )
}
