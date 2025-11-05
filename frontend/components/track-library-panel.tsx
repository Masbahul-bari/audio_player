"use client"

import { useState } from "react"
import { Search, Plus } from "lucide-react"

interface Track {
  id: string
  title: string
  artist: string
  duration: number
  genre: string
  cover: string
  inPlaylist: boolean
}

interface TrackLibraryPanelProps {
  tracks: Track[]
  onAddToPlaylist: (track: Track) => void
}

const GENRES = [
  "All",
  "Electronic",
  "Chill-out",
  "Synthwave",
  "Jazz",
  "Rock",
  "Ambient",
  "Hip-hop",
  "Classical",
  "Indie",
]

export default function TrackLibraryPanel({ tracks, onAddToPlaylist }: TrackLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("All")

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGenre = selectedGenre === "All" || track.genre === selectedGenre
    return matchesSearch && matchesGenre
  })

  const minutesDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="w-80 flex flex-col bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-4 text-card-foreground">Track Library</h2>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Genre Filter */}
        <div className="flex gap-2 flex-wrap">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`text-xs px-3 py-1 rounded-full transition-all ${
                selectedGenre === genre
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {filteredTracks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-card-foreground font-semibold mb-1">No tracks found</p>
          <p className="text-muted-foreground text-xs">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-border">
            {filteredTracks.map((track) => (
              <div key={track.id} className="p-3 hover:bg-secondary/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-md overflow-hidden flex-shrink-0 bg-secondary/50">
                    <img
                      src={track.cover || "/placeholder.svg"}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate text-card-foreground">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>

                  <div className="text-xs text-muted-foreground flex-shrink-0 font-mono">
                    {minutesDuration(track.duration)}
                  </div>

                  <button
                    onClick={() => onAddToPlaylist(track)}
                    disabled={track.inPlaylist}
                    className={`p-1.5 rounded transition-all flex-shrink-0 ${
                      track.inPlaylist
                        ? "bg-accent/20 text-accent/50 cursor-not-allowed"
                        : "hover:bg-accent/10 text-muted-foreground hover:text-accent"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
