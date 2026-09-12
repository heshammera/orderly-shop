# Merchant account verification

Deployed 2026-09-12. All current and new merchant accounts must verify one contact channel before accessing merchant dashboards and APIs.

- Proofs are stored separately from Supabase automatic email confirmation. There is no legacy verified backfill.
- Email is delivered through the authenticated n8n `orderlyAuthEmail` workflow and the existing Gmail SMTP credential. Execution payloads are not retained by that workflow.
- WhatsApp delivery remains disabled until a real provider is connected. Do not enable it or report it working before testing actual delivery.
- Codes are six random digits, HMAC hashed, expire after 10 minutes, allow five guesses, and are single use. Resends require 60 seconds; maximum five challenges per hour per account.
- Changing the verified contact invalidates that channel's proof. Email OR phone verification is sufficient.
- Admin Users displays independent activation status. It does not alter suspension/ban status.

## Server configuration

Keep these in `/opt/orderly-shop/app.env`, never in client variables or Git:

- `MERCHANT_VERIFICATION_REQUIRED=true`
- `MERCHANT_OTP_SECRET`: generated random HMAC key
- `AUTH_DELIVERY_ENABLED=true`
- Existing `N8N_AUTH_WEBHOOK_URL` and `N8N_AUTH_WEBHOOK_TOKEN`
- `WHATSAPP_VERIFICATION_ENABLED=false`
- Future `N8N_WHATSAPP_WEBHOOK_URL` only after provider setup

The future WhatsApp webhook receives an authenticated POST with `kind`, `to`, `code`, and `expiresIn` (minutes), using `X-Orderly-Token`. The provider adapter must report delivery failure honestly; do not use a placeholder success response. Normalize destination phones to international format. Actual provider onboarding and messaging templates remain outstanding.

## Database enforcement

Apply migrations `20260912010000_merchant_verification.sql` and `20260912020000_enforce_merchant_verification.sql`. The latter configures PostgREST's `db-pre-request` function on the authenticator role and reloads configuration. It blocks unverified authenticated REST/business RPC access while allowing verification status, profiles/user_roles needed for account context, anonymous traffic, and service-role operations. It is not a replacement for RLS or other authorization checks.

Middleware also guards merchant pages and merchant APIs. Public storefront and checkout services remain available to anonymous visitors. Storage and all other security controls were not comprehensively audited by this change.

## Validation

Production build and health checks passed. Temporary disposable accounts tested authenticated OTP verification, Arabic digit input, incorrect/expired/undelivered/reused codes, cross-account isolation, attempt and resend limits, contact matching, middleware redirects on main/tenant domains, and direct PostgREST enforcement. Fixtures were deleted.

One authorized test-code email was accepted by Gmail SMTP for hesham.mera@gmail.com. Inbox placement was not independently observed. The message was explicitly a delivery test and did not activate that real account. The real email and OTP acceptance paths were tested separately, without sending any other emails.

TypeScript still reports the same eight pre-existing errors outside this change. No new TypeScript errors were introduced. Native/browser visual automation was unavailable, so these were HTTP/API/SQL and build checks, not an interactive browser walkthrough.
