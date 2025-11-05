/**
 * Utility functions for fractional position algorithm
 */

export interface PositionedItem {
  position: number;
}

/**
 * Calculate the position for inserting a track between two others.
 * This implements the fractional position algorithm that allows infinite
 * insertions without reindexing.
 */
export function calculatePosition(
  prevPosition: number | null | undefined,
  nextPosition: number | null | undefined
): number {
  if (prevPosition == null && nextPosition == null) {
    // First track in playlist
    return 1.0;
  }
  if (prevPosition == null) {
    // Inserting at the beginning
    return nextPosition! - 1;
  }
  if (nextPosition == null) {
    // Inserting at the end
    return prevPosition + 1;
  }
  // Inserting between two tracks
  return (prevPosition + nextPosition) / 2;
}

/**
 * Get the previous and next positions for inserting at a specific index.
 */
export function getPlaylistBounds<T extends PositionedItem>(
  index: number,
  playlistItems: T[]
): [number | null, number | null] {
  let prevPosition: number | null = null;
  let nextPosition: number | null = null;

  if (index > 0) {
    prevPosition = playlistItems[index - 1].position;
  }

  if (index < playlistItems.length) {
    nextPosition = playlistItems[index].position;
  }

  return [prevPosition, nextPosition];
}

