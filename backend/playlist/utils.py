"""
Utility functions for playlist operations
"""


def calculate_position(prev_position=None, next_position=None):
    """
    Calculate the position for inserting a track between two others.
    
    This implements the fractional position algorithm that allows infinite
    insertions without reindexing.
    
    Args:
        prev_position: Position of the track before (None if inserting at start)
        next_position: Position of the track after (None if inserting at end)
    
    Returns:
        float: The calculated position
    """
    if prev_position is None and next_position is None:
        # First track in playlist
        return 1.0
    if prev_position is None:
        # Inserting at the beginning
        return next_position - 1
    if next_position is None:
        # Inserting at the end
        return prev_position + 1
    # Inserting between two tracks
    return (prev_position + next_position) / 2


def get_playlist_bounds(index, playlist_items):
    """
    Get the previous and next positions for inserting at a specific index.
    
    Args:
        index: The index where to insert
        playlist_items: QuerySet or list of PlaylistTrack items ordered by position
    
    Returns:
        tuple: (prev_position, next_position) - either can be None
    """
    prev_position = None
    next_position = None
    
    if index > 0:
        prev_item = playlist_items[index - 1]
        prev_position = prev_item.position
    
    if index < len(playlist_items):
        next_item = playlist_items[index]
        next_position = next_item.position
    
    return prev_position, next_position

