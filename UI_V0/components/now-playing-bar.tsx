"use client"

import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat2 } from "lucide-react"
import { useState } from "react"

interface Track {
  id: string
  title: string
  artist: string
  duration: number
  cover: string
}

interface NowPlayingBarProps {
  track: Track
  durationElapsed: number
  isOnline: boolean
  onSkip: () => void
}

export default function NowPlayingBar({ track, durationElapsed, isOnline, onSkip }: NowPlayingBarProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off")
  const progressPercent = (durationElapsed / track.duration) * 100

  const minutesElapsed = Math.floor(durationElapsed / 60)
  const secondsElapsed = durationElapsed % 60
  const minutesDuration = Math.floor(track.duration / 60)
  const secondsDuration = track.duration % 60

  return (
    <div className="bg-primary border-t border-border">
      <div className="px-6 py-2 flex items-center gap-2">
        <span className="text-xs text-primary-foreground/60 font-mono w-8">
          {minutesElapsed}:{secondsElapsed.toString().padStart(2, "0")}
        </span>
        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden cursor-pointer hover:h-1.5 transition-all">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="text-xs text-primary-foreground/60 font-mono w-8 text-right">
          {minutesDuration}:{secondsDuration.toString().padStart(2, "0")}
        </span>
      </div>

      <div className="px-6 py-4 flex items-center justify-center gap-8">
        {/* Shuffle button */}
        <button
          onClick={() => setIsShuffle(!isShuffle)}
          disabled={!isOnline}
          className={`p-2 transition-colors disabled:opacity-50 ${
            isShuffle ? "text-accent" : "text-primary-foreground/70 hover:text-primary-foreground"
          }`}
        >
          <Shuffle className="w-6 h-6 fill-current" />
        </button>

        {/* Previous/Skip Back */}
        <button
          disabled={!isOnline}
          className="p-2 hover:text-accent transition-colors disabled:opacity-50 text-primary-foreground/70 hover:text-primary-foreground"
        >
          <SkipBack className="w-6 h-6 fill-current" />
        </button>

        {/* Play/Pause - Large centered button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={!isOnline}
          className="p-3 hover:bg-accent/20 rounded-full transition-all disabled:opacity-50 bg-primary-foreground/10 hover:bg-primary-foreground/20"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
          ) : (
            <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
          )}
        </button>

        {/* Next/Skip Forward */}
        <button
          onClick={onSkip}
          disabled={!isOnline}
          className="p-2 hover:text-accent transition-colors disabled:opacity-50 text-primary-foreground/70 hover:text-primary-foreground"
        >
          <SkipForward className="w-6 h-6 fill-current" />
        </button>

        {/* Repeat button */}
        <button
          onClick={() => setRepeatMode(repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off")}
          disabled={!isOnline}
          className={`p-2 transition-colors disabled:opacity-50 ${
            repeatMode !== "off" ? "text-accent" : "text-primary-foreground/70 hover:text-primary-foreground"
          }`}
        >
          <Repeat2 className="w-6 h-6 fill-current" />
          {repeatMode === "one" && <span className="text-xs ml-1">1</span>}
        </button>
      </div>
    </div>
  )
}
