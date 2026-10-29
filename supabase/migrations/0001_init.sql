create extension if not exists pgcrypto;

-- ============ TABLES ============

create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  patient jsonb not null,
  drug text not null,
  dose_value numeric not null check (dose_value > 0),
  dose_unit text not null check (dose_unit in ('mcg','mg','g','units')),
  dose_text_raw text not null,
  frequency_per_day numeric check (frequency_per_day is null or frequency_per_day > 0),
  frequency_text text not null,
  concentration text,
  route text,
  note text not null check (char_length(note) <= 2000),
  status text not null default 'pending'
    check (status in ('pending','flagged','released')),
  released_by text,
  released_at timestamptz,
  gemma_meta jsonb
);

create table findings (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  created_at timestamptz not null default now(),
  source text not null check (source in ('code','gemma')),
  code text not null,
  severity text not null check (severity in ('high','medium','low')),
  title text not null,
  evidence text not null,
  explanation_en text not null,
  explanation_ur text,
  field_involved text,
  decision text check (decision in ('accepted','corrected','escalated')),
  reason text,
  resolved_by text,
  resolved_at timestamptz,
  -- Gemma findings must carry an Urdu explanation
  constraint gemma_needs_urdu check (source = 'code' or explanation_ur is not null),
  -- A resolution is all-or-nothing, and the reason must be meaningful
  constraint resolution_complete check (
    (decision is null and reason is null and resolved_by is null and resolved_at is null)
    or
    (decision is not null and char_length(reason) >= 5
       and resolved_by is not null and resolved_at is not null)
  )
);

create table audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  is_demo boolean not null default false,
  by_name text not null,
  prescription_id uuid not null,   -- intentionally NOT a foreign key, so history outlives deletes
  finding_id uuid,
  source text,
  action text not null,
  decision text,
  reason text
);

create index on findings (prescription_id);
create index on audit_log (prescription_id, at desc);
create index on prescriptions (status, created_at desc);

-- ============ ROW LEVEL SECURITY ============
-- Enabled with NO policies: anon/authenticated keys can access nothing.
-- The service role key (server only) bypasses RLS.

alter table prescriptions enable row level security;
alter table findings      enable row level security;
alter table audit_log     enable row level security;

-- ============ AUDIT LOG IS APPEND-ONLY ============

create or replace function audit_log_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'audit_log is append-only';
  end if;
  -- Deletes are allowed only for demo rows (used by "Load demo cases")
  if tg_op = 'DELETE' and old.is_demo then
    return old;
  end if;
  raise exception 'audit_log is append-only';
end $$;

create trigger audit_log_no_update before update on audit_log
  for each row execute function audit_log_guard();
create trigger audit_log_no_delete before delete on audit_log
  for each row execute function audit_log_guard();

-- ============ FUNCTIONS (all writes go through these) ============

-- Save the result of a check run (replaces findings, sets status).
-- p_findings: JSON array of objects with keys
-- source, code, severity, title, evidence, explanation_en, explanation_ur, field_involved
create or replace function save_check_result(
  p_id uuid, p_findings jsonb, p_gemma_meta jsonb, p_by text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_status text;
  v_count int;
  v_demo boolean;
begin
  select status, is_demo into v_status, v_demo
    from prescriptions where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_status = 'released' then raise exception 'ALREADY_RELEASED'; end if;

  delete from findings where prescription_id = p_id;

  insert into findings (prescription_id, source, code, severity, title,
                        evidence, explanation_en, explanation_ur, field_involved)
  select p_id, f->>'source', f->>'code', f->>'severity', f->>'title',
         f->>'evidence', f->>'explanation_en', f->>'explanation_ur', f->>'field_involved'
  from jsonb_array_elements(p_findings) f;

  v_count := jsonb_array_length(p_findings);

  update prescriptions
     set gemma_meta = p_gemma_meta,
         status = case when v_count > 0 then 'flagged' else 'pending' end,
         updated_at = now()
   where id = p_id;

  insert into audit_log (by_name, prescription_id, action, reason, is_demo)
  values (p_by, p_id, 'check_run', v_count || ' findings', v_demo);
end $$;

-- Record a pharmacist decision on one finding
create or replace function resolve_finding(
  p_finding_id uuid, p_decision text, p_reason text, p_by text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_pid uuid;
  v_status text;
  v_source text;
  v_demo boolean;
begin
  select f.prescription_id, p.status, f.source, p.is_demo
    into v_pid, v_status, v_source, v_demo
    from findings f join prescriptions p on p.id = f.prescription_id
   where f.id = p_finding_id
   for update of f;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_status = 'released' then raise exception 'ALREADY_RELEASED'; end if;

  update findings
     set decision = p_decision, reason = p_reason,
         resolved_by = p_by, resolved_at = now()
   where id = p_finding_id;

  insert into audit_log (by_name, prescription_id, finding_id, source, action, decision, reason, is_demo)
  values (p_by, v_pid, p_finding_id, v_source, 'resolve', p_decision, p_reason, v_demo);
end $$;

-- Release: the database itself refuses if anything is unresolved
create or replace function release_prescription(p_id uuid, p_by text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_status text;
  v_open int;
  v_demo boolean;
begin
  select status, is_demo into v_status, v_demo
    from prescriptions where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_status = 'released' then raise exception 'ALREADY_RELEASED'; end if;

  select count(*) into v_open from findings
   where prescription_id = p_id and decision is null;
  if v_open > 0 then raise exception 'UNRESOLVED_FINDINGS'; end if;

  update prescriptions
     set status = 'released', released_by = p_by, released_at = now(), updated_at = now()
   where id = p_id;

  insert into audit_log (by_name, prescription_id, action, is_demo)
  values (p_by, p_id, 'release', v_demo);
end $$;

-- Lock the functions down: only the service role may call them
revoke all on function save_check_result(uuid, jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function resolve_finding(uuid, text, text, text)     from public, anon, authenticated;
revoke all on function release_prescription(uuid, text)            from public, anon, authenticated;
