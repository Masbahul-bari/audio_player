"use client"

import type React from "react"

import { useState } from "react"
import { Volume2 } from "lucide-react"
import PlaylistTrackItem from "./playlist-track-item"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  genre: string
  addedBy: string
  addedTime: string
  votes: number
  isPlaying: boolean
  cover: string
}

interface PlaylistPanelProps {
  tracks: Track[]
  onRemove: (trackId: string) => void
  onVote: (trackId: string, voteType: "up" | "down") => void
  onReorder: (startIndex: number, endIndex: number) => void
  onlineStatus: boolean
}

export default function PlaylistPanel({ tracks, onRemove, onVote, onReorder, onlineStatus }: PlaylistPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorder(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
  }

  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0)
  const minutes = Math.floor(totalDuration / 60)
  const seconds = totalDuration % 60

  return (
    <div className="flex-1 flex flex-col bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-4 text-card-foreground">Shared Playlist</h2>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <div>
            <span className="font-semibold text-card-foreground">{tracks.length}</span> tracks
          </div>
          <div>
            <span className="font-semibold text-card-foreground">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>{" "}
            total
          </div>
          <div>Last updated now</div>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Volume2 className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-card-foreground font-semibold mb-2">No tracks yet</p>
          <p className="text-muted-foreground text-sm">Add songs from the Track Library to get started</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-border">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`transition-all ${draggedIndex === index ? "opacity-50 bg-accent/10" : ""}`}
              >
                <PlaylistTrackItem
                  track={track}
                  onRemove={onRemove}
                  onVote={onVote}
                  isDragging={draggedIndex === index}
                  onlineStatus={onlineStatus}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
