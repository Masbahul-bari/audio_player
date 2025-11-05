from django.contrib import admin
from .models import Track, PlaylistTrack


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'artist', 'album', 'duration_seconds', 'genre']
    search_fields = ['title', 'artist', 'album']
    list_filter = ['genre']


@admin.register(PlaylistTrack)
class PlaylistTrackAdmin(admin.ModelAdmin):
    list_display = ['id', 'track', 'position', 'votes', 'added_by', 'added_at', 'is_playing']
    list_filter = ['is_playing', 'added_at']
    search_fields = ['track__title', 'track__artist', 'added_by']

