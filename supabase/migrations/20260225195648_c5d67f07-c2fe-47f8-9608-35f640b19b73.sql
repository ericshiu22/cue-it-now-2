-- Make user search resilient when profile rows are missing
CREATE OR REPLACE FUNCTION public.search_users(_query text, _current_user_id uuid)
RETURNS TABLE(user_id uuid, username text, avatar_url text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT
      u.id AS user_id,
      p.username,
      p.avatar_url,
      u.email::text AS email
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE u.id != _current_user_id
      AND (
        COALESCE(p.username, '') ILIKE '%' || _query || '%'
        OR u.email ILIKE '%' || _query || '%'
      )
    LIMIT 10;
END;
$function$;

-- Fetch profile-like data for a list of user ids, even if profile rows are missing
CREATE OR REPLACE FUNCTION public.get_users_public_data(_user_ids uuid[])
RETURNS TABLE(user_id uuid, username text, avatar_url text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT
      u.id AS user_id,
      p.username,
      p.avatar_url,
      u.email::text AS email
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE u.id = ANY(_user_ids);
END;
$function$;