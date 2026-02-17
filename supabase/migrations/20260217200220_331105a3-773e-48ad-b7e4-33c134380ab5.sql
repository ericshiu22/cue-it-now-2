
-- Security definer function to compare cues between two users who are accepted friends
CREATE OR REPLACE FUNCTION public.get_shared_cues(_user_id uuid, _friend_id uuid)
RETURNS TABLE (
  tmdb_id integer,
  title text,
  poster_path text,
  media_type text,
  release_year text,
  vote_average numeric,
  overview text,
  service_provider text,
  deep_link text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify they are accepted friends
  IF NOT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND (
        (user_id = _user_id AND friend_id = _friend_id)
        OR (user_id = _friend_id AND friend_id = _user_id)
      )
  ) THEN
    RETURN;
  END IF;

  -- Return friend's cues that match the user's cues by tmdb_id
  RETURN QUERY
    SELECT
      fc.tmdb_id,
      fc.title,
      fc.poster_path,
      fc.media_type,
      fc.release_year,
      fc.vote_average,
      fc.overview,
      fc.service_provider,
      fc.deep_link
    FROM public.cues fc
    INNER JOIN public.cues mc ON mc.tmdb_id = fc.tmdb_id AND mc.user_id = _user_id
    WHERE fc.user_id = _friend_id;
END;
$$;
