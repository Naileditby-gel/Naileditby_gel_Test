# Mission 3 — Customer email notifications (TEST only)

## Confirmed EmailJS IDs
- Service: `service_7t0p3zw`
- Template: `template_2zazhvj`

## Supabase Edge Function secrets
In the TEST Supabase project, add these secrets under Edge Functions / Secrets:
- `EMAILJS_PUBLIC_KEY`: the public key shown in EmailJS Account.
- `NAILEDIT_TEST_SITE_URL`: `https://naileditby-gel.github.io/Naileditby_gel_Test`

The function checks the logged-in Supabase user with `public.is_nailedit_owner()` before it reads a booking or sends email. It uses the TEST project's built-in Supabase environment variables and does not expose the service-role key in browser code.

## EmailJS template variables
The saved template expects `email`, `customer_name`, `appointment_date`, `appointment_time`, `service_name`, `total_price`, `deposit_amount`, `remaining_balance`, `booking_status`, `owner_message`, and `booking_link`.

## Rollout rules
- TEST only; do not change the live repository or custom-domain/DNS/HTTPS settings.
- Keep email sending owner-triggered from the private dashboard.
- Do not merge to live until booking, email delivery, status updates, and access controls have been tested.
