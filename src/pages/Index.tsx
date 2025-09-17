import { useEffect, useState } from "react";
import Header from "@/components/Header";
import PostForm from "@/components/PostForm";
import Post from "@/components/Post";
import ConfirmModal from "@/components/ConfirmModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
const BG_URL = "https://i.imgur.com/b5Hqb4d.png";

interface PostData {
  id: string;
  title: string;
  content: string;
  media_url: string;
  post_type: string;
  user_id?: string;
  created_at: string;
}

interface ReactionData {
  post_id: string;
  emoji: string;
  count: number;
}

interface CommentData {
  id: string;
  post_id: string;
  text: string;
  author: string;
  created_at: string;
}

const Index = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [reactions, setReactions] = useState<{ [postId: string]: { [emoji: string]: number } }>({});
  const [comments, setComments] = useState<{ [postId: string]: CommentData[] }>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Authentication and data loading
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        // Sign in anonymously if no user
        supabase.auth.signInAnonymously();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load posts and set up real-time subscriptions
  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
  }, []);

  const loadData = async () => {
    try {
      // Load posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      
      // Ensure all posts have post_type field (default to 'photo' for existing posts)
      const postsWithType = (postsData || []).map((post: any) => ({
        ...post,
        post_type: post.post_type || 'photo'
      }));
      setPosts(postsWithType);

      // Load reactions
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('reactions')
        .select('post_id, emoji, user_id');

      if (reactionsError) throw reactionsError;

      // Group reactions by post and emoji
      const reactionsMap: { [postId: string]: { [emoji: string]: number } } = {};
      reactionsData?.forEach(reaction => {
        if (!reactionsMap[reaction.post_id]) reactionsMap[reaction.post_id] = {};
        if (!reactionsMap[reaction.post_id][reaction.emoji]) reactionsMap[reaction.post_id][reaction.emoji] = 0;
        reactionsMap[reaction.post_id][reaction.emoji]++;
      });
      setReactions(reactionsMap);

      // Load comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Group comments by post
      const commentsMap: { [postId: string]: CommentData[] } = {};
      commentsData?.forEach(comment => {
        if (!commentsMap[comment.post_id]) commentsMap[comment.post_id] = [];
        commentsMap[comment.post_id].push(comment);
      });
      setComments(commentsMap);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Posts subscription
    const postsChannel = supabase
      .channel('posts-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
        (payload) => {
          setPosts(prev => [payload.new as PostData, ...prev]);
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, 
        (payload) => {
          setPosts(prev => prev.filter(post => post.id !== payload.old.id));
        })
      .subscribe();

    // Reactions subscription
    const reactionsChannel = supabase
      .channel('reactions-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, 
        () => {
          loadReactions(); // Reload reactions on any change
        })
      .subscribe();

    // Comments subscription
    const commentsChannel = supabase
      .channel('comments-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, 
        (payload) => {
          const newComment = payload.new as CommentData;
          setComments(prev => ({
            ...prev,
            [newComment.post_id]: [...(prev[newComment.post_id] || []), newComment]
          }));
        })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(commentsChannel);
    };
  };

  const loadReactions = async () => {
    const { data: reactionsData } = await supabase
      .from('reactions')
      .select('post_id, emoji, user_id');

    const reactionsMap: { [postId: string]: { [emoji: string]: number } } = {};
    reactionsData?.forEach(reaction => {
      if (!reactionsMap[reaction.post_id]) reactionsMap[reaction.post_id] = {};
      if (!reactionsMap[reaction.post_id][reaction.emoji]) reactionsMap[reaction.post_id][reaction.emoji] = 0;
      reactionsMap[reaction.post_id][reaction.emoji]++;
    });
    setReactions(reactionsMap);
  };
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handlePostCreate = async (newPost: {
    title: string;
    content: string;
    mediaUrl: string;
    type: string;
  }) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please wait while we set up your session.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            title: newPost.title,
            content: newPost.content,
            media_url: newPost.mediaUrl,
            post_type: newPost.type,
            user_id: user.id,
          }
        ])
        .select();

      if (error) {
        console.error('Error creating post:', error);
        toast({
          title: "Error",
          description: "Failed to create post. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        // Don't manually update posts here - real-time subscription will handle it
        toast({
          title: "Success",
          description: "Post created successfully!",
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Post",
      message: "Are you sure you want to delete this post? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

          if (error) {
            console.error('Error deleting post:', error);
            toast({
              title: "Error",
              description: "Failed to delete post. Please try again.",
              variant: "destructive",
            });
            return;
          }

          // Don't manually update posts here - real-time subscription will handle it
          toast({
            title: "Success",
            description: "Post deleted successfully.",
          });
        } catch (error) {
          console.error('Error deleting post:', error);
          toast({
            title: "Error",
            description: "An unexpected error occurred.",
            variant: "destructive",
          });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleReaction = async (postId: string, emoji: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please wait while we set up your session.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if reaction already exists
      const { data: existing } = await supabase
        .from('reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            emoji: emoji,
          });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleComment = async (postId: string, commentText: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please wait while we set up your session.",
        variant: "destructive",
      });
      return;
    }

    try {
      await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          text: commentText,
          author: user.email ? user.email.split('@')[0] : 'Anonymous',
        });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="min-h-screen bg-app-background text-text-primary"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-app-background/80 to-app-background/60">
        <Header />
        
        <div className="container mx-auto px-4 space-y-8">
          <PostForm onPostCreate={handlePostCreate} />
          
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-text-secondary mb-2">
                  Loading posts...
                </h2>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-text-secondary mb-2">
                  No posts yet
                </h2>
                <p className="text-text-muted">
                  Create your first post to get started!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <Post
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  content={post.content}
                  type={post.post_type || 'photo'}
                  mediaUrl={post.media_url}
                  reactions={reactions[post.id] || {}}
                  comments={comments[post.id] || []}
                  canDelete={user && post.user_id === user.id}
                  onReaction={handleReaction}
                  onComment={handleComment}
                  onDelete={handleDeletePost}
                />
              ))
            )}
          </div>
        </div>
        
        <footer className="text-center py-8 text-text-muted">
          <p>© 2024 Lau Lau Talk. Made with ❤️</p>
        </footer>
      </div>
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};

export default Index;