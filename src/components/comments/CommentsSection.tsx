import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import { getEventComments, type Comment } from '@/services/commentService';

interface CommentsSectionProps {
  eventId: string;
  isLocalGathering?: boolean;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  eventId,
  isLocalGathering = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const {
    data: comments = [],
    isLoading,
    error,
    refetch
  } = useQuery<Comment[]>({
    queryKey: ['event-comments', eventId],
    queryFn: () => getEventComments(eventId),
    enabled: !!eventId,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCommentAdded = () => {
    refetch();
  };

  const handleCommentUpdated = () => {
    refetch();
  };

  const handleCommentDeleted = () => {
    refetch();
  };

  if (error) {
    return (
      <Card className={`${isLocalGathering ? 'bg-[#F7E1B5]/50 border-[#0CA678]/20' : 'bg-white'} shadow-sm`}>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Unable to load comments
          </h3>
          <p className="text-gray-500 mb-4">
            There was an error loading the comments. Please try again.
          </p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
            isLocalGathering ? 'bg-[#0CA678]' : 'bg-primary'
          }`}>
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className={`text-2xl font-extrabold leading-tight ${
              isLocalGathering ? 'text-[#0CA678]' : 'text-gray-900'
            }`}>
              Comments
            </h3>
            <p className="text-xs text-gray-500 -mt-0.5">Join the conversation</p>
          </div>
          <span className={`ml-1 text-xs px-2.5 py-1 rounded-full border ${
            isLocalGathering 
              ? 'bg-[#0CA678]/10 text-[#0CA678] border-[#0CA678]/30' 
              : 'bg-primary/10 text-primary border-primary/30'
          }`}>
            {comments.length}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className={`${isLocalGathering ? 'border-[#0CA678]/30 text-[#0CA678] hover:bg-[#0CA678]/10' : ''} gap-2`}
        >
          {isRefreshing || isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Comment Form */}
      <CommentForm
        eventId={eventId}
        onCommentAdded={handleCommentAdded}
        placeholder="Share your thoughts about this event..."
      />

      {/* Comments List */}
      {isLoading ? (
        <Card className={`${isLocalGathering ? 'bg-[#F7E1B5]/50 border-[#0CA678]/20' : 'bg-white'} shadow-sm`}>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading comments...</p>
          </CardContent>
        </Card>
      ) : comments.length === 0 ? (
        <Card className={`${isLocalGathering ? 'bg-[#F7E1B5]/50 border-[#0CA678]/20' : 'bg-white'} shadow-sm`}>        
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No comments yet
            </h3>
            <p className="text-gray-500">
              Be the first to share your thoughts about this event!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
              isLocalGathering={isLocalGathering}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
