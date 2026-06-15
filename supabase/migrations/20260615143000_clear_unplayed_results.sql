delete from public.results r
using public.matches m
where m.id = r.match_id
  and m.match_number >= 13;

update public.matches
set status = 'scheduled'
where match_number >= 13;

select public.recalculate_rankings();
