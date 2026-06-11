insert into public.settings(key, value)
values ('deadline_iso', '2026-06-11T15:00:00-04:00')
on conflict (key) do update
set value = excluded.value,
    updated_at = now();
