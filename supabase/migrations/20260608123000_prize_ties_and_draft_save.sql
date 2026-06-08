insert into public.settings(key, value)
values ('prizes_text', 'Primer lugar\nSegundo lugar\nTercer lugar')
on conflict (key) do update
set value = case
  when public.settings.value like '1% Lugar%2% Lugar%3% Lugar' then excluded.value
  else public.settings.value
end,
updated_at = now();

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

select public.recalculate_rankings();
