
-- Friend groups table
CREATE TABLE public.friend_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Many-to-many: friends can belong to multiple groups
CREATE TABLE public.friend_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.friend_groups(id) ON DELETE CASCADE,
  friend_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, friend_user_id)
);

-- RLS for friend_groups
ALTER TABLE public.friend_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own groups" ON public.friend_groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own groups" ON public.friend_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups" ON public.friend_groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups" ON public.friend_groups
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for friend_group_members
ALTER TABLE public.friend_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their group members" ON public.friend_group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.friend_groups fg WHERE fg.id = group_id AND fg.user_id = auth.uid())
  );

CREATE POLICY "Users can insert into their groups" ON public.friend_group_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.friend_groups fg WHERE fg.id = group_id AND fg.user_id = auth.uid())
  );

CREATE POLICY "Users can delete from their groups" ON public.friend_group_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.friend_groups fg WHERE fg.id = group_id AND fg.user_id = auth.uid())
  );
