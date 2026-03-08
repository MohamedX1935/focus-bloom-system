
CREATE TABLE public.daily_calories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.daily_calories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily_calories"
  ON public.daily_calories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
