import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Reply, 
  Edit, 
  Trash2, 
  MoreVertical,
  Loader2,
  Check,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import CommentForm from './CommentForm';
import { updateComment, deleteComment } from '@/services/commentService';
import type { Comment } from '@/services/commentService';

interface CommentItemProps {
  comment: Comment;
  onCommentUpdated: () => void;
  onCommentDeleted: () => void;
  isLocalGathering?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onCommentUpdated,
  onCommentDeleted,
  isLocalGathering = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editText, setEditText] = useState(comment.comment_text);
  const { user } = useAuth();
  const { toast } = useToast();

  const isOwner = user?.id === comment.user_id;
  const userName = comment.user?.user_metadata?.full_name || 
                  comment.user?.user_metadata?.name || 
                  comment.user?.email?.split('@')[0] || 
                  'Anonymous';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateComment(comment.id, {
        comment_text: editText.trim(),
      });

      setIsEditing(false);
      onCommentUpdated();
      
      toast({
        title: "Comment updated",
        description: "Your comment has been updated.",
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      await deleteComment(comment.id);

      onCommentDeleted();
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplyAdded = () => {
    setIsReplying(false);
    onCommentUpdated();
  };

  return (
    <div className="space-y-3">
      <Card className={`${isLocalGathering ? 'bg-[#F7E1B5]/50 border-[#0CA678]/20' : 'bg-white'} shadow-sm`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-sm ${
              isLocalGathering ? 'bg-[#0CA678]' : 'bg-primary'
            }`}>
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`font-semibold text-sm ${
                  isLocalGathering ? 'text-[#0CA678]' : 'text-gray-900'
                }`}>
                  {userName}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    isLocalGathering 
                      ? 'border-[#0CA678]/30 text-[#0CA678]' 
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {formatDate(comment.created_at)}
                </Badge>
                {comment.is_edited && (
                  <Badge 
                    variant="outline" 
                    className="text-xs text-gray-500"
                  >
                    edited
                  </Badge>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:border-primary focus:ring-primary"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {editText.length}/500 characters
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditText(comment.comment_text);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleEdit}
                        disabled={!editText.trim() || editText.length > 500}
                        className={isLocalGathering ? 'bg-[#0CA678] hover:bg-[#0a8a6a]' : ''}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${
                  isLocalGathering ? 'text-gray-800' : 'text-gray-700'
                }`}>
                  {comment.comment_text}
                </p>
              )}

              {!isEditing && (
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReplying(!isReplying)}
                    className={`text-xs hover:bg-gray-100 ${
                      isLocalGathering ? 'text-[#0CA678] hover:bg-[#0CA678]/10' : 'text-gray-600'
                    }`}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>

                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-600 hover:bg-gray-100"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setIsEditing(true)}
                          className="text-xs"
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleDelete}
                          className="text-xs text-red-600 focus:text-red-600"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-2" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      {isReplying && (
        <div className="ml-8 pl-5 border-l border-gray-200">
          <CommentForm
            eventId={comment.event_id}
            parentCommentId={comment.id}
            onCommentAdded={handleReplyAdded}
            placeholder="Write a reply..."
            isReply={true}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 pl-5 border-l border-gray-200 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
              isLocalGathering={isLocalGathering}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
