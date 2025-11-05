from django.urls import path
from . import views

urlpatterns = [
    path('tracks', views.tracks_list, name='tracks-list'),
    path('playlist', views.playlist_list, name='playlist-list'),
    path('playlist/<str:playlist_id>', views.playlist_update, name='playlist-update'),
    path('playlist/<str:playlist_id>/vote', views.playlist_vote, name='playlist-vote'),
    path('playlist/<str:playlist_id>/reorder', views.playlist_reorder, name='playlist-reorder'),
]

