from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/playlist/$', consumers.PlaylistConsumer.as_asgi()),
]

