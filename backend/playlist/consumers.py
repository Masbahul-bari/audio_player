import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async


class PlaylistConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for realtime playlist updates"""
    
    async def connect(self):
        """Called when WebSocket connection is established"""
        self.group_name = 'playlist'
        
        # Join playlist group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial ping
        await self.send(text_data=json.dumps({
            'type': 'ping',
            'ts': self.get_timestamp()
        }))
    
    async def disconnect(self, close_code):
        """Called when WebSocket connection is closed"""
        # Leave playlist group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Called when message is received from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to ping
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'ts': self.get_timestamp()
                }))
        except json.JSONDecodeError:
            pass
    
    async def track_added(self, event):
        """Handler for track.added event"""
        await self.send(text_data=json.dumps({
            'type': 'track.added',
            'item': event['item']
        }))
    
    async def track_removed(self, event):
        """Handler for track.removed event"""
        await self.send(text_data=json.dumps({
            'type': 'track.removed',
            'id': event['id']
        }))
    
    async def track_moved(self, event):
        """Handler for track.moved event"""
        await self.send(text_data=json.dumps({
            'type': 'track.moved',
            'item': event['item']
        }))
    
    async def track_voted(self, event):
        """Handler for track.voted event"""
        await self.send(text_data=json.dumps({
            'type': 'track.voted',
            'item': event['item']
        }))
    
    async def track_playing(self, event):
        """Handler for track.playing event"""
        await self.send(text_data=json.dumps({
            'type': 'track.playing',
            'id': event['id']
        }))
    
    async def playlist_reordered(self, event):
        """Handler for playlist.reordered event"""
        await self.send(text_data=json.dumps({
            'type': 'playlist.reordered',
            'items': event['items']
        }))
    
    def get_timestamp(self):
        """Get current timestamp in ISO format"""
        from django.utils import timezone
        return timezone.now().isoformat()


def broadcast_to_group(group_name, message):
    """
    Helper function to broadcast messages to a channel group.
    This is used from synchronous views.
    """
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    
    if channel_layer:
        # Map message types to consumer method names
        type_map = {
            'track.added': 'track_added',
            'track.removed': 'track_removed',
            'track.moved': 'track_moved',
            'track.voted': 'track_voted',
            'track.playing': 'track_playing',
            'playlist.reordered': 'playlist_reordered',
        }
        
        message_type = message.get('type')
        handler_name = type_map.get(message_type, 'track_added')
        
        channel_layer.group_send(
            group_name,
            {
                'type': handler_name,
                **message
            }
        )

