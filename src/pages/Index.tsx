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
  user_id?: string;
  created_at: string;
}

const Index = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
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

  // Load posts from Supabase
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading posts:', error);
        toast({
          title: "Error",
          description: "Failed to load posts. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
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
        setPosts([data[0], ...posts]);
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

          setPosts(posts.filter(post => post.id !== postId));
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
                <div key={post.id} className="w-full max-w-2xl mx-auto glass-card rounded-xl">
                  <div className="p-6">
                    {post.media_url && (
                      <div className="mb-4">
                        <img 
                          src={post.media_url} 
                          alt={post.title} 
                          className="w-full h-auto rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop';
                          }}
                        />
                      </div>
                    )}
                    <h2 className="text-xl font-bold text-brand-primary mb-2">
                      {post.title}
                    </h2>
                    <p className="text-text-secondary leading-relaxed mb-4">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between text-sm text-text-muted">
                      <span>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      {user && post.user_id === user.id && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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