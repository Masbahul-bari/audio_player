from rest_framework import serializers
from .models import Track, PlaylistTrack


class TrackSerializer(serializers.ModelSerializer):
    """Serializer for Track model"""
    class Meta:
        model = Track
        fields = ['id', 'title', 'artist', 'album', 'duration_seconds', 'genre', 'cover_url']


class PlaylistTrackSerializer(serializers.ModelSerializer):
    """Serializer for PlaylistTrack with nested track information"""
    track = TrackSerializer(read_only=True)
    track_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = PlaylistTrack
        fields = [
            'id', 'track_id', 'track', 'position', 'votes', 
            'added_by', 'added_at', 'is_playing', 'played_at'
        ]
        read_only_fields = ['id', 'added_at', 'played_at']

