from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
import uuid

from .models import Track, PlaylistTrack
from .serializers import TrackSerializer, PlaylistTrackSerializer
from .utils import calculate_position, get_playlist_bounds
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


@api_view(['GET'])
def tracks_list(request):
    """GET /api/tracks - Get all available tracks in library"""
    tracks = Track.objects.all()
    serializer = TrackSerializer(tracks, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
def playlist_list(request):
    """GET /api/playlist - Get current playlist ordered by position
       POST /api/playlist - Add track to playlist"""
    if request.method == 'GET':
        playlist_items = PlaylistTrack.objects.select_related('track').order_by('position')
        serializer = PlaylistTrackSerializer(playlist_items, many=True)
        return Response(serializer.data)
    
    # POST method - Add track to playlist
    track_id = request.data.get('track_id')
    added_by = request.data.get('added_by', 'Anonymous')

    if not track_id:
        return Response(
            {'error': {'code': 'MISSING_TRACK_ID', 'message': 'track_id is required'}},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if track exists
    track = get_object_or_404(Track, id=track_id)

    # Check if track is already in playlist
    if PlaylistTrack.objects.filter(track_id=track_id).exists():
        return Response(
            {'error': {'code': 'DUPLICATE_TRACK', 'message': 'This track is already in the playlist', 'details': {'track_id': track_id}}},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get all playlist items ordered by position
    playlist_items = list(PlaylistTrack.objects.all().order_by('position'))
    
    # Calculate position (append to end)
    prev_position = playlist_items[-1].position if playlist_items else None
    next_position = None
    position = calculate_position(prev_position, next_position)

    # Create playlist item
    playlist_item = PlaylistTrack.objects.create(
        id=f'playlist-item-{uuid.uuid4().hex[:12]}',
        track=track,
        position=position,
        added_by=added_by,
        votes=0,
        is_playing=False
    )

    serializer = PlaylistTrackSerializer(playlist_item)
    
    # Broadcast to WebSocket clients
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'playlist',
            {
                'type': 'track_added',
                'item': serializer.data
            }
        )

    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
def playlist_update(request, playlist_id):
    """PATCH /api/playlist/{id} - Update position or playing status
       DELETE /api/playlist/{id} - Remove track from playlist"""
    if request.method == 'DELETE':
        playlist_item = get_object_or_404(PlaylistTrack, id=playlist_id)
        playlist_item.delete()
        
        # Broadcast removal event
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                'playlist',
                {
                    'type': 'track_removed',
                    'id': playlist_id
                }
            )
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    # PATCH method
    playlist_item = get_object_or_404(PlaylistTrack, id=playlist_id)
    
    # Update position if provided
    if 'position' in request.data:
        new_position = request.data['position']
        playlist_item.position = new_position
        playlist_item.save()
        
        # Broadcast move event
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                'playlist',
                {
                    'type': 'track_moved',
                    'item': {
                        'id': playlist_item.id,
                        'position': playlist_item.position
                    }
                }
            )
    
    # Update playing status if provided
    if 'is_playing' in request.data:
        is_playing = request.data['is_playing']
        playlist_item.is_playing = is_playing
        playlist_item.save()
        
        # Broadcast playing event
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                'playlist',
                {
                    'type': 'track_playing',
                    'id': playlist_item.id
                }
            )
    
    serializer = PlaylistTrackSerializer(playlist_item)
    return Response(serializer.data)


@api_view(['POST'])
def playlist_vote(request, playlist_id):
    """POST /api/playlist/{id}/vote - Vote on a track"""
    playlist_item = get_object_or_404(PlaylistTrack, id=playlist_id)
    direction = request.data.get('direction', 'up')
    
    if direction == 'up':
        playlist_item.votes += 1
    elif direction == 'down':
        playlist_item.votes -= 1
    else:
        return Response(
            {'error': {'code': 'INVALID_DIRECTION', 'message': 'direction must be "up" or "down"'}},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    playlist_item.save()
    
    # Broadcast vote event
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'playlist',
            {
                'type': 'track_voted',
                'item': {
                    'id': playlist_item.id,
                    'votes': playlist_item.votes
                }
            }
        )
    
    serializer = PlaylistTrackSerializer(playlist_item)
    return Response(serializer.data)


@api_view(['POST'])
def playlist_reorder(request, playlist_id):
    """POST /api/playlist/{id}/reorder - Reorder track to a new position"""
    playlist_item = get_object_or_404(PlaylistTrack, id=playlist_id)
    target_index = request.data.get('target_index')
    
    if target_index is None:
        return Response(
            {'error': {'code': 'MISSING_TARGET_INDEX', 'message': 'target_index is required'}},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get all playlist items ordered by position
    playlist_items = list(PlaylistTrack.objects.exclude(id=playlist_id).order_by('position'))
    
    # Calculate new position
    prev_position, next_position = get_playlist_bounds(target_index, playlist_items)
    new_position = calculate_position(prev_position, next_position)
    
    playlist_item.position = new_position
    playlist_item.save()
    
    # Get updated full playlist
    updated_items = PlaylistTrack.objects.select_related('track').order_by('position')
    serializer = PlaylistTrackSerializer(updated_items, many=True)
    
    # Broadcast full reorder event
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'playlist',
            {
                'type': 'playlist_reordered',
                'items': serializer.data
            }
        )
    
    return Response(serializer.data)

