import { useState } from "react";
import Header from "@/components/Header";
import PostForm from "@/components/PostForm";
import Post from "@/components/Post";
import ConfirmModal from "@/components/ConfirmModal";
import appBackground from "@/assets/app-background.jpg";

interface PostData {
  id: string;
  title: string;
  content: string;
  type: string;
  mediaUrl: string;
  reactions: { [emoji: string]: number };
  comments: Array<{ id: string; text: string; author: string }>;
  authorId: string;
  createdAt: Date;
}

const Index = () => {
  const [posts, setPosts] = useState<PostData[]>([
    {
      id: "1",
      title: "Welcome to Lau Lau Talk!",
      content: "This is the beginning of something amazing. A place where thoughts, photos, and videos come together to create meaningful conversations. Join me on this journey of sharing and connecting! ✨",
      type: "photo",
      mediaUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop",
      reactions: { "👍": 5, "❤️": 12, "😂": 2 },
      comments: [
        { id: "c1", text: "Love this concept! Can't wait to see more posts.", author: "User123" },
        { id: "c2", text: "Finally, a platform that feels personal and engaging.", author: "Creator456" }
      ],
      authorId: "current-user",
      createdAt: new Date(),
    },
  ]);
  
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

  const currentUserId = "current-user";

  const handlePostCreate = (newPost: {
    title: string;
    content: string;
    type: string;
    mediaUrl: string;
  }) => {
    const post: PostData = {
      id: Date.now().toString(),
      ...newPost,
      reactions: {},
      comments: [],
      authorId: currentUserId,
      createdAt: new Date(),
    };
    
    setPosts([post, ...posts]);
  };

  const handleReaction = (postId: string, emoji: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [emoji]: (post.reactions[emoji] || 0) + 1,
          },
        };
      }
      return post;
    }));
  };

  const handleComment = (postId: string, commentText: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newComment = {
          id: Date.now().toString(),
          text: commentText,
          author: `User${Math.floor(Math.random() * 1000)}`,
        };
        return {
          ...post,
          comments: [...post.comments, newComment],
        };
      }
      return post;
    }));
  };

  const handleDeletePost = (postId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Post",
      message: "Are you sure you want to delete this post? This action cannot be undone.",
      onConfirm: () => {
        setPosts(posts.filter(post => post.id !== postId));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div 
      className="min-h-screen bg-app-background text-text-primary"
      style={{
        backgroundImage: `url(${appBackground})`,
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
            {posts.length === 0 ? (
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
                  type={post.type}
                  mediaUrl={post.mediaUrl}
                  reactions={post.reactions}
                  comments={post.comments}
                  canDelete={post.authorId === currentUserId}
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