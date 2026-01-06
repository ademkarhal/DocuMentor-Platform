// YouTube Data API v3 Service
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface YouTubePlaylistItem {
  snippet: {
    title: string;
    description: string;
    resourceId: {
      videoId: string;
    };
    position: number;
  };
  contentDetails: {
    videoId: string;
  };
}

interface YouTubeVideoDetails {
  id: string;
  snippet: {
    title: string;
    description: string;
  };
  contentDetails: {
    duration: string; // ISO 8601 format like PT1H30M45S
  };
}

export interface PlaylistVideo {
  youtubeId: string;
  title: string;
  description: string;
  duration: number; // in seconds
  sequenceOrder: number;
}

// Convert ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

export async function fetchPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
  if (!YOUTUBE_API_KEY) {
    console.error('YouTube API key not found');
    return [];
  }

  const videos: PlaylistVideo[] = [];
  let nextPageToken = '';

  try {
    // Fetch all playlist items (handles pagination)
    do {
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const playlistResponse = await fetch(playlistUrl);
      const playlistData = await playlistResponse.json();

      if (playlistData.error) {
        console.error('YouTube API Error:', playlistData.error.message);
        return [];
      }

      const items: YouTubePlaylistItem[] = playlistData.items || [];
      
      if (items.length === 0) break;

      // Get video IDs to fetch durations
      const videoIds = items.map(item => item.contentDetails.videoId).join(',');
      
      // Fetch video details for durations
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
      const videosResponse = await fetch(videosUrl);
      const videosData = await videosResponse.json();
      
      const videoDetails: YouTubeVideoDetails[] = videosData.items || [];
      const durationMap = new Map<string, { duration: number; title: string; description: string }>();
      
      videoDetails.forEach(v => {
        durationMap.set(v.id, {
          duration: parseDuration(v.contentDetails.duration),
          title: v.snippet.title,
          description: v.snippet.description
        });
      });

      // Map playlist items to our format
      items.forEach((item, index) => {
        const videoId = item.contentDetails.videoId;
        const details = durationMap.get(videoId);
        
        if (details) {
          videos.push({
            youtubeId: videoId,
            title: details.title,
            description: details.description.substring(0, 500), // Limit description length
            duration: details.duration,
            sequenceOrder: videos.length + 1
          });
        }
      });

      nextPageToken = playlistData.nextPageToken || '';
    } while (nextPageToken);

    return videos;
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return [];
  }
}

export async function getPlaylistInfo(playlistId: string): Promise<{ title: string; description: string; thumbnail: string } | null> {
  if (!YOUTUBE_API_KEY) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const playlist = data.items[0];
      return {
        title: playlist.snippet.title,
        description: playlist.snippet.description || '',
        thumbnail: playlist.snippet.thumbnails?.high?.url || playlist.snippet.thumbnails?.default?.url || ''
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching playlist info:', error);
    return null;
  }
}
