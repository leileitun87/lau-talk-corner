import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PostProps {
  id: string;
  title: string;
  content: string;
  type: string;
  mediaUrl: string;
  reactions: { [emoji: string]: number };
  comments: Array<{ id: string; text: string; author: string }>;
  canDelete: boolean;
  onReaction: (postId: string, emoji: string) => void;
  onComment: (postId: string, comment: string) => void;
  onDelete: (postId: string) => void;
}

const Post = ({
  id,
  title,
  content,
  type,
  mediaUrl,
  reactions,
  comments,
  canDelete,
  onReaction,
  onComment,
  onDelete,
}: PostProps) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const renderMedia = () => {
    if (type === "photo") {
      return (
        <img
          src={mediaUrl}
          alt={title}
          className="rounded-t-lg w-full h-auto object-cover max-h-96"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/600x400/1E293B/E2E8F0?text=Image+Not+Found";
          }}
        />
      );
    } else if (type === "video") {
      const youtubeId = getYouTubeId(mediaUrl);
      const embedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : mediaUrl;
      
      return (
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-t-lg w-full h-full"
          />
        </div>
      );
    }
    return null;
  };

  const handleComment = () => {
    if (!newComment.trim()) {
      toast({
        title: "Empty Comment",
        description: "Please enter a comment before sending.",
        variant: "destructive",
      });
      return;
    }
    
    onComment(id, newComment);
    setNewComment("");
    
    toast({
      title: "Comment Added",
      description: "Your comment has been posted successfully.",
    });
  };

  const handleDelete = () => {
    onDelete(id);
    toast({
      title: "Post Deleted",
      description: "Your post has been removed successfully.",
    });
  };

  const reactionEmojis = ["👍", "❤️", "😂"];

  return (
    <Card className="w-full max-w-2xl mx-auto glass-card animate-fade-up mb-6">
      {renderMedia()}
      
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-brand-secondary mb-2">{title}</h2>
        <p className="text-text-secondary leading-relaxed mb-4">{content}</p>
        
        <div className="flex items-center justify-between py-4 border-t border-border">
          <div className="flex items-center space-x-4">
            {reactionEmojis.map((emoji) => (
              <div key={emoji} className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-2xl hover:bg-app-overlay p-2"
                  onClick={() => onReaction(id, emoji)}
                >
                  {emoji}
                </Button>
                <span className="text-text-muted text-sm">
                  {reactions[emoji] || 0}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-text-secondary hover:text-brand-primary"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Comments ({comments.length})
            </Button>
            
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {showComments && (
          <div className="space-y-4 pt-4 border-t border-border animate-fade-up">
            <h3 className="text-lg font-semibold text-text-primary">Comments</h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-app-overlay p-3 rounded-lg">
                  <p className="text-text-primary">{comment.text}</p>
                  <span className="text-text-muted text-xs">
                    by {comment.author}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-grow bg-app-overlay border-border text-text-primary"
                onKeyPress={(e) => e.key === "Enter" && handleComment()}
              />
              <Button
                onClick={handleComment}
                className="bg-brand-primary hover:bg-brand-secondary text-white"
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Post;