"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import PlaylistPanel from "@/components/playlist-panel"
import TrackLibraryPanel from "@/components/track-library-panel"
import NowPlayingBar from "@/components/now-playing-bar"
import ConnectionStatus from "@/components/connection-status"

export default function Home() {
  const [isOnline, setIsOnline] = useState(true)
  const [selectedTrackId, setSelectedTrackId] = useState<string>("track-1")
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([])
  const [libraryTracks, setLibraryTracks] = useState<any[]>([])
  const [durationElapsed, setDurationElapsed] = useState(0)

  // Initialize data
  useEffect(() => {
    const playlist = [
      {
        id: "track-1",
        title: "Midnight Dreams",
        artist: "Luna Echo",
        album: "Neon Nights",
        duration: 245,
        genre: "Electronic",
        addedBy: "Alex",
        addedTime: "5 min ago",
        votes: 12,
        isPlaying: true,
        cover: "/electronic-album-cover.png",
      },
      {
        id: "track-2",
        title: "Ocean Waves",
        artist: "Coastal Vibes",
        album: "Summer Collection",
        duration: 198,
        genre: "Chill-out",
        addedBy: "Jordan",
        addedTime: "3 min ago",
        votes: 8,
        isPlaying: false,
        cover: "/ocean-beach-music.jpg",
      },
      {
        id: "track-3",
        title: "Electric Paradise",
        artist: "Synth Wave",
        album: "Digital Age",
        duration: 267,
        genre: "Synthwave",
        addedBy: "Morgan",
        addedTime: "2 min ago",
        votes: 15,
        isPlaying: false,
        cover: "/synthwave-neon-city.jpg",
      },
      {
        id: "track-4",
        title: "Jazz Garden",
        artist: "Smooth Quartet",
        album: "Relaxation",
        duration: 212,
        genre: "Jazz",
        addedBy: "Casey",
        addedTime: "1 min ago",
        votes: -2,
        isPlaying: false,
        cover: "/jazz-musical-instruments.jpg",
      },
      {
        id: "track-5",
        title: "Rock Anthem",
        artist: "Thunder Storm",
        album: "Power Play",
        duration: 289,
        genre: "Rock",
        addedBy: "Riley",
        addedTime: "45 sec ago",
        votes: 20,
        isPlaying: false,
        cover: "/rock-guitar-concert.jpg",
      },
    ]

    const library = [
      {
        id: "lib-1",
        title: "Stellar Highway",
        artist: "Astro Nomad",
        duration: 203,
        genre: "Electronic",
        cover: "/space-stars-music.jpg",
        inPlaylist: false,
      },
      {
        id: "lib-2",
        title: "Forest Whispers",
        artist: "Nature Sounds",
        duration: 187,
        genre: "Ambient",
        cover: "/forest-nature-sounds.jpg",
        inPlaylist: false,
      },
      {
        id: "lib-3",
        title: "Urban Jungle",
        artist: "City Beats",
        duration: 234,
        genre: "Hip-hop",
        cover: "/city-urban-hip-hop.jpg",
        inPlaylist: false,
      },
      {
        id: "lib-4",
        title: "Classical Sunrise",
        artist: "Orchestra Prime",
        duration: 321,
        genre: "Classical",
        cover: "/classical-orchestra-concert-hall.jpg",
        inPlaylist: false,
      },
      {
        id: "lib-5",
        title: "Indie Dreams",
        artist: "Local Legends",
        duration: 176,
        genre: "Indie",
        cover: "/indie-folk-acoustic.jpg",
        inPlaylist: false,
      },
    ]

    setPlaylistTracks(playlist)
    setLibraryTracks(library)
  }, [])

  // Simulate playback progression
  useEffect(() => {
    const interval = setInterval(() => {
      setDurationElapsed((prev) => {
        const currentTrack = playlistTracks.find((t) => t.isPlaying)
        if (currentTrack && prev < currentTrack.duration) {
          return prev + 1
        }
        return 0
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [playlistTracks])

  // Simulate connection status changes
  useEffect(() => {
    const connectionInterval = setInterval(() => {
      // Rarely go offline for demo purposes
      if (Math.random() > 0.98) {
        setIsOnline(false)
        setTimeout(() => setIsOnline(true), 2000)
      }
    }, 5000)
    return () => clearInterval(connectionInterval)
  }, [])

  const handleAddToPlaylist = (track: any) => {
    const newTrack = {
      ...track,
      id: `track-${Date.now()}`,
      addedBy: "You",
      addedTime: "just now",
      votes: 0,
      isPlaying: false,
    }
    setPlaylistTracks([...playlistTracks, newTrack])
    setLibraryTracks(libraryTracks.map((t) => (t.id === track.id ? { ...t, inPlaylist: true } : t)))
  }

  const handleRemoveTrack = (trackId: string) => {
    setPlaylistTracks(playlistTracks.filter((t) => t.id !== trackId))
  }

  const handleVote = (trackId: string, voteType: "up" | "down") => {
    setPlaylistTracks(
      playlistTracks.map((t) =>
        t.id === trackId ? { ...t, votes: voteType === "up" ? t.votes + 1 : t.votes - 1 } : t,
      ),
    )
  }

  const handleReorderTracks = (startIndex: number, endIndex: number) => {
    const result = Array.from(playlistTracks)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    setPlaylistTracks(result)
  }

  const handleSkipTrack = () => {
    const currentIndex = playlistTracks.findIndex((t) => t.isPlaying)
    if (currentIndex < playlistTracks.length - 1) {
      setPlaylistTracks(
        playlistTracks.map((t, i) => ({
          ...t,
          isPlaying: i === currentIndex + 1,
        })),
      )
      setDurationElapsed(0)
    }
  }

  const currentTrack = playlistTracks.find((t) => t.isPlaying)

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
            onlineStatus={isOnline}
          />
          <TrackLibraryPanel tracks={libraryTracks} onAddToPlaylist={handleAddToPlaylist} />
        </div>
      </div>
      {currentTrack && (
        <NowPlayingBar
          track={currentTrack}
          durationElapsed={durationElapsed}
          isOnline={isOnline}
          onSkip={handleSkipTrack}
        />
      )}
      <ConnectionStatus isOnline={isOnline} />
    </div>
  )
}
