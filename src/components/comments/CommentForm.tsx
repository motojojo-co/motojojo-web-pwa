import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createComment } from '@/services/commentService';

interface CommentFormProps {
  eventId: string;
  parentCommentId?: string;
  onCommentAdded: () => void;
  placeholder?: string;
  isReply?: boolean;
  onCancel?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({
  eventId,
  parentCommentId,
  onCommentAdded,
  placeholder = "Share your thoughts about this event...",
  isReply = false,
  onCancel
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isSignedIn, user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add a comment.",
        variant: "destructive",
      });
      return;
    }

    if (!commentText.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createComment({
        event_id: eventId,
        comment_text: commentText.trim(),
        parent_comment_id: parentCommentId || undefined,
      });

      setCommentText('');
      onCommentAdded();
      
      toast({
        title: "Comment added",
        description: isReply ? "Your reply has been posted." : "Your comment has been posted.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Sign in to comment
          </h3>
          <p className="text-gray-500 mb-4">
            Join the conversation and share your thoughts about this event.
          </p>
          <Button 
            onClick={() => window.location.href = '/auth'}
            className="bg-primary hover:bg-primary/90"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50/60 border-blue-200/70">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={placeholder}
                className="min-h-[90px] resize-none border-gray-300 focus:border-primary focus:ring-primary rounded-lg"
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-2">
                <span className={`text-xs ${commentText.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                  {commentText.length}/500 characters
                </span>
                <div className="flex gap-2">
                  {isReply && onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onCancel}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!commentText.trim() || isSubmitting || commentText.length > 500}
                    className="bg-primary hover:bg-primary/90 gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isReply ? 'Posting Reply...' : 'Posting...'}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {isReply ? 'Reply' : 'Comment'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CommentForm;
