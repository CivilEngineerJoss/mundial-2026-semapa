alter table public.users
  add column if not exists max_predictions int not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_max_predictions_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_max_predictions_check
      check (max_predictions between 1 and 20);
  end if;
end $$;

alter table public.predictions
  add column if not exists prediction_slot int not null default 1,
  add column if not exists payment_status text not null default 'PENDIENTE',
  add column if not exists payment_approved_at timestamptz,
  add column if not exists payment_approved_by uuid references public.users(id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'predictions_prediction_slot_check'
      and conrelid = 'public.predictions'::regclass
  ) then
    alter table public.predictions
      add constraint predictions_prediction_slot_check
      check (prediction_slot between 1 and 20);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'predictions_payment_status_check'
      and conrelid = 'public.predictions'::regclass
  ) then
    alter table public.predictions
      add constraint predictions_payment_status_check
      check (payment_status in ('PENDIENTE', 'APROBADO'));
  end if;
end $$;

alter table public.predictions
  drop constraint if exists predictions_user_id_key;

create unique index if not exists predictions_user_slot_uidx
  on public.predictions(user_id, prediction_slot);

create or replace function public.enforce_prediction_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed int;
  used_count int;
begin
  select coalesce(max_predictions, 1)
  into allowed
  from public.users
  where id = new.user_id;

  allowed := coalesce(allowed, 1);

  select count(*)
  into used_count
  from public.predictions
  where user_id = new.user_id;

  if not public.is_admin() then
    if used_count >= allowed then
      raise exception 'Este usuario ya uso todos sus cupos de pronostico';
    end if;

    if new.prediction_slot > allowed then
      raise exception 'El numero de pronostico supera los cupos habilitados';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_prediction_limit on public.predictions;
create trigger trg_enforce_prediction_limit
before insert on public.predictions
for each row execute function public.enforce_prediction_limit();

create or replace function public.admin_set_prediction_limit(p_user_id uuid, p_max_predictions int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_count int;
  next_limit int;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden habilitar cupos de pronosticos';
  end if;

  next_limit := greatest(1, least(coalesce(p_max_predictions, 1), 20));

  select count(*)
  into existing_count
  from public.predictions
  where user_id = p_user_id;

  if next_limit < existing_count then
    raise exception 'El cupo no puede ser menor a los pronosticos ya creados por el usuario';
  end if;

  update public.users
  set max_predictions = next_limit
  where id = p_user_id;

  perform public.log_audit(
    'ACTUALIZACION_CUPOS_PRONOSTICO',
    'users',
    p_user_id::text,
    jsonb_build_object('max_predictions', next_limit)
  );
end;
$$;

alter table public.rankings
  drop constraint if exists rankings_pkey;

alter table public.rankings
  add column if not exists prediction_id uuid references public.predictions(id) on delete cascade,
  add column if not exists prediction_slot int not null default 1;

delete from public.rankings where true;

alter table public.rankings
  alter column prediction_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'rankings_pkey'
      and conrelid = 'public.rankings'::regclass
  ) then
    alter table public.rankings
      add constraint rankings_pkey primary key (prediction_id);
  end if;
end $$;

create or replace function public.recalculate_rankings()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prediction_details pd
  set
    points = s.points,
    exact_score = s.exact_score,
    winner_hit = s.winner_hit,
    updated_at = now()
  from (
    select
      pd2.id,
      scored.points,
      scored.exact_score,
      scored.winner_hit
    from public.prediction_details pd2
    join public.results r on r.match_id = pd2.match_id
    cross join lateral public.score_prediction(pd2.predicted_goals_a, pd2.predicted_goals_b, r.goals_a, r.goals_b) scored
  ) s
  where s.id = pd.id;

  delete from public.rankings where true;

  insert into public.rankings(prediction_id, user_id, full_name, prediction_slot, total_points, exact_scores, winner_hits, matches_hit, position, updated_at)
  select
    ranked.prediction_id,
    ranked.user_id,
    ranked.full_name,
    ranked.prediction_slot,
    ranked.total_points,
    ranked.exact_scores,
    ranked.winner_hits,
    ranked.matches_hit,
    ranked.position,
    now()
  from (
    select
      p.id as prediction_id,
      u.id as user_id,
      u.full_name,
      p.prediction_slot,
      coalesce(sum(pd.points), 0)::int as total_points,
      count(*) filter (where pd.exact_score)::int as exact_scores,
      count(*) filter (where pd.winner_hit)::int as winner_hits,
      count(*) filter (where pd.exact_score or pd.winner_hit)::int as matches_hit,
      row_number() over (
        order by coalesce(sum(pd.points), 0) desc,
        count(*) filter (where pd.exact_score) desc,
        count(*) filter (where pd.exact_score or pd.winner_hit) desc,
        u.full_name asc,
        p.prediction_slot asc
      )::int as position
    from public.predictions p
    join public.users u on u.id = p.user_id
    left join public.prediction_details pd on pd.prediction_id = p.id
    where p.status = 'CONFIRMADO'
      and p.payment_status = 'APROBADO'
    group by p.id, u.id, u.full_name, p.prediction_slot
  ) ranked;
end;
$$;

create or replace function public.admin_approve_payment(p_prediction_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden aprobar pagos';
  end if;

  update public.predictions
  set
    payment_status = 'APROBADO',
    payment_approved_at = now(),
    payment_approved_by = auth.uid(),
    updated_at = now()
  where id = p_prediction_id
    and status = 'CONFIRMADO';

  if not found then
    raise exception 'No se encontro un pronostico confirmado para aprobar';
  end if;

  perform public.log_audit(
    'APROBACION_PAGO',
    'predictions',
    p_prediction_id::text,
    jsonb_build_object('payment_status', 'APROBADO')
  );

  perform public.recalculate_rankings();
end;
$$;

create or replace function public.get_confirmed_predictions_public()
returns table (
  prediction_id uuid,
  user_id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  confirmed_at timestamptz,
  confirmation_code text,
  validation_hash text,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as prediction_id,
    u.id as user_id,
    u.full_name,
    u.email,
    u.created_at,
    p.confirmed_at,
    p.confirmation_code,
    p.validation_hash,
    p.status::text as status
  from public.predictions p
  join public.users u on u.id = p.user_id
  where p.status = 'CONFIRMADO'
    and p.payment_status = 'APROBADO'
  order by p.confirmed_at desc, p.prediction_slot asc;
$$;

grant execute on function public.admin_set_prediction_limit(uuid, int) to authenticated;
grant execute on function public.admin_approve_payment(uuid) to authenticated;

select public.recalculate_rankings();
