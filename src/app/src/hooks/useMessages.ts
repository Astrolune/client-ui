import { useCallback, useMemo, useState } from "react"
import { api, type MessageDto } from "../lib/api-client"
import { invoke, isHostBridgeAvailable } from "../lib/host/bridge"

interface UseMessagesState {
  loading: boolean
  error: string | null
}

export function useMessages() {
  const [state, setState] = useState<UseMessagesState>({
    loading: false,
    error: null,
  })
  const [messages, setMessages] = useState<MessageDto[] | null>(null)

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setState({ loading: true, error: null })
    try {
      const result = await fn()
      setState({ loading: false, error: null })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed"
      setState({ loading: false, error: message })
      throw error
    }
  }, [])

  const getMessages = useCallback(
    async (channelId: string, limit = 100, before?: string) => {
      const result = await run(async () => {
        if (isHostBridgeAvailable()) {
          try {
            return await invoke<MessageDto[]>("chat.messages.list", { channelId, limit, before })
          } catch {
            // fallback to direct API for environments without module support
          }
        }

        return api.messages.listChannelMessages(channelId, limit, before)
      })
      setMessages(result)
      return result
    },
    [run],
  )

  const sendMessage = useCallback(
    async (channelId: string, content: string, attachments?: string[]) =>
      run(async () => {
        if (isHostBridgeAvailable()) {
          try {
            return await invoke<MessageDto>("chat.messages.create", { channelId, content, attachments })
          } catch {
            // fallback
          }
        }

        return api.messages.create({ channelId, content, attachments })
      }),
    [run],
  )

  const updateMessage = useCallback(
    async (channelId: string, messageId: string, content: string) =>
      run(async () => {
        if (isHostBridgeAvailable()) {
          try {
            return await invoke<MessageDto>("chat.messages.update", { channelId, messageId, content })
          } catch {
            // fallback
          }
        }

        return api.messages.update(channelId, messageId, { content })
      }),
    [run],
  )

  const deleteMessage = useCallback(
    async (channelId: string, messageId: string) =>
      run(async () => {
        if (isHostBridgeAvailable()) {
          try {
            return await invoke<{ ok: boolean }>("chat.messages.delete", { channelId, messageId })
          } catch {
            // fallback
          }
        }

        return api.messages.remove(channelId, messageId)
      }),
    [run],
  )

  const addReaction = useCallback(
    async (channelId: string, messageId: string, emoji: string) =>
      run(async () => {
        if (isHostBridgeAvailable()) {
          try {
            return await invoke<{ ok: boolean }>("chat.messages.add_reaction", { channelId, messageId, emoji })
          } catch {
            // fallback
          }
        }

        return api.messages.addReaction(channelId, messageId, emoji)
      }),
    [run],
  )

  const removeReaction = useCallback(
    async (channelId: string, messageId: string, emoji: string) =>
      run(async () => {
        if (isHostBridgeAvailable()) {
          try {
            return await invoke<{ ok: boolean }>("chat.messages.remove_reaction", { channelId, messageId, emoji })
          } catch {
            // fallback
          }
        }

        return api.messages.removeReaction(channelId, messageId, emoji)
      }),
    [run],
  )

  return useMemo(
    () => ({
      getConversations: async () => [] as { id: string; title: string }[],
      getMessages,
      getUnreadCount: async () => ({ count: 0 }),
      sendMessage,
      markAsRead: async (_messageIds: string[]) => ({ ok: true }),
      updateMessage,
      deleteMessage,
      addReaction,
      removeReaction,
      conversations: null as null,
      messages,
      unreadCount: 0,
      loading: state.loading,
      error: state.error,
    }),
    [
      addReaction,
      deleteMessage,
      getMessages,
      messages,
      removeReaction,
      sendMessage,
      state.error,
      state.loading,
      updateMessage,
    ],
  )
}
