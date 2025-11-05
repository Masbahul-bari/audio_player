"use client"

import { useState, useEffect } from "react"

interface ConnectionStatusProps {
  isOnline: boolean
}

export default function ConnectionStatus({ isOnline }: ConnectionStatusProps) {
  const [showReconnectMessage, setShowReconnectMessage] = useState(false)
  const [prevStatus, setPrevStatus] = useState(isOnline)

  useEffect(() => {
    if (isOnline && !prevStatus) {
      setShowReconnectMessage(true)
      setTimeout(() => setShowReconnectMessage(false), 3000)
    }
    setPrevStatus(isOnline)
  }, [isOnline, prevStatus])

  return (
    <>
      {showReconnectMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 px-4 py-2 rounded-lg text-sm font-medium animate-fade-in-out">
          Reconnected • Syncing changes
        </div>
      )}
    </>
  )
}
