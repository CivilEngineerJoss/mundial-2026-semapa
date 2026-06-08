create or replace function public.admin_reset_predictions(p_user_ids uuid[] default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden reiniciar predicciones';
  end if;

  delete from public.predictions p
  where p_user_ids is null or p.user_id = any(p_user_ids);

  perform public.log_audit(
    'REINICIO_PREDICCIONES',
    'predictions',
    coalesce(array_to_string(p_user_ids, ','), 'ALL'),
    jsonb_build_object('scope', case when p_user_ids is null then 'all' else 'selected' end)
  );

  perform public.recalculate_rankings();
end;
$$;

create or replace function public.admin_delete_users(p_user_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden eliminar usuarios';
  end if;

  if p_user_ids is null or array_length(p_user_ids, 1) is null then
    raise exception 'Debe seleccionar al menos un usuario';
  end if;

  perform public.log_audit(
    'ELIMINACION_USUARIOS',
    'users',
    array_to_string(p_user_ids, ','),
    jsonb_build_object('count', array_length(p_user_ids, 1))
  );

  delete from auth.users au
  where au.id = any(p_user_ids)
    and au.id <> auth.uid();

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
  order by p.confirmed_at desc;
$$;

create or replace function public.get_confirmed_prediction_details_public(p_prediction_id uuid)
returns table (
  match_id bigint,
  predicted_goals_a int,
  predicted_goals_b int,
  points int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pd.match_id,
    pd.predicted_goals_a,
    pd.predicted_goals_b,
    pd.points
  from public.prediction_details pd
  join public.predictions p on p.id = pd.prediction_id
  where p.id = p_prediction_id
    and p.status = 'CONFIRMADO'
  order by pd.match_id;
$$;

grant execute on function public.admin_reset_predictions(uuid[]) to authenticated;
grant execute on function public.admin_delete_users(uuid[]) to authenticated;
grant execute on function public.get_confirmed_predictions_public() to anon, authenticated;
grant execute on function public.get_confirmed_prediction_details_public(uuid) to anon, authenticated;
