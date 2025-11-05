from django.db import models
from django.utils import timezone


class Track(models.Model):
    """Track library - available tracks that can be added to playlist"""
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    album = models.CharField(max_length=255, blank=True, default='')
    duration_seconds = models.IntegerField()
    genre = models.CharField(max_length=100, blank=True, default='')
    cover_url = models.URLField(blank=True, null=True)

    class Meta:
        ordering = ['title', 'artist']

    def __str__(self):
        return f"{self.title} - {self.artist}"


class PlaylistTrack(models.Model):
    """Tracks in the collaborative playlist"""
    id = models.CharField(max_length=100, primary_key=True)
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='playlist_items')
    position = models.FloatField(help_text="Fractional position for ordering")
    votes = models.IntegerField(default=0)
    added_by = models.CharField(max_length=100, default='Anonymous')
    added_at = models.DateTimeField(auto_now_add=True)
    is_playing = models.BooleanField(default=False)
    played_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['position']

    def __str__(self):
        return f"{self.track.title} (position: {self.position})"

    def save(self, *args, **kwargs):
        # Ensure only one track is playing at a time
        if self.is_playing:
            PlaylistTrack.objects.filter(is_playing=True).exclude(id=self.id).update(
                is_playing=False,
                played_at=timezone.now()
            )
            if not self.played_at:
                self.played_at = timezone.now()
        super().save(*args, **kwargs)

