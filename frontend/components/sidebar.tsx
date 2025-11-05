import { Music, Library, Clock } from "lucide-react"

export default function Sidebar() {
  return (
    <div className="w-64 bg-primary border-r border-border flex flex-col p-6">
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">Vibe</h1>
        </div>
        <p className="text-xs text-primary-foreground/60">Collaborative Playlist</p>
      </div>

      <nav className="space-y-2 flex-1">
        <NavItem icon={Music} label="Shared Playlist" active />
        <NavItem icon={Library} label="Track Library" />
        <NavItem icon={Clock} label="Recently Played" />
      </nav>

      <div className="pt-6 border-t border-border">
        <p className="text-xs text-primary-foreground/60 mb-3">STATUS</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-primary-foreground">Online</span>
        </div>
      </div>
    </div>
  )
}

function NavItem({
  icon: Icon,
  label,
  active,
}: {
  icon: any
  label: string
  active?: boolean
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? "bg-accent/20 text-accent font-medium" : "text-primary-foreground/70 hover:bg-primary-foreground/10"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}
