import { supabase } from "@/integrations/supabase/client";

export interface GalleryVideo {
  id: string;
  title: string;
  description?: string;
  youtube_url: string;
  youtube_video_id: string;
  thumbnail_url?: string;
  duration?: number;
  category: string;
  tags: string[];
  is_featured: boolean;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateVideoData {
  title: string;
  description?: string;
  youtube_url: string;
  category?: string;
  tags?: string[];
  is_featured?: boolean;
  is_public?: boolean;
}

export interface UpdateVideoData {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  is_featured?: boolean;
  is_public?: boolean;
}

// Extract YouTube video ID from URL
export const extractYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Get YouTube thumbnail URL
export const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
};

// Get all public videos
export const getAllVideos = async (): Promise<GalleryVideo[]> => {
  const { data, error } = await supabase
    .from('gallery_videos')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  return data || [];
};

// Get videos by category
export const getVideosByCategory = async (category: string): Promise<GalleryVideo[]> => {
  const { data, error } = await supabase
    .from('gallery_videos')
    .select('*')
    .eq('is_public', true)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch videos by category: ${error.message}`);
  }

  return data || [];
};

// Get featured videos
export const getFeaturedVideos = async (): Promise<GalleryVideo[]> => {
  const { data, error } = await supabase
    .from('gallery_videos')
    .select('*')
    .eq('is_public', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch featured videos: ${error.message}`);
  }

  return data || [];
};

// Get recent videos (last 30 days)
export const getRecentVideos = async (): Promise<GalleryVideo[]> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('gallery_videos')
    .select('*')
    .eq('is_public', true)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch recent videos: ${error.message}`);
  }

  return data || [];
};

// Get all videos (admin only)
export const getAllVideosAdmin = async (): Promise<GalleryVideo[]> => {
  const { data, error } = await supabase
    .from('gallery_videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch all videos: ${error.message}`);
  }

  return data || [];
};

// Get video by ID
export const getVideoById = async (id: string): Promise<GalleryVideo | null> => {
  const { data, error } = await supabase
    .from('gallery_videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Video not found
    }
    throw new Error(`Failed to fetch video: ${error.message}`);
  }

  return data;
};

// Create new video
export const createVideo = async (videoData: CreateVideoData): Promise<GalleryVideo> => {
  const videoId = extractYouTubeVideoId(videoData.youtube_url);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  const thumbnailUrl = getYouTubeThumbnail(videoId, 'medium');

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('gallery_videos')
    .insert({
      ...videoData,
      youtube_video_id: videoId,
      thumbnail_url: thumbnailUrl,
      category: videoData.category || 'general',
      tags: videoData.tags || [],
      is_featured: videoData.is_featured || false,
      is_public: videoData.is_public !== false, // default to true
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Create video error:', error);
    throw new Error(`Failed to create video: ${error.message}`);
  }

  return data;
};

// Update video
export const updateVideo = async (id: string, videoData: UpdateVideoData): Promise<GalleryVideo> => {
  const { data, error } = await supabase
    .from('gallery_videos')
    .update(videoData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update video: ${error.message}`);
  }

  return data;
};

// Delete video
export const deleteVideo = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('gallery_videos')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete video: ${error.message}`);
  }
};

// Increment view count
export const incrementViewCount = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('gallery_videos')
    .update({ view_count: supabase.sql`view_count + 1` })
    .eq('id', id);

  if (error) {
    console.error('Failed to increment view count:', error.message);
  }
};

// Get unique categories
export const getVideoCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('gallery_videos')
    .select('category')
    .eq('is_public', true);

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  const categories = [...new Set(data?.map(item => item.category) || [])];
  return categories.sort();
};

// Search videos
export const searchVideos = async (query: string): Promise<GalleryVideo[]> => {
  const { data, error } = await supabase
    .from('gallery_videos')
    .select('*')
    .eq('is_public', true)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to search videos: ${error.message}`);
  }

  return data || [];
};
