create or replace function public.admin_upsert_setting(p_key text, p_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden modificar la configuracion';
  end if;

  insert into public.settings(key, value)
  values (p_key, p_value)
  on conflict (key) do update
  set value = excluded.value,
      updated_at = now();
end;
$$;

grant execute on function public.admin_upsert_setting(text, text) to authenticated;

select public.admin_upsert_setting('deadline_iso', '2026-06-11T15:00:00-04:00');
