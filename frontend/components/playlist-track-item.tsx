"use client"

import { useState } from "react"
import { Trash2, ChevronUp, ChevronDown, GripVertical, Zap } from "lucide-react"

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

interface PlaylistTrackItemProps {
  track: Track
  onRemove: (trackId: string) => void
  onVote: (trackId: string, voteType: "up" | "down") => void
  isDragging: boolean
  onlineStatus: boolean
}

export default function PlaylistTrackItem({
  track,
  onRemove,
  onVote,
  isDragging,
  onlineStatus,
}: PlaylistTrackItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [justVoted, setJustVoted] = useState<"up" | "down" | null>(null)

  const handleVote = (type: "up" | "down") => {
    onVote(track.id, type)
    setJustVoted(type)
    setTimeout(() => setJustVoted(null), 300)
  }

  const voteColor = track.votes > 0 ? "text-emerald-400" : track.votes < 0 ? "text-red-400" : "text-muted-foreground"

  const minutesDuration = Math.floor(track.duration / 60)
  const secondsDuration = track.duration % 60

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`px-4 py-3 hover:bg-secondary/30 transition-all group ${track.isPlaying ? "bg-accent/15" : ""}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div className={`${isHovered || isDragging ? "opacity-100" : "opacity-0"} transition-opacity`}>
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Now Playing Indicator */}
        {track.isPlaying && (
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-accent animate-pulse" />
          </div>
        )}

        {/* Cover Image */}
        <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-secondary/50">
          <img src={track.cover || "/placeholder.svg"} alt={track.title} className="w-full h-full object-cover" />
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm truncate ${track.isPlaying ? "text-accent" : ""}`}>{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {track.artist} • {track.album}
          </p>
          <p className="text-xs text-muted-foreground/60">
            Added by {track.addedBy} • {track.addedTime}
          </p>
        </div>

        {/* Duration */}
        <div className="text-xs text-muted-foreground font-mono flex-shrink-0">
          {minutesDuration}:{secondsDuration.toString().padStart(2, "0")}
        </div>

        {/* Voting Section */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => handleVote("up")}
            className={`p-1 rounded hover:bg-secondary transition-all ${justVoted === "up" ? "scale-110" : ""}`}
            disabled={!onlineStatus}
          >
            <ChevronUp className={`w-4 h-4 ${justVoted === "up" ? "text-emerald-400" : "text-muted-foreground"}`} />
          </button>
          <span className={`text-xs font-semibold w-6 text-center ${voteColor}`}>{track.votes}</span>
          <button
            onClick={() => handleVote("down")}
            className={`p-1 rounded hover:bg-secondary transition-all ${justVoted === "down" ? "scale-110" : ""}`}
            disabled={!onlineStatus}
          >
            <ChevronDown className={`w-4 h-4 ${justVoted === "down" ? "text-red-400" : "text-muted-foreground"}`} />
          </button>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onRemove(track.id)}
          className={`p-1 rounded hover:bg-destructive/10 transition-all ${isHovered ? "opacity-100" : "opacity-0"}`}
          disabled={!onlineStatus}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>
    </div>
  )
}
