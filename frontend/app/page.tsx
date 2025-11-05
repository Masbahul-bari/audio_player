"use client"

import { useState, useEffect, useCallback } from "react"
import Sidebar from "@/components/sidebar"
import PlaylistPanel from "@/components/playlist-panel"
import TrackLibraryPanel from "@/components/track-library-panel"
import NowPlayingBar from "@/components/now-playing-bar"
import ConnectionStatus from "@/components/connection-status"
import { api, type Track, type PlaylistTrack } from "@/lib/api"
import { useWebSocket, type WebSocketEvent } from "@/hooks/use-websocket"
import { calculatePosition, getPlaylistBounds } from "@/lib/position-utils"

// Transform API data to component format
function transformPlaylistTrack(pt: PlaylistTrack): any {
  return {
    id: pt.id,
    title: pt.track.title,
    artist: pt.track.artist,
    album: pt.track.album || "",
    duration: pt.track.duration_seconds,
    genre: pt.track.genre || "",
    addedBy: pt.added_by,
    addedTime: formatTimeAgo(pt.added_at),
    votes: pt.votes,
    isPlaying: pt.is_playing,
    cover: pt.track.cover_url || "/placeholder.jpg",
    position: pt.position,
    track_id: pt.track_id,
  }
}

function transformLibraryTrack(track: Track, inPlaylist: boolean): any {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    duration: track.duration_seconds,
    genre: track.genre || "",
    cover: track.cover_url || "/placeholder.jpg",
    inPlaylist,
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
}

export default function Home() {
  const [isOnline, setIsOnline] = useState(true)
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([])
  const [libraryTracks, setLibraryTracks] = useState<any[]>([])
  const [durationElapsed, setDurationElapsed] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [tracks, playlist] = await Promise.all([
        api.getTracks(),
        api.getPlaylist(),
      ])

      // Transform playlist tracks
      const transformedPlaylist = playlist
        .sort((a, b) => a.position - b.position)
        .map(transformPlaylistTrack)

      // Transform library tracks and mark which are in playlist
      const playlistTrackIds = new Set(playlist.map((pt) => pt.track_id))
      const transformedLibrary = tracks.map((track) =>
        transformLibraryTrack(track, playlistTrackIds.has(track.id))
      )

      setPlaylistTracks(transformedPlaylist)
      setLibraryTracks(transformedLibrary)
    } catch (err: any) {
      console.error("Failed to load data:", err)
      setError(err?.error?.message || "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // WebSocket connection for realtime updates
  const { isConnected: wsConnected } = useWebSocket({
    onMessage: (event: WebSocketEvent) => {
      handleWebSocketEvent(event)
    },
    onOpen: () => {
      setIsOnline(true)
    },
    onClose: () => {
      setIsOnline(false)
    },
    onError: () => {
      setIsOnline(false)
    },
  })

  // Handle WebSocket events
  const handleWebSocketEvent = useCallback((event: WebSocketEvent) => {
    switch (event.type) {
      case "track.added":
        if (event.item) {
          const newTrack = transformPlaylistTrack(event.item)
          setPlaylistTracks((prev) => {
            const updated = [...prev, newTrack].sort((a, b) => a.position - b.position)
            return updated
          })
          // Update library to mark track as in playlist
          setLibraryTracks((prev) =>
            prev.map((t) =>
              t.id === event.item!.track_id ? { ...t, inPlaylist: true } : t
            )
          )
        }
        break

      case "track.removed":
        if (event.id) {
          setPlaylistTracks((prev) => prev.filter((t) => t.id !== event.id))
          // Update library - find which track was removed
          const removedTrack = playlistTracks.find((t) => t.id === event.id)
          if (removedTrack) {
            setLibraryTracks((prev) =>
              prev.map((t) =>
                t.id === removedTrack.track_id ? { ...t, inPlaylist: false } : t
              )
            )
          }
        }
        break

      case "track.moved":
        if (event.item) {
          setPlaylistTracks((prev) =>
            prev
              .map((t) =>
                t.id === event.item!.id
                  ? { ...t, position: event.item!.position }
                  : t
              )
              .sort((a, b) => a.position - b.position)
          )
        }
        break

      case "track.voted":
        if (event.item) {
          setPlaylistTracks((prev) =>
            prev.map((t) =>
              t.id === event.item!.id ? { ...t, votes: event.item!.votes } : t
            )
          )
        }
        break

      case "track.playing":
        if (event.id) {
          setPlaylistTracks((prev) =>
            prev.map((t) => ({
              ...t,
              isPlaying: t.id === event.id,
            }))
          )
          setDurationElapsed(0)
        }
        break

      case "playlist.reordered":
        if (event.items) {
          const reordered = event.items
            .map(transformPlaylistTrack)
            .sort((a, b) => a.position - b.position)
          setPlaylistTracks(reordered)
        }
        break

      case "ping":
        // Heartbeat - no action needed
        break
    }
  }, [playlistTracks])

  // Simulate playback progression
  useEffect(() => {
    const interval = setInterval(() => {
      setDurationElapsed((prev) => {
        const currentTrack = playlistTracks.find((t) => t.isPlaying)
        if (currentTrack && prev < currentTrack.duration) {
          return prev + 1
        }
        // Auto-advance to next track
        if (currentTrack && prev >= currentTrack.duration) {
          handleSkipTrack()
          return 0
        }
        return 0
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [playlistTracks])

  const handleAddToPlaylist = async (track: any) => {
    try {
      const addedTrack = await api.addToPlaylist(track.id, "You")
      // WebSocket will handle the update, but we can optimistically update
      const newTrack = transformPlaylistTrack(addedTrack)
      setPlaylistTracks((prev) => {
        const updated = [...prev, newTrack].sort((a, b) => a.position - b.position)
        return updated
      })
      setLibraryTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, inPlaylist: true } : t))
      )
    } catch (err: any) {
      console.error("Failed to add track:", err)
      if (err?.error?.code === "DUPLICATE_TRACK") {
        alert("This track is already in the playlist")
      } else {
        alert("Failed to add track to playlist")
      }
    }
  }

  const handleRemoveTrack = async (trackId: string) => {
    try {
      await api.removeFromPlaylist(trackId)
      // WebSocket will handle the update
      setPlaylistTracks((prev) => prev.filter((t) => t.id !== trackId))
      const removedTrack = playlistTracks.find((t) => t.id === trackId)
      if (removedTrack) {
        setLibraryTracks((prev) =>
          prev.map((t) =>
            t.id === removedTrack.track_id ? { ...t, inPlaylist: false } : t
          )
        )
      }
    } catch (err) {
      console.error("Failed to remove track:", err)
      alert("Failed to remove track from playlist")
    }
  }

  const handleVote = async (trackId: string, voteType: "up" | "down") => {
    try {
      await api.vote(trackId, voteType)
      // WebSocket will handle the update
      setPlaylistTracks((prev) =>
        prev.map((t) =>
          t.id === trackId
            ? { ...t, votes: voteType === "up" ? t.votes + 1 : t.votes - 1 }
            : t
        )
      )
    } catch (err) {
      console.error("Failed to vote:", err)
    }
  }

  const handleReorderTracks = async (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return

    const draggedTrack = playlistTracks[startIndex]
    if (!draggedTrack) return

    try {
      // Calculate new position using fractional algorithm
      const [prevPosition, nextPosition] = getPlaylistBounds(
        endIndex,
        playlistTracks.filter((_, i) => i !== startIndex)
      )
      const newPosition = calculatePosition(prevPosition, nextPosition)

      // Optimistic update
      const updated = playlistTracks.map((t) =>
        t.id === draggedTrack.id ? { ...t, position: newPosition } : t
      )
      const sorted = updated.sort((a, b) => a.position - b.position)
      setPlaylistTracks(sorted)

      // Update on server
      await api.updatePlaylistTrack(draggedTrack.id, { position: newPosition })
      // WebSocket will broadcast the update
    } catch (err) {
      console.error("Failed to reorder:", err)
      // Revert on error
      loadData()
    }
  }

  const handleSkipTrack = async () => {
    const currentIndex = playlistTracks.findIndex((t) => t.isPlaying)
    if (currentIndex < playlistTracks.length - 1) {
      const nextTrack = playlistTracks[currentIndex + 1]
      try {
        // Stop current track
        if (currentIndex >= 0) {
          const currentTrack = playlistTracks[currentIndex]
          await api.updatePlaylistTrack(currentTrack.id, { is_playing: false })
        }
        // Start next track
        await api.updatePlaylistTrack(nextTrack.id, { is_playing: true })
        setDurationElapsed(0)
      } catch (err) {
        console.error("Failed to skip track:", err)
      }
    }
  }

  const currentTrack = playlistTracks.find((t) => t.isPlaying)
  const connectionStatus = wsConnected && isOnline

  if (isLoading) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p>Loading playlist...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dark min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 overflow-hidden gap-px bg-border">
          <PlaylistPanel
            tracks={playlistTracks}
            onRemove={handleRemoveTrack}
            onVote={handleVote}
            onReorder={handleReorderTracks}
            onlineStatus={connectionStatus}
          />
          <TrackLibraryPanel tracks={libraryTracks} onAddToPlaylist={handleAddToPlaylist} />
        </div>
      </div>
      {currentTrack && (
        <NowPlayingBar
          track={currentTrack}
          durationElapsed={durationElapsed}
          isOnline={connectionStatus}
          onSkip={handleSkipTrack}
        />
      )}
      <ConnectionStatus isOnline={connectionStatus} />
    </div>
  )
}
