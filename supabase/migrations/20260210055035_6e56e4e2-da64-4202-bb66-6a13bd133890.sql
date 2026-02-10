CREATE POLICY "Users can update their own cues"
  ON public.cues FOR UPDATE
  USING (auth.uid() = user_id);