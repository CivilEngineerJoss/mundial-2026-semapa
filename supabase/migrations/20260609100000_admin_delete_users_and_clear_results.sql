alter table public.audit_logs
  drop constraint if exists audit_logs_user_id_fkey;

alter table public.audit_logs
  add constraint audit_logs_user_id_fkey
  foreign key (user_id)
  references public.users(id)
  on delete set null;

alter table public.results
  drop constraint if exists results_registered_by_fkey;

alter table public.results
  add constraint results_registered_by_fkey
  foreign key (registered_by)
  references public.users(id)
  on delete set null;

create or replace function public.recalculate_rankings()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prediction_details
  set
    points = 0,
    exact_score = false,
    winner_hit = false,
    updated_at = now()
  where true;

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
      scored_rows.*,
      dense_rank() over (order by scored_rows.total_points desc)::int as position
    from (
      select
        p.id as prediction_id,
        u.id as user_id,
        u.full_name,
        p.prediction_slot,
        coalesce(sum(pd.points), 0)::int as total_points,
        count(*) filter (where pd.exact_score)::int as exact_scores,
        count(*) filter (where pd.winner_hit)::int as winner_hits,
        count(*) filter (where pd.exact_score or pd.winner_hit)::int as matches_hit
      from public.predictions p
      join public.users u on u.id = p.user_id
      left join public.prediction_details pd on pd.prediction_id = p.id
      where p.status = 'CONFIRMADO'
        and p.payment_status = 'APROBADO'
      group by p.id, u.id, u.full_name, p.prediction_slot
    ) scored_rows
  ) ranked
  order by ranked.position asc, ranked.full_name asc, ranked.prediction_slot asc;
end;
$$;

create or replace function public.register_result(p_match_id bigint, p_goals_a int, p_goals_b int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;

  if p_goals_a is null and p_goals_b is null then
    delete from public.results
    where match_id = p_match_id;

    update public.matches
    set status = 'scheduled'
    where id = p_match_id;

    perform public.log_audit('ELIMINACION_RESULTADO', 'results', p_match_id::text, '{}'::jsonb);
    perform public.recalculate_rankings();
    return;
  end if;

  if p_goals_a is null or p_goals_b is null then
    raise exception 'Debe ingresar ambos goles o dejar ambos campos vacios para limpiar el resultado';
  end if;

  insert into public.results(match_id, goals_a, goals_b, registered_by)
  values (p_match_id, p_goals_a, p_goals_b, auth.uid())
  on conflict (match_id) do update
  set goals_a = excluded.goals_a,
      goals_b = excluded.goals_b,
      registered_by = auth.uid(),
      updated_at = now();

  update public.matches set status = 'played' where id = p_match_id;
  perform public.log_audit('REGISTRO_RESULTADO', 'results', p_match_id::text, jsonb_build_object('goals_a', p_goals_a, 'goals_b', p_goals_b));
  perform public.recalculate_rankings();
end;
$$;

create or replace function public.admin_delete_users(p_user_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_ids uuid[];
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden eliminar usuarios';
  end if;

  if p_user_ids is null or array_length(p_user_ids, 1) is null then
    raise exception 'Debe seleccionar al menos un usuario';
  end if;

  target_ids := array(
    select id
    from unnest(p_user_ids) as id
    where id <> auth.uid()
  );

  if array_length(target_ids, 1) is null then
    raise exception 'No se puede eliminar su propia cuenta administradora desde aqui';
  end if;

  perform public.log_audit(
    'ELIMINACION_USUARIOS',
    'users',
    array_to_string(target_ids, ','),
    jsonb_build_object('count', array_length(target_ids, 1))
  );

  update public.audit_logs
  set user_id = null
  where user_id = any(target_ids);

  update public.results
  set registered_by = null
  where registered_by = any(target_ids);

  delete from auth.users au
  where au.id = any(target_ids);

  delete from public.users u
  where u.id = any(target_ids);

  perform public.recalculate_rankings();
end;
$$;

grant execute on function public.admin_delete_users(uuid[]) to authenticated;
grant execute on function public.register_result(bigint, int, int) to authenticated;

select public.recalculate_rankings();
