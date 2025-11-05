from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Track, PlaylistTrack
from .utils import calculate_position


class PositionAlgorithmTests(TestCase):
    """Tests for the fractional position algorithm"""
    
    def test_calculate_position_both_none(self):
        """Test calculating position when playlist is empty"""
        result = calculate_position(None, None)
        self.assertEqual(result, 1.0)
    
    def test_calculate_position_only_next(self):
        """Test calculating position when inserting at beginning"""
        result = calculate_position(None, 1.0)
        self.assertEqual(result, 0)
    
    def test_calculate_position_only_prev(self):
        """Test calculating position when inserting at end"""
        result = calculate_position(1.0, None)
        self.assertEqual(result, 2.0)
    
    def test_calculate_position_between(self):
        """Test calculating position when inserting between two tracks"""
        result = calculate_position(1.0, 2.0)
        self.assertEqual(result, 1.5)
    
    def test_calculate_position_fractional_insertion(self):
        """Test inserting between already fractional positions"""
        # Initial: [1.0, 2.0, 3.0]
        # Insert between 1 and 2: [1.0, 1.5, 2.0, 3.0]
        # Insert between 1 and 1.5: [1.0, 1.25, 1.5, 2.0, 3.0]
        result1 = calculate_position(1.0, 2.0)
        self.assertEqual(result1, 1.5)
        
        result2 = calculate_position(1.0, 1.5)
        self.assertEqual(result2, 1.25)
        
        result3 = calculate_position(1.25, 1.5)
        self.assertEqual(result3, 1.375)


class TrackAPITests(TestCase):
    """Tests for Track API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        Track.objects.create(
            id='track-1',
            title='Test Track',
            artist='Test Artist',
            album='Test Album',
            duration_seconds=200,
            genre='Rock'
        )
    
    def test_get_tracks_list(self):
        """Test GET /api/tracks"""
        url = reverse('tracks-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Track')


class PlaylistAPITests(TestCase):
    """Tests for Playlist API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.track = Track.objects.create(
            id='track-1',
            title='Test Track',
            artist='Test Artist',
            album='Test Album',
            duration_seconds=200,
            genre='Rock'
        )
    
    def test_get_playlist_empty(self):
        """Test GET /api/playlist when empty"""
        url = reverse('playlist-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_add_track_to_playlist(self):
        """Test POST /api/playlist"""
        url = reverse('playlist-list')
        data = {
            'track_id': 'track-1',
            'added_by': 'TestUser'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['track']['title'], 'Test Track')
        self.assertEqual(response.data['added_by'], 'TestUser')
        self.assertEqual(response.data['position'], 1.0)
    
    def test_add_duplicate_track(self):
        """Test adding duplicate track to playlist"""
        PlaylistTrack.objects.create(
            id='playlist-item-1',
            track=self.track,
            position=1.0,
            added_by='User1'
        )
        
        url = reverse('playlist-list')
        data = {
            'track_id': 'track-1',
            'added_by': 'User2'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'DUPLICATE_TRACK')
    
    def test_vote_on_track(self):
        """Test POST /api/playlist/{id}/vote"""
        playlist_item = PlaylistTrack.objects.create(
            id='playlist-item-1',
            track=self.track,
            position=1.0,
            votes=5
        )
        
        url = reverse('playlist-vote', args=[playlist_item.id])
        data = {'direction': 'up'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['votes'], 6)
        
        # Test downvote
        data = {'direction': 'down'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['votes'], 5)
    
    def test_delete_track_from_playlist(self):
        """Test DELETE /api/playlist/{id}"""
        playlist_item = PlaylistTrack.objects.create(
            id='playlist-item-1',
            track=self.track,
            position=1.0
        )
        
        url = reverse('playlist-update', args=[playlist_item.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PlaylistTrack.objects.filter(id=playlist_item.id).exists())
    
    def test_update_playing_status(self):
        """Test PATCH /api/playlist/{id} to update playing status"""
        playlist_item = PlaylistTrack.objects.create(
            id='playlist-item-1',
            track=self.track,
            position=1.0,
            is_playing=False
        )
        
        url = reverse('playlist-update', args=[playlist_item.id])
        data = {'is_playing': True}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_playing'])
        
        # Verify only one track is playing
        playlist_item.refresh_from_db()
        self.assertTrue(playlist_item.is_playing)
        
        # Create another track and set it as playing
        track2 = Track.objects.create(
            id='track-2',
            title='Track 2',
            artist='Artist 2',
            duration_seconds=180
        )
        playlist_item2 = PlaylistTrack.objects.create(
            id='playlist-item-2',
            track=track2,
            position=2.0,
            is_playing=False
        )
        
        url2 = reverse('playlist-update', args=[playlist_item2.id])
        data2 = {'is_playing': True}
        response2 = self.client.patch(url2, data2, format='json')
        
        # Refresh first item - should no longer be playing
        playlist_item.refresh_from_db()
        self.assertFalse(playlist_item.is_playing)
        self.assertTrue(playlist_item2.is_playing)

