-- Create reactions table
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table  
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for reactions
CREATE POLICY "Reactions are publicly readable" 
ON public.reactions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add reactions" 
ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" 
ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for comments
CREATE POLICY "Comments are publicly readable" 
ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add comments" 
ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Add post_type column to posts table for video/photo differentiation
ALTER TABLE public.posts ADD COLUMN post_type TEXT DEFAULT 'photo';

-- Enable realtime for all tables
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.reactions REPLICA IDENTITY FULL; 
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
SELECT cron.schedule('add_tables_to_realtime', '*/5 seconds', $$
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts, public.reactions, public.comments;
$$);