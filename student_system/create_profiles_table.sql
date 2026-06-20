-- Run this entire script in:
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- URL: https://supabase.com/dashboard/project/mmzshrvagdatbbmqjwis/sql/new

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           text,
  email               text,
  mobile_number       text,
  date_of_birth       date,
  gender              text,
  education_level     text,
  school_college_name text,
  current_year_class  text,
  state               text,
  city                text,
  career_interests    text[],
  resume_url          text,
  created_at          timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies (allow users to manage only their own profile)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
