alter table public.predictions
  add column if not exists payment_status text not null default 'PENDIENTE',
  add column if not exists payment_approved_at timestamptz,
  add column if not exists payment_approved_by uuid references public.users(id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'predictions_payment_status_check'
      and conrelid = 'public.predictions'::regclass
  ) then
    alter table public.predictions
      add constraint predictions_payment_status_check
      check (payment_status in ('PENDIENTE', 'APROBADO'));
  end if;
end $$;

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

  insert into public.rankings(user_id, full_name, total_points, exact_scores, winner_hits, matches_hit, position, updated_at)
  select
    ranked.user_id,
    ranked.full_name,
    ranked.total_points,
    ranked.exact_scores,
    ranked.winner_hits,
    ranked.matches_hit,
    ranked.position,
    now()
  from (
    select
      u.id as user_id,
      u.full_name,
      coalesce(sum(pd.points), 0)::int as total_points,
      count(*) filter (where pd.exact_score)::int as exact_scores,
      count(*) filter (where pd.winner_hit)::int as winner_hits,
      count(*) filter (where pd.exact_score or pd.winner_hit)::int as matches_hit,
      row_number() over (
        order by coalesce(sum(pd.points), 0) desc,
        count(*) filter (where pd.exact_score) desc,
        count(*) filter (where pd.exact_score or pd.winner_hit) desc,
        u.full_name asc
      )::int as position
    from public.users u
    join public.predictions p
      on p.user_id = u.id
      and p.status = 'CONFIRMADO'
      and p.payment_status = 'APROBADO'
    left join public.prediction_details pd on pd.prediction_id = p.id
    group by u.id, u.full_name
  ) ranked;
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
  order by p.confirmed_at desc;
$$;

grant execute on function public.admin_approve_payment(uuid) to authenticated;

select public.recalculate_rankings();
