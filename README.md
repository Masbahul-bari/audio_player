# Collaborative Playlist Manager

A realtime collaborative playlist application where multiple users can add, remove, reorder, and vote on songs in a shared playlist. All changes synchronize in realtime across multiple browser windows using WebSocket connections.

## 🎯 Features

- **Shared Playlist**: Single collaborative playlist all users can modify
- **Realtime Sync**: Changes appear in all connected browsers within ~1 second via WebSocket
- **Drag & Drop Reordering**: Smooth drag-and-drop with fractional position algorithm
- **Voting System**: Upvote/downvote tracks with realtime updates
- **Now Playing**: Visual indicator of currently playing track with simulated playback
- **Track Library**: Searchable library of available tracks with genre filtering
- **Position Algorithm**: Fractional positioning allows infinite insertions without reindexing

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Backend**: Django 5.0 + Django REST Framework
- **Database**: SQLite (via Django ORM)
- **Realtime**: Django Channels (WebSocket)
- **Styling**: Tailwind CSS + shadcn/ui components

### Project Structure

```
audio_player/
├── backend/                 # Django backend
│   ├── playlist/           # Main app
│   │   ├── models.py      # Track and PlaylistTrack models
│   │   ├── views.py       # API endpoints
│   │   ├── serializers.py # DRF serializers
│   │   ├── consumers.py   # WebSocket consumers
│   │   ├── utils.py       # Position algorithm
│   │   └── tests.py       # Test suite
│   └── playlist_project/  # Django project settings
├── frontend/               # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # API client & utilities
│   └── hooks/            # Custom React hooks
└── docker-compose.yml     # Docker orchestration
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- OR Node.js 20+ and Python 3.11+ (for local development)

### Option 1: Docker Compose (Recommended)

```bash
# Clone or navigate to the project directory
cd audio_player

# Start all services
docker compose up

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
```

Docker Compose will automatically:
1. Run database migrations
2. Seed the database with tracks and initial playlist
3. Start the Django backend server
4. Start the Next.js frontend

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed database
python manage.py seed_data

# Start server
python manage.py runserver 4000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install  # or npm install

# Set environment variables (create .env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# Start development server
pnpm dev  # or npm run dev
```

## 📚 API Documentation

### Endpoints

#### `GET /api/tracks`
Get all available tracks in the library.

**Response:**
```json
[
  {
    "id": "track-1",
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "album": "A Night at the Opera",
    "duration_seconds": 355,
    "genre": "Rock",
    "cover_url": "/rock-guitar-concert.jpg"
  }
]
```

#### `GET /api/playlist`
Get current playlist ordered by position.

**Response:**
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

#### `POST /api/playlist`
Add track to playlist.

**Request:**
```json
{
  "track_id": "track-5",
  "added_by": "User456"
}
```

**Response:** `201 Created` with playlist item

#### `PATCH /api/playlist/{id}`
Update position or playing status.

**Request:**
```json
{
  "position": 2.5,
  "is_playing": true
}
```

#### `POST /api/playlist/{id}/vote`
Vote on a track.

**Request:**
```json
{
  "direction": "up"  // or "down"
}
```

#### `DELETE /api/playlist/{id}`
Remove track from playlist.

**Response:** `204 No Content`

### WebSocket Events

Connect to: `ws://localhost:4000/ws/playlist/`

**Event Types:**
- `track.added` - New track added to playlist
- `track.removed` - Track removed from playlist
- `track.moved` - Track position updated
- `track.voted` - Track vote count updated
- `track.playing` - Playing status changed
- `playlist.reordered` - Full playlist reordered
- `ping` - Heartbeat message

## 🔬 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

Tests cover:
- Position algorithm (fractional insertion)
- API endpoints (CRUD operations)
- Voting system
- Playing status exclusivity

### Running Tests

```bash
# Run all tests
python manage.py test

# Run specific test class
python manage.py test playlist.tests.PositionAlgorithmTests

# Run with coverage
pip install coverage
coverage run manage.py test
coverage report
```

## 🗄️ Database

### Seeding Data

The seed script creates:
- 40 tracks across various genres (Rock, Pop, Electronic, Jazz, Classical, Hip-hop, Ambient, Indie)
- Initial playlist with 10 tracks
- Mix of vote counts (-2 to 20)
- One track marked as "Now Playing"

```bash
python manage.py seed_data

# Clear existing data and reseed
python manage.py seed_data --clear
```

### Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

## 🎨 Technical Decisions

### Fractional Position Algorithm

Instead of integer indices, we use fractional positions to allow infinite insertions without reindexing:

```javascript
// Example positions after operations:
// Initial: [1.0, 2.0, 3.0]
// Insert between 1 and 2: [1.0, 1.5, 2.0, 3.0]
// Insert between 1 and 1.5: [1.0, 1.25, 1.5, 2.0, 3.0]
```

**Benefits:**
- No reindexing needed for insertions
- Handles concurrent reorders efficiently
- Maintains order with minimal database updates

**Trade-offs:**
- Requires floating-point precision
- May need periodic reindexing for very deep nesting (though unlikely in practice)

### Realtime Sync Strategy

- **Optimistic Updates**: UI updates immediately, then syncs with server
- **WebSocket Broadcasting**: All changes broadcast to connected clients
- **Automatic Reconnection**: Exponential backoff on connection loss
- **Conflict Resolution**: Server position is authoritative

### State Management

- **Frontend**: React hooks (useState, useEffect) - no external state library needed
- **Backend**: Django ORM with SQLite
- **Realtime**: Django Channels with InMemoryChannelLayer (Redis recommended for production)

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## 📦 Deployment

### Production Considerations

1. **Database**: Use PostgreSQL instead of SQLite
2. **Channel Layer**: Use Redis for WebSocket channels
3. **Static Files**: Configure Django static files serving
4. **CORS**: Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`
5. **Security**: Set strong `SECRET_KEY` and `DEBUG=False`
6. **Web Server**: Use Gunicorn/Uvicorn for Django, Next.js build for frontend

### Docker Production Build

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Run production services
docker compose -f docker-compose.prod.yml up
```

## 🐛 Troubleshooting

### Backend won't start
- Check if port 4000 is available
- Verify database migrations ran: `python manage.py migrate`
- Check Django logs for errors

### Frontend can't connect to API
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in Django settings.py
- Ensure backend is running on port 4000

### WebSocket connection fails
- Verify `NEXT_PUBLIC_WS_URL` is set correctly
- Check Django Channels is installed
- Ensure ASGI application is configured correctly

### Drag and drop not working
- Check browser console for errors
- Verify fractional position algorithm is calculating correctly
- Ensure API endpoint `/api/playlist/{id}` is accessible

## 📝 If I Had 2 More Days...

### Planned Enhancements

1. **User Authentication**
   - User accounts with persistent sessions
   - Track who added each track
   - Prevent duplicate votes per user

2. **Auto-sort by Votes**
   - Optional toggle to auto-sort playlist by vote count
   - Smooth animation when sorting

3. **Keyboard Shortcuts**
   - Space for play/pause
   - Arrow keys for navigation
   - Enter to add selected track

4. **Track History**
   - Recently played tracks section
   - Play count tracking
   - Skip history

5. **Multiple Playlists**
   - Create and manage multiple playlists
   - Share playlists via URL
   - Playlist templates

6. **Enhanced UI/UX**
   - Track preview on hover
   - Better mobile responsiveness
   - Dark/light theme toggle
   - User avatars and presence indicators

7. **Performance Optimizations**
   - Virtual scrolling for large playlists (200+ tracks)
   - Debounced position updates during drag
   - Optimistic UI updates with rollback

8. **Testing**
   - Frontend integration tests
   - E2E tests with Playwright
   - WebSocket connection tests
   - Load testing for concurrent users

## 📄 License

This project is created as a take-home assignment.

## 👥 Contributing

This is an assignment project, but suggestions and improvements are welcome!

---

**Built with ❤️ using Django, Next.js, and WebSockets**
