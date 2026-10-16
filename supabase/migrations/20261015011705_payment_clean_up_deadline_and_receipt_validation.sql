-- Payment Clean Up: keep expiry messages aligned with the configured 30-minute window
-- and enforce the receipt requirement at the database RPC boundary.
-- This migration does not alter existing booking records.

create or replace function public.expire_unpaid_booking_requests()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  affected integer;
begin
  update public.bookings
  set status = 'expired',
      expired_at = now(),
      status_reason = 'Payment details were not submitted within the 30-minute deadline.',
      customer_message = 'Your request expired because payment details were not submitted within the 30-minute deadline. Please submit a new booking request if you would still like an appointment.'
  where status = 'pending'
    and payment_deadline is not null
    and payment_deadline <= now()
    and payment_submitted_at is null;

  get diagnostics affected = row_count;
  return affected;
end;
$function$;

create or replace function public.submit_booking_payment_details(
  p_token uuid,
  p_method text,
  p_reference text,
  p_proof_path text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  b public.bookings%rowtype;
begin
  perform public.expire_unpaid_booking_requests();

  if p_method is null or p_method not in ('GCash', 'Bank transfer') then
    raise exception 'Choose GCash or Bank transfer.';
  end if;

  if p_reference is null
     or length(trim(p_reference)) < 3
     or length(trim(p_reference)) > 120 then
    raise exception 'Enter a valid payment reference.';
  end if;

  if p_proof_path is null or length(trim(p_proof_path)) = 0 then
    raise exception 'Please upload your payment receipt screenshot.';
  end if;

  select *
  into b
  from public.bookings
  where access_token = p_token
  for update;

  if not found then
    raise exception 'Booking status link not found.';
  end if;

  if b.status <> 'pending'
     or b.deposit_amount is null
     or b.payment_deadline is null then
    raise exception 'This request is not awaiting payment.';
  end if;

  if b.payment_deadline <= now() then
    raise exception 'The payment deadline has passed. This request has expired.';
  end if;

  if b.payment_submitted_at is not null then
    raise exception 'Payment details have already been submitted. Gel will verify them.';
  end if;

  if p_proof_path not like b.id::text || '/%'
     or not exists (
       select 1
       from storage.objects so
       where so.bucket_id = 'booking-payment-proof'
         and so.name = p_proof_path
     ) then
    raise exception 'The uploaded proof file is not valid for this booking.';
  end if;

  update public.bookings
  set payment_method = p_method,
      payment_reference = trim(p_reference),
      payment_proof_path = p_proof_path,
      payment_submitted_at = now(),
      customer_message = 'Your payment details and receipt were submitted before the deadline. Your slot is reserved while Gel manually verifies the payment.'
  where id = b.id;

  return true;
end;
$function$;
