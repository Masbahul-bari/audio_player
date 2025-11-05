/**
 * API client for communicating with Django backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration_seconds: number;
  genre: string;
  cover_url?: string;
}

export interface PlaylistTrack {
  id: string;
  track_id: string;
  track: Track;
  position: number;
  votes: number;
  added_by: string;
  added_at: string;
  is_playing: boolean;
  played_at?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: {
        code: 'UNKNOWN_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
      },
    }));
    throw error;
  }
  return response.json();
}

export const api = {
  // Get all tracks from library
  async getTracks(): Promise<Track[]> {
    const response = await fetch(`${API_URL}/tracks`);
    return handleResponse<Track[]>(response);
  },

  // Get current playlist
  async getPlaylist(): Promise<PlaylistTrack[]> {
    const response = await fetch(`${API_URL}/playlist`);
    return handleResponse<PlaylistTrack[]>(response);
  },

  // Add track to playlist
  async addToPlaylist(trackId: string, addedBy: string = 'Anonymous'): Promise<PlaylistTrack> {
    const response = await fetch(`${API_URL}/playlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        track_id: trackId,
        added_by: addedBy,
      }),
    });
    return handleResponse<PlaylistTrack>(response);
  },

  // Update playlist track (position or playing status)
  async updatePlaylistTrack(
    playlistId: string,
    updates: { position?: number; is_playing?: boolean }
  ): Promise<PlaylistTrack> {
    const response = await fetch(`${API_URL}/playlist/${playlistId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return handleResponse<PlaylistTrack>(response);
  },

  // Delete track from playlist
  async removeFromPlaylist(playlistId: string): Promise<void> {
    const response = await fetch(`${API_URL}/playlist/${playlistId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete track: ${response.statusText}`);
    }
  },

  // Vote on a track
  async vote(playlistId: string, direction: 'up' | 'down'): Promise<PlaylistTrack> {
    const response = await fetch(`${API_URL}/playlist/${playlistId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direction }),
    });
    return handleResponse<PlaylistTrack>(response);
  },

  // Reorder track to new position
  async reorderTrack(playlistId: string, targetIndex: number): Promise<PlaylistTrack[]> {
    const response = await fetch(`${API_URL}/playlist/${playlistId}/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target_index: targetIndex }),
    });
    return handleResponse<PlaylistTrack[]>(response);
  },
};

