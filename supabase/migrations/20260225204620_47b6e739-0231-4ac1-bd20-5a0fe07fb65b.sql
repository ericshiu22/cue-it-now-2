
CREATE OR REPLACE FUNCTION public.get_friend_all_cues(_user_id uuid, _friend_id uuid)
RETURNS TABLE(tmdb_id integer, title text, poster_path text, media_type text, release_year text, vote_average numeric, overview text, service_provider text, deep_link text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Return ALL of the friend's cues
  RETURN QUERY
    SELECT
      c.tmdb_id,
      c.title,
      c.poster_path,
      c.media_type,
      c.release_year,
      c.vote_average,
      c.overview,
      c.service_provider,
      c.deep_link
    FROM public.cues c
    WHERE c.user_id = _friend_id
    ORDER BY c.created_at DESC;
END;
$$;
