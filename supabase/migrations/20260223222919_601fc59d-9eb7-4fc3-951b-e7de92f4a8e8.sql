
CREATE OR REPLACE FUNCTION public.search_users(_query text, _current_user_id uuid)
RETURNS TABLE(user_id uuid, username text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT p.user_id, p.username, p.avatar_url
    FROM public.profiles p
    INNER JOIN auth.users u ON u.id = p.user_id
    WHERE p.user_id != _current_user_id
      AND (
        p.username ILIKE '%' || _query || '%'
        OR u.email ILIKE '%' || _query || '%'
      )
    LIMIT 10;
END;
$$;
