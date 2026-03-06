# Chapa Payment Integration

This project integrates [Chapa](https://chapa.co) for course payments (card, mobile money, etc.).

## Backend configuration

Set these environment variables (or add to `application.yaml`):

| Variable | Description |
|----------|-------------|
| `CHAPA_SECRET_KEY` | Your Chapa secret key (test: `CHASECK_TEST-...`, live: `CHASECK-...`). Get it from [dashboard.chapa.co](https://dashboard.chapa.co) → Settings → API. |
| `FRONTEND_BASE_URL` | Frontend base URL for redirect after payment (e.g. `http://localhost:8081`). |
| `CHAPA_CALLBACK_BASE_URL` | Backend base URL so Chapa can call the callback (e.g. `http://localhost:8080`). In production use your public backend URL. |

## Flow

1. Student clicks **Pay with Chapa** on checkout → backend creates a `PENDING` payment and calls Chapa initialize API.
2. Student is redirected to Chapa checkout → pays there.
3. Chapa redirects the student to `{FRONTEND_BASE_URL}/courses/{slug}/checkout/success?paymentId=...`.
4. Chapa calls backend `GET {CHAPA_CALLBACK_BASE_URL}/api/payments/chapa/callback?trx_ref=...&ref_id=...&status=success`.
5. Backend verifies the transaction with Chapa, marks the payment `COMPLETED`, and creates the enrollment.

## Testing

- Use Chapa **test** key for sandbox; no real money is charged.
- Ensure the callback URL is reachable by Chapa (in production, use a public URL; locally you may need a tunnel like ngrok for webhook testing).
- Return URL is where the user lands after payment; callback URL is server-to-server.
