"""
Management command to seed the database with tracks and initial playlist.
Run with: python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from playlist.models import Track, PlaylistTrack
from django.utils import timezone
import random


TRACKS_DATA = [
    # Rock
    {"id": "track-1", "title": "Bohemian Rhapsody", "artist": "Queen", "album": "A Night at the Opera", "duration_seconds": 355, "genre": "Rock", "cover_url": "/rock-guitar-concert.jpg"},
    {"id": "track-2", "title": "Stairway to Heaven", "artist": "Led Zeppelin", "album": "Led Zeppelin IV", "duration_seconds": 482, "genre": "Rock", "cover_url": "/rock-guitar-concert.jpg"},
    {"id": "track-3", "title": "Hotel California", "artist": "Eagles", "album": "Hotel California", "duration_seconds": 391, "genre": "Rock", "cover_url": "/rock-guitar-concert.jpg"},
    {"id": "track-4", "title": "Sweet Child O' Mine", "artist": "Guns N' Roses", "album": "Appetite for Destruction", "duration_seconds": 356, "genre": "Rock", "cover_url": "/rock-guitar-concert.jpg"},
    {"id": "track-5", "title": "Back in Black", "artist": "AC/DC", "album": "Back in Black", "duration_seconds": 255, "genre": "Rock", "cover_url": "/rock-guitar-concert.jpg"},
    
    # Pop
    {"id": "track-6", "title": "Billie Jean", "artist": "Michael Jackson", "album": "Thriller", "duration_seconds": 294, "genre": "Pop", "cover_url": "/placeholder.jpg"},
    {"id": "track-7", "title": "Shape of You", "artist": "Ed Sheeran", "album": "÷", "duration_seconds": 233, "genre": "Pop", "cover_url": "/placeholder.jpg"},
    {"id": "track-8", "title": "Blinding Lights", "artist": "The Weeknd", "album": "After Hours", "duration_seconds": 200, "genre": "Pop", "cover_url": "/placeholder.jpg"},
    {"id": "track-9", "title": "Watermelon Sugar", "artist": "Harry Styles", "album": "Fine Line", "duration_seconds": 174, "genre": "Pop", "cover_url": "/placeholder.jpg"},
    {"id": "track-10", "title": "Levitating", "artist": "Dua Lipa", "album": "Future Nostalgia", "duration_seconds": 203, "genre": "Pop", "cover_url": "/placeholder.jpg"},
    
    # Electronic
    {"id": "track-11", "title": "Midnight Dreams", "artist": "Luna Echo", "album": "Neon Nights", "duration_seconds": 245, "genre": "Electronic", "cover_url": "/electronic-album-cover.png"},
    {"id": "track-12", "title": "Stellar Highway", "artist": "Astro Nomad", "album": "Space Odyssey", "duration_seconds": 203, "genre": "Electronic", "cover_url": "/space-stars-music.jpg"},
    {"id": "track-13", "title": "Electric Paradise", "artist": "Synth Wave", "album": "Digital Age", "duration_seconds": 267, "genre": "Synthwave", "cover_url": "/synthwave-neon-city.jpg"},
    {"id": "track-14", "title": "Neon Pulse", "artist": "Cyber City", "album": "Digital Dreams", "duration_seconds": 198, "genre": "Electronic", "cover_url": "/electronic-album-cover.png"},
    {"id": "track-15", "title": "Future Bass", "artist": "Electric Storm", "album": "Voltage", "duration_seconds": 220, "genre": "Electronic", "cover_url": "/electronic-album-cover.png"},
    
    # Jazz
    {"id": "track-16", "title": "Jazz Garden", "artist": "Smooth Quartet", "album": "Relaxation", "duration_seconds": 212, "genre": "Jazz", "cover_url": "/jazz-musical-instruments.jpg"},
    {"id": "track-17", "title": "Blue Note", "artist": "Miles Ahead", "album": "Classic Sessions", "duration_seconds": 287, "genre": "Jazz", "cover_url": "/jazz-musical-instruments.jpg"},
    {"id": "track-18", "title": "Smooth Operator", "artist": "Jazz Collective", "album": "Night Sessions", "duration_seconds": 234, "genre": "Jazz", "cover_url": "/jazz-musical-instruments.jpg"},
    {"id": "track-19", "title": "Take Five", "artist": "Dave Brubeck", "album": "Time Out", "duration_seconds": 324, "genre": "Jazz", "cover_url": "/jazz-musical-instruments.jpg"},
    {"id": "track-20", "title": "Kind of Blue", "artist": "Miles Davis", "album": "Kind of Blue", "duration_seconds": 345, "genre": "Jazz", "cover_url": "/jazz-musical-instruments.jpg"},
    
    # Classical
    {"id": "track-21", "title": "Classical Sunrise", "artist": "Orchestra Prime", "album": "Symphony No. 1", "duration_seconds": 321, "genre": "Classical", "cover_url": "/classical-orchestra-concert-hall.jpg"},
    {"id": "track-22", "title": "Moonlight Sonata", "artist": "Beethoven", "album": "Piano Sonatas", "duration_seconds": 900, "genre": "Classical", "cover_url": "/classical-orchestra-concert-hall.jpg"},
    {"id": "track-23", "title": "Four Seasons - Spring", "artist": "Vivaldi", "album": "The Four Seasons", "duration_seconds": 210, "genre": "Classical", "cover_url": "/classical-orchestra-concert-hall.jpg"},
    {"id": "track-24", "title": "Canon in D", "artist": "Pachelbel", "album": "Classical Collection", "duration_seconds": 252, "genre": "Classical", "cover_url": "/classical-orchestra-concert-hall.jpg"},
    {"id": "track-25", "title": "Clair de Lune", "artist": "Debussy", "album": "Suite Bergamasque", "duration_seconds": 300, "genre": "Classical", "cover_url": "/classical-orchestra-concert-hall.jpg"},
    
    # Hip-hop
    {"id": "track-26", "title": "Urban Jungle", "artist": "City Beats", "album": "Street Life", "duration_seconds": 234, "genre": "Hip-hop", "cover_url": "/city-urban-hip-hop.jpg"},
    {"id": "track-27", "title": "Power", "artist": "Kanye West", "album": "My Beautiful Dark Twisted Fantasy", "duration_seconds": 271, "genre": "Hip-hop", "cover_url": "/city-urban-hip-hop.jpg"},
    {"id": "track-28", "title": "Lose Yourself", "artist": "Eminem", "album": "8 Mile", "duration_seconds": 326, "genre": "Hip-hop", "cover_url": "/city-urban-hip-hop.jpg"},
    {"id": "track-29", "title": "Hotline Bling", "artist": "Drake", "album": "Views", "duration_seconds": 267, "genre": "Hip-hop", "cover_url": "/city-urban-hip-hop.jpg"},
    {"id": "track-30", "title": "Sicko Mode", "artist": "Travis Scott", "album": "Astroworld", "duration_seconds": 312, "genre": "Hip-hop", "cover_url": "/city-urban-hip-hop.jpg"},
    
    # Ambient/Chill
    {"id": "track-31", "title": "Ocean Waves", "artist": "Coastal Vibes", "album": "Summer Collection", "duration_seconds": 198, "genre": "Chill-out", "cover_url": "/ocean-beach-music.jpg"},
    {"id": "track-32", "title": "Forest Whispers", "artist": "Nature Sounds", "album": "Natural Ambience", "duration_seconds": 187, "genre": "Ambient", "cover_url": "/forest-nature-sounds.jpg"},
    {"id": "track-33", "title": "Meditation", "artist": "Zen Flow", "album": "Peaceful Moments", "duration_seconds": 420, "genre": "Ambient", "cover_url": "/forest-nature-sounds.jpg"},
    {"id": "track-34", "title": "Sunset Dreams", "artist": "Ambient Collective", "album": "Twilight", "duration_seconds": 245, "genre": "Ambient", "cover_url": "/ocean-beach-music.jpg"},
    {"id": "track-35", "title": "Calm Waters", "artist": "Serenity", "album": "Relaxation", "duration_seconds": 198, "genre": "Chill-out", "cover_url": "/ocean-beach-music.jpg"},
    
    # Indie
    {"id": "track-36", "title": "Indie Dreams", "artist": "Local Legends", "album": "Indie Vibes", "duration_seconds": 176, "genre": "Indie", "cover_url": "/indie-folk-acoustic.jpg"},
    {"id": "track-37", "title": "Acoustic Sessions", "artist": "Folk Collective", "album": "Homegrown", "duration_seconds": 203, "genre": "Indie", "cover_url": "/indie-folk-acoustic.jpg"},
    {"id": "track-38", "title": "Coffee Shop", "artist": "Indie Band", "album": "Morning Brew", "duration_seconds": 189, "genre": "Indie", "cover_url": "/indie-folk-acoustic.jpg"},
    {"id": "track-39", "title": "Vintage Vibes", "artist": "Retro Sounds", "album": "Nostalgia", "duration_seconds": 212, "genre": "Indie", "cover_url": "/indie-folk-acoustic.jpg"},
    {"id": "track-40", "title": "Homecoming", "artist": "Small Town Heroes", "album": "Local Scene", "duration_seconds": 195, "genre": "Indie", "cover_url": "/indie-folk-acoustic.jpg"},
]


class Command(BaseCommand):
    help = 'Seeds the database with tracks and initial playlist'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            PlaylistTrack.objects.all().delete()
            Track.objects.all().delete()

        # Create tracks
        self.stdout.write('Creating tracks...')
        tracks_created = 0
        for track_data in TRACKS_DATA:
            track, created = Track.objects.get_or_create(
                id=track_data['id'],
                defaults=track_data
            )
            if created:
                tracks_created += 1

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {tracks_created} tracks')
        )

        # Create initial playlist (8-10 tracks with variety)
        self.stdout.write('Creating initial playlist...')
        PlaylistTrack.objects.all().delete()  # Clear existing playlist
        
        initial_track_ids = [
            "track-11",  # Midnight Dreams (Electronic)
            "track-31",  # Ocean Waves (Chill-out)
            "track-13",  # Electric Paradise (Synthwave)
            "track-16",  # Jazz Garden (Jazz)
            "track-5",   # Back in Black (Rock)
            "track-26",  # Urban Jungle (Hip-hop)
            "track-21",  # Classical Sunrise (Classical)
            "track-36",  # Indie Dreams (Indie)
            "track-1",   # Bohemian Rhapsody (Rock)
            "track-6",   # Billie Jean (Pop)
        ]
        
        users = ["Alex", "Jordan", "Morgan", "Casey", "Riley", "Taylor", "Sam", "Avery"]
        vote_counts = [12, 8, 15, -2, 20, 5, 3, 10, 7, -1]
        
        playlist_items = []
        position = 1.0
        for idx, track_id in enumerate(initial_track_ids):
            track = Track.objects.get(id=track_id)
            playlist_item = PlaylistTrack.objects.create(
                id=f'playlist-item-{idx + 1}',
                track=track,
                position=position,
                votes=vote_counts[idx],
                added_by=random.choice(users),
                added_at=timezone.now(),
                is_playing=(idx == 0),  # First track is playing
            )
            playlist_items.append(playlist_item)
            position += 1.0

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created playlist with {len(playlist_items)} tracks'
            )
        )
        self.stdout.write(
            self.style.SUCCESS('Database seeding completed!')
        )

