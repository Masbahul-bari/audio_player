# Take-Home Assignment: Realtime Collaborative Playlist Manager

**Time Allocation:** 3 working days (approximately 24-32 focused hours)

## Project Overview

Build a collaborative playlist application where multiple users can add, remove, reorder, and vote on songs in a shared playlist. All changes should synchronize in realtime across multiple browser windows, with updates visible within approximately 1 second. Think of it as a simplified Spotify collaborative playlist with realtime sync.

## Technical Requirements

### Technology Stack
You may choose your preferred stack. Reference implementation can use:

- **Frontend:** Next.js/React or equivalent (Vue, Angular, Svelte, etc.)
- **Backend:** Node.js/Express or alternatives (Django/DRF, Rails, FastAPI, Laravel, etc.)
- **Database:** SQLite (via Prisma or equivalent ORM)
- **Realtime:** WebSocket or Server-Sent Events (SSE)

### Core Deliverables Checklist
- [ ] Git repository (public GitHub/GitLab or private with invite)
- [ ] Comprehensive README.md including:
  - Setup instructions
  - How to run the application
  - Database seeding instructions
  - Technical decisions and trade-offs
  - "If I had 2 more days..." section
- [ ] `.env.example` file with all required environment variables (no secrets)
- [ ] Database migration scripts and seed data
- [ ] Test coverage for core functionality
- [ ] Screenshots or 1-2 minute video demo showing realtime sync
- [ ] Deployed demo link OR working Docker Compose setup

### Running Instructions
Your application should start with either:

```bash
npm install && npm run dev
```

Or:

```bash
docker compose up
```

Default ports (or document if different):
- Web application: `http://localhost:3000`
- API server: `http://localhost:4000`
- WebSocket/SSE: Same as API or document separately

## Functional Specifications

### Core Features
- **Shared Playlist:** Single collaborative playlist all users can modify
- **Now Playing:** Visual indicator of currently playing track (simulated)
- **Queue Management:** Reorder tracks via drag-and-drop
- **Voting System:** Upvote/downvote tracks (optional auto-sort by votes)

### Track Operations
- Add new tracks to playlist (from predefined library)
- Remove tracks from playlist
- Reorder tracks via drag-and-drop
- Vote on tracks (upvote/downvote)
- Mark track as "Now Playing" (simulated playback)
- Search/filter track library

### Data Models

```
Track (Library)
├── id (primary key)
├── title
├── artist
├── album
├── duration_seconds
├── genre
└── cover_url (optional, can use placeholder)

PlaylistTrack
├── id (primary key)
├── track_id (foreign key)
├── position (float/decimal for ordering)
├── votes (integer, can be negative)
├── added_by (string, username or "Anonymous")
├── added_at
├── is_playing (boolean, only one can be true)
└── played_at (timestamp, nullable)
```

### Position Algorithm (REQUIRED IMPLEMENTATION)
You must implement this specific ordering algorithm:

```javascript
// When inserting a track between two others
function calculatePosition(prevPosition, nextPosition) {
  if (!prevPosition && !nextPosition) return 1.0;
  if (!prevPosition) return nextPosition - 1;
  if (!nextPosition) return prevPosition + 1;
  return (prevPosition + nextPosition) / 2;
}

// Example positions after operations:
// Initial: [1.0, 2.0, 3.0]
// Insert between 1 and 2: [1.0, 1.5, 2.0, 3.0]
// Insert between 1 and 1.5: [1.0, 1.25, 1.5, 2.0, 3.0]
// This allows infinite insertions without reindexing
```

### API Endpoints

#### GET /api/tracks
Response: Available tracks library
```json
[
  {
    "id": "track-1",
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "album": "A Night at the Opera",
    "duration_seconds": 355,
    "genre": "Rock"
  }
]
```

#### GET /api/playlist
Response: Current playlist ordered by position
```json
[
  {
    "id": "playlist-item-1",
    "track_id": "track-1",
    "track": {
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "duration_seconds": 355
    },
    "position": 1.0,
    "votes": 5,
    "added_by": "User123",
    "is_playing": true,
    "added_at": "2025-01-27T10:00:00Z"
  }
]
```

#### POST /api/playlist
Add track to playlist
```json
{
  "track_id": "track-5",
  "added_by": "User456"
}
```
Response: 201 Created (returns playlist item with calculated position)

#### PATCH /api/playlist/{id}
Update position or playing status
```json
{
  "position": 2.5,
  "is_playing": true
}
```
Response: 200 OK

#### POST /api/playlist/{id}/vote
Vote on a track
```json
{
  "direction": "up" // or "down"
}
```
Response: 200 OK with updated vote count

#### DELETE /api/playlist/{id}
Response: 204 No Content

### Realtime Events

#### Connection Endpoint
- GET `/api/stream` (SSE) or WS `/ws` (WebSocket)

#### Event Types
```json
{ "type": "track.added", "item": { /* full playlist item */ } }
{ "type": "track.removed", "id": "playlist-item-id" }
{ "type": "track.moved", "item": { "id": "...", "position": 2.5 } }
{ "type": "track.voted", "item": { "id": "...", "votes": 6 } }
{ "type": "track.playing", "id": "playlist-item-id" }
{ "type": "playlist.reordered", "items": [ /* full reordered list */ ] }
```

#### Heartbeat (Required)
```json
{ "type": "ping", "ts": "2025-01-27T12:34:56Z" }
```

### Error Handling
```json
{
  "error": {
    "code": "DUPLICATE_TRACK",
    "message": "This track is already in the playlist",
    "details": { "track_id": "track-5" }
  }
}
```

## UI/UX Requirements

### Layout Components

#### Track Library Panel
- Searchable list of available tracks
- Display: title, artist, duration
- "Add to Playlist" button for each track
- Filter by genre (optional)
- Disable "Add" for tracks already in playlist

#### Playlist Panel
- Ordered list of playlist tracks
- Now Playing indicator (animated icon or highlight)
- Drag handle for reordering
- Vote count with up/down buttons
- Remove button (hover or always visible)
- Total playlist duration at bottom
- "Added by" attribution

#### Now Playing Bar
- Current track info (title, artist)
- Simulated progress bar (auto-advances)
- Skip button to play next track
- Pause/Play toggle (optional)

### Visual Design
- **Drag Feedback:**
  - Dragging track becomes semi-transparent
  - Drop zone indicator between tracks
  - Smooth reorder animations
- **Vote Feedback:**
  - Immediate visual update
  - Animation for vote changes
  - Different color for positive/negative scores
- **Now Playing:**
  - Pulsing icon or animated equalizer bars
  - Different background color
  - Auto-scroll to keep in view

### Realtime Sync Behavior
- **Optimistic Updates:** Apply changes immediately, reconcile with server
- **Animation:** Smooth transitions when tracks move/appear/disappear
- **Conflict Resolution:** Server position is authoritative
- **Connection Indicator:** Show online/offline/reconnecting status

## Technical Constraints

### Performance
- Handle playlists with 200+ tracks
- Smooth drag animations (60 FPS)
- Efficient re-renders on updates
- Debounce position updates during drag

### Realtime
- Automatic reconnection with exponential backoff
- Queue actions during disconnection
- Prevent duplicate events
- Handle out-of-order messages

### Code Quality
- Proper separation of concerns
- Clean event handler management
- No memory leaks
- Efficient DOM manipulation

## Testing Requirements (Minimum)

### Position Algorithm
```javascript
// Example test
describe('Position Calculation', () => {
  it('should calculate middle position', () => {
    const result = calculatePosition(1.0, 2.0);
    expect(result).toBe(1.5);
  });
  
  it('should handle first position', () => {
    const result = calculatePosition(null, 1.0);
    expect(result).toBe(0);
  });
});
```

### Playlist Operations
- Test adding tracks
- Test reordering via position update
- Test vote counting
- Test "Now Playing" exclusivity

### Realtime
- Test event broadcasting
- Test reconnection logic

## Implementation Guide

### Drag and Drop Example
```javascript
function handleDrop(draggedId, targetIndex) {
  const playlist = getPlaylist();
  const prevTrack = playlist[targetIndex - 1];
  const nextTrack = playlist[targetIndex];
  
  const newPosition = calculatePosition(
    prevTrack?.position || null,
    nextTrack?.position || null
  );
  
  // Optimistic update
  updateLocalPlaylist(draggedId, { position: newPosition });
  
  // Server update
  api.updatePosition(draggedId, newPosition)
    .catch(() => {
      // Revert on failure
      revertPlaylist();
    });
}
```

### Auto-advance Example
```javascript
// Simulate playback progression
useEffect(() => {
  if (!currentTrack || isPaused) return;
  
  const timer = setInterval(() => {
    const elapsed = Date.now() - playStartTime;
    const progress = elapsed / (currentTrack.duration_seconds * 1000);
    
    if (progress >= 1) {
      playNextTrack();
    } else {
      updateProgress(progress);
    }
  }, 1000);
  
  return () => clearInterval(timer);
}, [currentTrack, isPaused]);
```

## Seed Data Requirements

### Track Library (30-40 tracks)
Create diverse track data including:
- Various genres (Rock, Pop, Electronic, Jazz, Classical)
- Realistic durations (120-420 seconds)
- Mix of popular and obscure artists
- Some tracks with same artist (albums)

### Initial Playlist (8-10 tracks)
- Variety from library
- Different vote counts (-2 to 10)
- One track marked as "Now Playing"
- Mix of "added_by" values

## Evaluation Criteria

### Scoring Breakdown (100 points)
- **Core Functionality (40 pts):** CRUD operations, drag-drop, voting, realtime sync
- **Code Quality (20 pts):** Architecture, state management, error handling
- **UI/UX (15 pts):** Intuitive interface, smooth animations, responsive design
- **Testing (15 pts):** Algorithm tests, API tests, basic integration tests
- **Documentation (10 pts):** Setup clarity, architecture explanation, decision rationale

### Bonus Features (up to 10 additional points)
- Auto-sort by votes (with animation)
- Keyboard shortcuts (space for play/pause, arrows for navigation)
- Track history/recently played
- Multiple playlists support
- User avatars/presence
- Spotify-like hover preview
- Export playlist
- Duplicate track prevention
- Undo/redo
- Mobile responsive design

## Definition of Done

- [ ] Can add/remove tracks from playlist
- [ ] Drag-and-drop reordering works smoothly
- [ ] Position algorithm maintains correct order
- [ ] Voting system updates in realtime
- [ ] "Now Playing" indicator works
- [ ] Realtime sync across multiple windows
- [ ] Auto-reconnection on connection loss
- [ ] Tests pass with single command
- [ ] No performance issues with 200+ tracks
- [ ] Documentation complete

## Common Pitfalls to Avoid

- **Position Conflicts:** Ensure unique positions after concurrent reorders
- **Vote Races:** Handle rapid voting clicks properly
- **Playing State:** Only one track should be playing at a time
- **Memory Leaks:** Clean up timers and event listeners
- **Drag Performance:** Don't update server on every pixel move

## FAQ

**Q: Do I need to implement actual audio playback?**
A: No, just simulate with progress bars and timers.

**Q: Should votes affect track order automatically?**
A: Optional bonus feature. Manual ordering is the requirement.

**Q: Can the same track appear multiple times?**
A: No, each track should appear at most once in the playlist.

**Q: How should I handle the track library data?**
A: Hardcode it or use a seed file. No need for track upload.

**Q: Should voting be per-user?**
A: No authentication required. Simple increment/decrement is fine.

## Submission Instructions

1. Test with 3+ browser windows simultaneously
2. Verify smooth drag-and-drop
3. Confirm position algorithm maintains order
4. Document any limitations
5. Create demo video showing:
   - Adding/removing tracks
   - Reordering tracks
   - Voting system
   - Realtime synchronization
6. Provide repository access and running instructions

---

Good luck! We look forward to reviewing your implementation. Remember to focus on core functionality first before attempting bonus features.
