import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Heart, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_email?: string;
}

interface CommentSectionProps {
  tripId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ tripId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>({});

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const { data, error: err } = await supabase
          .from('trip_comments')
          .select('*')
          .eq('trip_id', tripId)
          .is('parent_comment_id', null)
          .order('created_at', { ascending: false });

        if (err) throw err;
        setComments(data || []);
      } catch (error) {
        console.error('Failed to load comments', error);
      }
    };

    const loadReactions = async () => {
      try {
        const { data, error: err } = await supabase
          .from('trip_reactions')
          .select('*')
          .eq('trip_id', tripId);

        if (err) throw err;
        const counts = (data || []).reduce(
          (acc, r) => {
            acc[r.id] = (acc[r.id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
        setReactions(counts);
      } catch (error) {
        console.error('Failed to load reactions', error);
      }
    };

    loadComments();
    loadReactions();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`comments:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_comments',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tripId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) {
      toast.error('Please enter a comment');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.from('trip_comments').insert([
        {
          trip_id: tripId,
          user_id: user.id,
          content: newComment,
        },
      ]);

      if (err) throw err;
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const { error: err } = await supabase
        .from('trip_comments')
        .delete()
        .eq('id', commentId);

      if (err) throw err;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('trip_reactions')
        .select('id')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Remove reaction
        await supabase.from('trip_reactions').delete().eq('id', existing.id);
        setReactions((prev) => ({
          ...prev,
          [tripId]: (prev[tripId] || 1) - 1,
        }));
      } else {
        // Add reaction
        await supabase.from('trip_reactions').insert([
          {
            trip_id: tripId,
            user_id: user.id,
            reaction_type: 'love',
          },
        ]);
        setReactions((prev) => ({
          ...prev,
          [tripId]: (prev[tripId] || 0) + 1,
        }));
      }
    } catch (error) {
      toast.error('Failed to update reaction');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5" />
        <h3 className="text-lg font-bold">Comments</h3>
        <span className="ml-auto text-sm text-gray-600">{comments.length}</span>
      </div>

      {/* Like Button */}
      <Button
        variant="outline"
        onClick={handleLike}
        className="w-full gap-2 text-sm"
      >
        <Heart className="w-4 h-4" />
        {reactions[tripId] || 0} people love this trip
      </Button>

      {/* Add Comment */}
      {user && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  {user.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={loading || !newComment.trim()}
                  size="sm"
                  className="earth-gradient"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback>
                      {comment.user_email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{comment.user_email || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm break-words">{comment.content}</p>
                  </div>
                  {user?.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
