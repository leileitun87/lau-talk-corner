-- Add user_id column to posts table for RLS
ALTER TABLE public.posts 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing posts to have a default user_id (you can update this manually later)
UPDATE public.posts 
SET user_id = '00000000-0000-0000-0000-000000000000'
WHERE user_id IS NULL;

-- Make user_id NOT NULL after setting default values
ALTER TABLE public.posts 
ALTER COLUMN user_id SET NOT NULL;

-- Enable Row Level Security on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for posts table

-- Allow everyone to read posts (public social media platform)
CREATE POLICY "Posts are publicly readable" 
ON public.posts 
FOR SELECT 
USING (true);

-- Allow authenticated users to create posts with their own user_id
CREATE POLICY "Authenticated users can create posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
USING (auth.uid() = user_id);