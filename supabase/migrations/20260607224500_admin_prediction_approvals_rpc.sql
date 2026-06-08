create or replace function public.admin_get_prediction_approvals()
returns table (
  id uuid,
  user_id uuid,
  full_name text,
  email text,
  confirmed_at timestamptz,
  confirmation_code text,
  payment_status text,
  payment_approved_at timestamptz,
  prediction_slot int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.user_id,
    u.full_name,
    u.email,
    p.confirmed_at,
    p.confirmation_code,
    coalesce(p.payment_status, 'PENDIENTE') as payment_status,
    p.payment_approved_at,
    coalesce(p.prediction_slot, 1) as prediction_slot
  from public.predictions p
  join public.users u on u.id = p.user_id
  where public.is_admin()
    and p.status = 'CONFIRMADO'
  order by
    case when coalesce(p.payment_status, 'PENDIENTE') = 'PENDIENTE' then 0 else 1 end,
    p.confirmed_at desc,
    u.full_name asc,
    p.prediction_slot asc;
$$;

grant execute on function public.admin_get_prediction_approvals() to authenticated;
