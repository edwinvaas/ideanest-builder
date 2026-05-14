
-- Ensure search_path is set on all functions
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.user_box_id(uuid) SET search_path = public;
ALTER FUNCTION public.is_coach_of_box(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Revoke direct EXECUTE on internal SECURITY DEFINER helpers from API roles.
-- They are still callable from RLS policies and triggers (which run as the function owner).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_box_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_coach_of_box(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
