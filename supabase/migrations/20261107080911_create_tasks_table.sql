/*
# Create tasks table (multi-user, owner-scoped)

1. New Tables
- `tasks`
  - `id` (uuid, primary key, auto-generated)
  - `title` (text, NOT NULL, 1-200 chars)
  - `description` (text, nullable)
  - `status` (text, NOT NULL, default 'todo' — 'todo', 'in_progress', 'done')
  - `priority` (text, NOT NULL, default 'medium' — 'low', 'medium', 'high')
  - `user_id` (uuid, NOT NULL, defaults to auth.uid(), FK to auth.users ON DELETE CASCADE)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
2. Indexes
- `tasks_user_id_idx` on `user_id`
- `tasks_created_at_idx` on `created_at DESC`
3. Security
- RLS ENABLED on `tasks`.
- GRANT SELECT, INSERT, UPDATE, DELETE to `authenticated` only.
- Four owner-scoped policies (select/insert/update/delete) using auth.uid() = user_id.
- `user_id` defaults to auth.uid() so client inserts that omit it still pass the WITH CHECK.
4. Notes
- Idempotent: uses IF NOT EXISTS and drops policies before recreating.
- No anon grants: app requires sign-in.
- Email confirmation stays OFF.
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
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
