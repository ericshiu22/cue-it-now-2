
CREATE TABLE public.cues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  service_provider TEXT NOT NULL,
  deep_link TEXT,
  vote_average NUMERIC,
  release_year TEXT,
  overview TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cues"
  ON public.cues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cues"
  ON public.cues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cues"
  ON public.cues FOR DELETE
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_cues_user_tmdb ON public.cues (user_id, tmdb_id, service_provider);
