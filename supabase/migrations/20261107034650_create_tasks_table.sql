/*
# Create tasks table (multi-user, owner-scoped)

## Overview
Adds the core data table for the task manager app. Each task belongs to the
authenticated user who created it, and only that user can read, create, edit,
or delete their own tasks.

## New Tables
- `tasks`
  - `id` (uuid, primary key, auto-generated)
  - `title` (text, NOT NULL) - short title of the task
  - `description` (text, nullable) - optional longer description
  - `status` (text, NOT NULL, default 'todo') - one of 'todo', 'in_progress', 'done'
  - `priority` (text, NOT NULL, default 'medium') - one of 'low', 'medium', 'high'
  - `user_id` (uuid, NOT NULL, defaults to the authenticated user via auth.uid())
    - foreign key to auth.users(id) ON DELETE CASCADE so deleting a user removes their tasks
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now()) - tracks last modification

## Indexes
- `tasks_user_id_idx` on `user_id` for fast per-user queries
- `tasks_created_at_idx` on `created_at DESC` for chronological ordering

## Security
- Row Level Security ENABLED on `tasks`.
- GRANT SELECT, INSERT, UPDATE, DELETE to `authenticated` only (app requires sign-in).
- Four separate owner-scoped policies (select/insert/update/delete) using auth.uid() = user_id.
- The `user_id` column defaults to auth.uid(), so client inserts that omit user_id
  still satisfy the INSERT policy's WITH CHECK.

## Important Notes
1. No `anon` role grants or policies: the app requires sign-in, so every request
   runs as `authenticated`. An unauthenticated request gets no rows.
2. Email confirmation stays OFF (default) so new signups can log in immediately.
3. The migration is idempotent: uses IF NOT EXISTS for the table/indexes and
   drops policies before recreating them.
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at DESC);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
