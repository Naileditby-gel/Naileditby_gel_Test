alter table public.bookings add column if not exists customer_email text;
comment on column public.bookings.customer_email is 'Customer email address for owner-triggered booking notifications; nullable for legacy bookings.';
