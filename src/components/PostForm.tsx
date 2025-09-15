import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PostFormProps {
  onPostCreate: (post: {
    title: string;
    content: string;
    type: string;
    mediaUrl: string;
  }) => void;
}

const PostForm = ({ onPostCreate }: PostFormProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("photo");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content || !mediaUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before creating a post.",
        variant: "destructive",
      });
      return;
    }

    onPostCreate({ title, content, type, mediaUrl });
    
    // Reset form
    setTitle("");
    setContent("");
    setMediaUrl("");
    
    toast({
      title: "Post Created!",
      description: "Your new post has been added successfully.",
    });
  };

  const generateContent = async () => {
    if (!content) {
      toast({
        title: "Content Required",
        description: "Please enter a short idea for your post first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate content generation (replace with actual API call)
    setTimeout(() => {
      const generatedContent = `${content} ✨\n\nThis is an exciting update that brings new perspectives and engaging insights to share with everyone. Looking forward to connecting and hearing your thoughts on this topic!`;
      setContent(generatedContent);
      setIsGenerating(false);
      
      toast({
        title: "Content Generated!",
        description: "Your post content has been enhanced.",
      });
    }, 2000);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto glass-card animate-fade-up">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-brand-primary">
          Create a New Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-text-secondary font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your post title..."
              className="bg-app-overlay border-border text-text-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-text-secondary font-medium">
                Content
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateContent}
                disabled={isGenerating}
                className="text-brand-primary hover:text-interactive-hover"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                {isGenerating ? "Generating..." : "Generate Content"}
              </Button>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="bg-app-overlay border-border text-text-primary min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-text-secondary font-medium">
              Content Type
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-app-overlay border-border text-text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">Photo</SelectItem>
                <SelectItem value="video">YouTube Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mediaUrl" className="text-text-secondary font-medium">
              Media URL
            </Label>
            <Input
              id="mediaUrl"
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Paste image or YouTube embed URL here"
              className="bg-app-overlay border-border text-text-primary"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 transition-all duration-300"
          >
            Create Post
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PostForm;