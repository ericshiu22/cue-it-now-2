
CREATE OR REPLACE FUNCTION public.get_friends_cues(_user_id uuid)
 RETURNS TABLE(tmdb_id integer, title text, poster_path text, media_type text, release_year text, vote_average numeric, overview text, service_provider text, deep_link text, friend_username text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT DISTINCT ON (c.tmdb_id)
      c.tmdb_id,
      c.title,
      c.poster_path,
      c.media_type,
      c.release_year,
      c.vote_average,
      c.overview,
      c.service_provider,
      c.deep_link,
      p.username as friend_username
    FROM public.cues c
    INNER JOIN public.friendships f
      ON (
        (f.user_id = _user_id AND f.friend_id = c.user_id)
        OR (f.friend_id = _user_id AND f.user_id = c.user_id)
      )
    INNER JOIN public.profiles p ON p.user_id = c.user_id
    WHERE f.status = 'accepted'
      AND c.user_id != _user_id
      AND c.poster_path IS NOT NULL
    ORDER BY c.tmdb_id, c.created_at DESC
    LIMIT 20;
END;
$function$;
