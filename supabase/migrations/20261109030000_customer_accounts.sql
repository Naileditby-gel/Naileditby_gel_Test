-- Customer accounts: link verified Supabase Auth users to their existing booking records.
-- This migration deliberately leaves guest booking submission and payment RPCs unchanged.

alter table public.bookings
  add column if not exists customer_user_id uuid
  references auth.users(id) on delete set null;

create index if not exists bookings_customer_user_id_created_at_idx
  on public.bookings (customer_user_id, created_at desc)
  where customer_user_id is not null;

create or replace function public.link_my_bookings_by_email()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_linked integer;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first.';
  end if;

  select pg_catalog.lower(pg_catalog.btrim(u.email))
    into v_email
  from auth.users as u
  where u.id = auth.uid()
    and u.email_confirmed_at is not null;

  if v_email is null or v_email = '' then
    raise exception 'Please verify your email address before linking bookings.';
  end if;

  update public.bookings as b
     set customer_user_id = auth.uid()
   where pg_catalog.lower(pg_catalog.btrim(b.customer_email)) = v_email
     and (b.customer_user_id is null or b.customer_user_id = auth.uid());

  get diagnostics v_linked = row_count;
  return v_linked;
end;
$$;

create or replace function public.get_my_customer_bookings()
returns table (
  id uuid,
  appointment_date date,
  appointment_time time,
  service text,
  status text,
  deposit_status text,
  total_design_price numeric,
  deposit_amount numeric,
  payment_deadline timestamptz,
  payment_submitted_at timestamptz,
  status_reason text,
  customer_message text,
  created_at timestamptz,
  updated_at timestamptz,
  access_token uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.appointment_date, b.appointment_time, b.service, b.status,
         b.deposit_status, b.total_design_price, b.deposit_amount,
         b.payment_deadline, b.payment_submitted_at, b.status_reason,
         b.customer_message, b.created_at, b.updated_at, b.access_token
  from public.bookings as b
  where auth.uid() is not null
    and b.customer_user_id = auth.uid()
  order by b.appointment_date desc, b.appointment_time desc, b.created_at desc;
$$;

revoke all on function public.link_my_bookings_by_email() from public, anon;
grant execute on function public.link_my_bookings_by_email() to authenticated;

revoke all on function public.get_my_customer_bookings() from public, anon;
grant execute on function public.get_my_customer_bookings() to authenticated;
