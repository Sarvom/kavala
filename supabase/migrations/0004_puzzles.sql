-- Daily puzzles replace Spot (25 October 2026).
-- Spot needed live OpenStreetMap place searches that public servers often
-- refused from the hosting provider, so the daily now uses three logic
-- puzzles generated on the phone from the date. Only today's points are
-- stored; the boards never leave the phone. Spot columns stay so older days
-- keep their results.

alter table daily_plays
  add column if not exists puzzle_points integer check (puzzle_points between 0 and 1000);

create or replace function my_neighbourhood_board(p_day date)
returns table (mask_name text, mask_color text, mask_style text, points integer, done boolean, is_me boolean)
language sql security definer stable set search_path = public as $$
  select u.mask_name, u.mask_color, u.mask_style, coalesce(p.puzzle_points, p.spot_points), p.done, (u.auth_user_id = auth.uid()) as is_me
  from users u
  join daily_plays p on p.user_id = u.id and p.day = p_day
  where u.neighbourhood_id is not null
    and u.neighbourhood_id = (select neighbourhood_id from users where auth_user_id = auth.uid())
    and coalesce(p.puzzle_points, p.spot_points) is not null
  order by coalesce(p.puzzle_points, p.spot_points) desc, u.mask_name
  limit 50;
$$;
revoke all on function my_neighbourhood_board(date) from public;
grant execute on function my_neighbourhood_board(date) to authenticated;

create or replace function my_neighbourhood_stats(p_day date)
returns table (neighbourhood_id text, members integer, played_today integer)
language sql security definer stable set search_path = public as $$
  with me as (select neighbourhood_id from users where auth_user_id = auth.uid())
  select me.neighbourhood_id,
         (select count(*)::integer from users u where u.neighbourhood_id = me.neighbourhood_id and not u.is_synthetic),
         (select count(*)::integer from users u join daily_plays p on p.user_id = u.id
            where u.neighbourhood_id = me.neighbourhood_id and p.day = p_day
              and (p.done or p.puzzle_points is not null or p.spot_points is not null or p.spot_skipped or p.help is not null or p.step is not null))
  from me
  where me.neighbourhood_id is not null;
$$;
revoke all on function my_neighbourhood_stats(date) from public;
grant execute on function my_neighbourhood_stats(date) to authenticated;
