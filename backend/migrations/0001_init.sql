-- 0001_init.sql
-- Initial schema draft for Field People MVP

create extension if not exists pgcrypto;

create table if not exists people (
  person_id uuid primary key default gen_random_uuid(),
  name text not null,
  display_name text,
  email text not null unique,
  type text not null check (type in ('employee','contractor','partner')),
  role text not null check (role in ('admin','backoffice','member','talent')),
  skills jsonb not null default '[]'::jsonb,
  availability jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contracts (
  contract_id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(person_id) on delete cascade,
  contract_type text not null,
  rate numeric(12,2) not null,
  currency text not null,
  start_date date not null,
  end_date date not null,
  payment_terms text,
  document_url text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  project_id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active',
  start_date date,
  end_date date,
  pm_person_id uuid references people(person_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invoices (
  invoice_id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(person_id) on delete cascade,
  period text not null,
  amount numeric(12,2) not null,
  currency text not null,
  status text not null check (status in ('draft','submitted','approved','paid')),
  file_url text,
  submitted_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists timesheets (
  timesheet_id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(person_id) on delete cascade,
  project_id uuid not null references projects(project_id) on delete cascade,
  work_date date not null,
  hours numeric(5,2) not null,
  notes text,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  task_id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee_person_id uuid references people(person_id),
  project_id uuid not null references projects(project_id) on delete cascade,
  due_date date,
  status text not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rooms (
  room_id text primary key,
  type text not null check (type in ('person_room','project_room','community_room')),
  related_person_id uuid references people(person_id),
  related_project_id uuid references projects(project_id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  audit_id uuid primary key default gen_random_uuid(),
  actor_user_id text not null,
  actor_role text,
  action text not null,
  target_type text not null,
  target_id text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_people_role on people(role);
create index if not exists idx_people_type on people(type);
create index if not exists idx_contracts_person on contracts(person_id);
create index if not exists idx_contracts_end_date on contracts(end_date);
create index if not exists idx_invoices_person_status on invoices(person_id, status);
create index if not exists idx_tasks_project_due on tasks(project_id, due_date);
create index if not exists idx_audit_target on audit_logs(target_type, target_id);
