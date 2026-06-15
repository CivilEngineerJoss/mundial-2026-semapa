update public.matches
set
  team_a = case match_number
    when 11 then 'Paises Bajos'
    when 12 then 'Suecia'
    when 35 then 'Paises Bajos'
    when 36 then 'Tunez'
    when 57 then 'Japon'
    when 58 then 'Tunez'
    else team_a
  end,
  team_b = case match_number
    when 11 then 'Japon'
    when 12 then 'Tunez'
    when 35 then 'Suecia'
    when 36 then 'Japon'
    when 57 then 'Suecia'
    when 58 then 'Paises Bajos'
    else team_b
  end
where match_number in (11, 12, 35, 36, 57, 58);
