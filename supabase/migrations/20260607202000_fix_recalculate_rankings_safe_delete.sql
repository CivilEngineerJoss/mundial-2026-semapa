-- Corrige la funcion de recalculo para bases con proteccion contra DELETE sin WHERE.

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
    join public.predictions p on p.user_id = u.id and p.status = 'CONFIRMADO'
    left join public.prediction_details pd on pd.prediction_id = p.id
    group by u.id, u.full_name
  ) ranked;
end;
$$;
