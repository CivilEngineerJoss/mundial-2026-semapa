create or replace function public.confirm_prediction(p_prediction_id uuid, p_user_agent text, p_validation_hash text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  total_matches int;
  total_details int;
  next_code text;
  headers jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
begin
  select user_id into owner_id from public.predictions where id = p_prediction_id;
  if owner_id is null or owner_id <> auth.uid() then
    raise exception 'Pronostico no autorizado';
  end if;

  if now() >= (select value::timestamptz from public.settings where key = 'deadline_iso')
     and not public.is_admin() then
    raise exception 'La fecha limite ya vencio';
  end if;

  select count(*) into total_matches from public.matches;
  select count(*) into total_details
  from public.prediction_details
  where prediction_id = p_prediction_id
    and predicted_goals_a is not null
    and predicted_goals_b is not null;
  if total_details <> total_matches then
    raise exception 'Debe completar todos los partidos antes de confirmar';
  end if;

  next_code := 'SEMAPA-2026-' || lpad(nextval('public.confirmation_code_seq')::text, 6, '0');

  update public.predictions
  set status = 'CONFIRMADO',
      confirmed_at = now(),
      confirmation_code = next_code,
      ip_address = nullif(split_part(coalesce(headers->>'x-forwarded-for', ''), ',', 1), '')::inet,
      user_agent = p_user_agent,
      validation_hash = p_validation_hash,
      updated_at = now()
  where id = p_prediction_id and status = 'BORRADOR';

  perform public.log_audit('CONFIRMACION_DEFINITIVA', 'predictions', p_prediction_id::text, jsonb_build_object('code', next_code));
  perform public.recalculate_rankings();
  return next_code;
end;
$$;
