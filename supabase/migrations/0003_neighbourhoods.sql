-- Real neighbourhoods (Phase 1, item 3).
-- The server assigns each joined person to a neighbourhood and a nightly
-- rebalance resizes them by people, not kilometres. These two functions are
-- the only way a phone reads about its neighbours: masks and today's points,
-- never names, emails, home cells or auth IDs, and only for the caller's own
-- neighbourhood.

create or replace function my_neighbourhood_board(p_day date)
returns table (mask_name text, mask_color text, mask_style text, points integer, done boolean, is_me boolean)
language sql security definer stable set search_path = public as $$
  select u.mask_name, u.mask_color, u.mask_style, p.spot_points, p.done, (u.auth_user_id = auth.uid()) as is_me
  from users u
  join daily_plays p on p.user_id = u.id and p.day = p_day
  where u.neighbourhood_id is not null
    and u.neighbourhood_id = (select neighbourhood_id from users where auth_user_id = auth.uid())
    and p.spot_points is not null
  order by p.spot_points desc, u.mask_name
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
              and (p.done or p.spot_points is not null or p.spot_skipped or p.help is not null or p.step is not null))
  from me
  where me.neighbourhood_id is not null;
$$;
revoke all on function my_neighbourhood_stats(date) from public;
grant execute on function my_neighbourhood_stats(date) to authenticated;

create index if not exists users_neighbourhood on users (neighbourhood_id);
