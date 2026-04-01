import { useState, useEffect } from "react";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import {
  GalleryVideo,
  getAllVideos,
  getVideosByCategory,
  getFeaturedVideos,
  getVideoCategories,
  searchVideos,
  incrementViewCount,
} from "@/services/galleryVideoService";
import {
  Play,
  Search,
  Star,
  Clock,
  Grid3X3,
  List,
  Calendar,
  Tag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Video Preview Component with fallback
const VideoPreview = ({ videoId, title, className }: { videoId: string; title: string; className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <img
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 animate-pulse">
          <Play className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );
};

const Gallery = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<GalleryVideo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch all data with error handling
  const { data: allVideos = [], isLoading: allVideosLoading, error: allVideosError } = useQuery({
    queryKey: ['gallery-videos'],
    queryFn: getAllVideos,
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch videos:', error);
    }
  });

  const { data: featuredVideos = [], isLoading: featuredLoading, error: featuredError } = useQuery({
    queryKey: ['featured-videos'],
    queryFn: getFeaturedVideos,
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch featured videos:', error);
    }
  });

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['video-categories'],
    queryFn: getVideoCategories,
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch categories:', error);
    }
  });

  // Search functionality
  const { data: searchResults = [], isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['search-videos', searchQuery],
    queryFn: () => searchVideos(searchQuery),
    enabled: searchQuery.length > 0,
    retry: 1,
    onError: (error) => {
      console.error('Failed to search videos:', error);
    }
  });

  // Category videos
  const { data: categoryVideos = [], isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: ['category-videos', selectedCategory],
    queryFn: () => getVideosByCategory(selectedCategory),
    enabled: selectedCategory !== 'all',
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch category videos:', error);
    }
  });

  const handleVideoClick = async (video: GalleryVideo) => {
    setSelectedVideo(video);
    // Increment view count (with error handling)
    try {
      await incrementViewCount(video.id);
    } catch (error) {
      console.error('Failed to increment view count:', error);
      // Don't show error to user, just log it
    }
  };

  const getEmbedUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  };

  // Get YouTube preview URL that auto-plays the first 15-20 seconds
  const getYouTubePreviewUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&start=0&end=20&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&cc_load_policy=0&disablekb=1`;
  };

  // Fallback to thumbnail if iframe fails
  const getThumbnailUrl = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDisplayVideos = () => {
    if (searchQuery) return searchResults;
    if (selectedCategory !== 'all') return categoryVideos;
    return allVideos;
  };

  const isLoading = allVideosLoading || (searchQuery ? searchLoading : false) || (selectedCategory !== 'all' ? categoryLoading : false);
  
  // Check if there are any database errors
  const hasDatabaseError = allVideosError || featuredError || categoriesError || searchError || categoryError;

  return (
    <div className="min-h-screen bg-raspberry">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-32 relative">
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[680px] h-[220px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25),rgba(255,255,255,0))] blur-2xl"></div>
        <div className="pointer-events-none absolute top-20 right-6 w-44 h-44 rounded-full bg-white/10 blur-3xl"></div>
        <div className="pointer-events-none absolute -top-6 left-6 w-36 h-36 rounded-full bg-white/10 blur-3xl"></div>
        <FadeIn>
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white text-sm font-semibold tracking-wide mb-4 border border-white/25">
              <Play className="h-4 w-4" />
              Moments • Performances • Memories
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">
              Gallery
            </h1>
            <p className="text-red-100 max-w-2xl mx-auto">
              Relive the energy of Motojojo with a living library of highlights, community stories, and unforgettable experiences.
            </p>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 shadow-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400 h-4 w-4" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/95 backdrop-blur-sm border-red-200 focus:border-red-300 focus:ring-red-300 text-black placeholder:text-gray-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Featured Highlight Reel */}
          {featuredVideos.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl md:text-2xl font-bold text-white">Featured Reel</h3>
                <span className="text-sm text-white/70">Hand‑picked energy</span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory">
                {featuredVideos.slice(0, 8).map((video) => (
                  <div
                    key={video.id}
                    className="min-w-[240px] md:min-w-[280px] snap-start cursor-pointer group"
                    onClick={() => handleVideoClick(video)}
                  >
                    <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                      <VideoPreview
                        videoId={video.youtube_video_id}
                        title={video.title}
                        className="group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                        Featured
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-white font-semibold text-sm line-clamp-1">{video.title}</p>
                      <p className="text-white/70 text-xs">{video.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Database Error Message */}
          {hasDatabaseError && (
            <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-100 text-sm">
                ⚠️ Some videos may not be loading properly. Please check your database connection or try refreshing the page.
              </p>
            </div>
          )}

          {/* Main Content */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/20 backdrop-blur-sm border-white/30">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-red-600 text-white">All Videos</TabsTrigger>
              <TabsTrigger value="featured" className="data-[state=active]:bg-white data-[state=active]:text-red-600 text-white">Featured</TabsTrigger>
              <TabsTrigger value="categories" className="data-[state=active]:bg-white data-[state=active]:text-red-600 text-white">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <VideoGrid
                videos={getDisplayVideos()}
                isLoading={isLoading}
                viewMode={viewMode}
                onVideoClick={handleVideoClick}
              />
            </TabsContent>

            <TabsContent value="featured" className="mt-6">
              <VideoGrid
                videos={featuredVideos}
                isLoading={featuredLoading}
                viewMode={viewMode}
                onVideoClick={handleVideoClick}
              />
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <CategoryCard
                    key={category}
                    category={category}
                    videoCount={allVideos.filter(v => v.category === category).length}
                    onClick={() => setSelectedCategory(category)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </main>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-red-500 via-red-600 to-red-700 border-red-400">
          {selectedVideo && (
            <>
              <DialogHeader className="text-center">
                <DialogTitle className="text-2xl text-white font-bold drop-shadow-lg">{selectedVideo.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="aspect-video w-full relative">
                  <iframe
                    src={getEmbedUrl(selectedVideo.youtube_video_id)}
                    title={selectedVideo.title}
                    className="w-full h-full rounded-xl shadow-2xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <div className="absolute -top-2 -right-2">
                    {selectedVideo.is_featured && (
                      <div className="bg-yellow-500 rounded-full p-2 shadow-lg">
                        <Star className="h-5 w-5 text-white fill-current" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4 bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  {selectedVideo.description && (
                    <p className="text-red-100 text-lg leading-relaxed">{selectedVideo.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(selectedVideo.created_at)}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Tag className="h-4 w-4 mr-2" />
                      {selectedVideo.category}
                    </Badge>
                    {selectedVideo.duration && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatDuration(selectedVideo.duration)}
                      </Badge>
                    )}
                  </div>
                  {selectedVideo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedVideo.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-white/10 text-white border-white/30 hover:bg-white/20">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

// Video Grid Component
const VideoGrid = ({ 
  videos, 
  isLoading, 
  viewMode, 
  onVideoClick 
}: { 
  videos: GalleryVideo[];
  isLoading: boolean;
  viewMode: 'grid' | 'list';
  onVideoClick: (video: GalleryVideo) => void;
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-white/20 rounded-lg mb-2"></div>
            <div className="h-4 bg-white/20 rounded mb-1"></div>
            <div className="h-3 bg-white/20 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <Video className="h-16 w-16 text-white/50 mx-auto mb-4" />
          <p className="text-white text-lg">No videos found</p>
          <p className="text-red-100 text-sm mt-2">Check back later for new content!</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {videos.map((video) => (
          <Card key={video.id} className="cursor-pointer hover:shadow-2xl transition-all duration-300 group bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 hover:-translate-y-0.5" onClick={() => onVideoClick(video)}>
            <CardContent className="flex gap-4 p-4">
              <div className="relative w-32 h-20 flex-shrink-0">
                {/* Auto-playing YouTube video preview with fallback */}
                <VideoPreview 
                  videoId={video.youtube_video_id}
                  title={video.title}
                  className="rounded group-hover:scale-105 transition-transform duration-300"
                />
                
                {video.is_featured && (
                  <div className="absolute top-1 right-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate text-white">{video.title}</h3>
                {video.description && (
                  <p className="text-red-100 text-sm line-clamp-2">{video.description}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                    {video.category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <Card key={video.id} className="cursor-pointer hover:shadow-2xl transition-all duration-300 group bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 hover:-translate-y-1" onClick={() => onVideoClick(video)}>
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            {/* Auto-playing YouTube video preview with fallback */}
            <VideoPreview 
              videoId={video.youtube_video_id}
              title={video.title}
              className="group-hover:scale-110 transition-transform duration-300"
            />
            
            {video.is_featured && (
              <div className="absolute top-3 right-3">
                <div className="bg-yellow-500 rounded-full p-1.5 shadow-lg">
                  <Star className="h-4 w-4 text-white fill-current" />
                </div>
              </div>
            )}
          </div>
          <CardContent className="p-4 bg-white/5">
            <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-white">{video.title}</h3>
            <div className="flex gap-1 flex-wrap">
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                {video.category}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ 
  category, 
  videoCount, 
  onClick 
}: { 
  category: string;
  videoCount: number;
  onClick: () => void;
}) => {
  return (
    <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 group bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20" onClick={onClick}>
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
          <Tag className="h-8 w-8 text-white" />
        </div>
        <h3 className="font-semibold text-lg capitalize text-white">{category}</h3>
        <p className="text-red-100 text-sm">{videoCount} video{videoCount !== 1 ? 's' : ''}</p>
      </CardContent>
    </Card>
  );
};

export default Gallery;
