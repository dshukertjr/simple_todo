# Simple Todo

Simple todo list app using Next.js and Supabase.

## Table schema

```sql
-- Create messages table
create table if not exists public.tasks (
    id uuid not null primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id),
    content text not null,
    is_done boolean not null default false,
    image_url text,
    created_at timestamp with time zone default timezone('utc' :: text, now()) not null
);

-- Set row level security
alter table public.tasks enable row level security;
create policy "Users can view their tasks" on public.tasks for select using (auth.uid = user_id);
create policy "Users can create new tasks" on public.tasks for insert with check (auth.uid = user_id);
create policy "Users can update their tasks" on public.tasks for insert with check (auth.uid = user_id) using (auth.uid = user_id);
create policy "Users can delete their tasks" on public.tasks for insert using (auth.uid = user_id);

-- Enable relatime
alter publication supabase_realtime add table public.tasks;
```