# New Pratap Tools Commerce OS — V35

Production-focused V35 baseline for the New Pratap Tools customer store and admin panel.

## Included
- Customer storefront and responsive admin console
- Central orders, customers, products and notifications
- Live order/notification synchronization
- Customer notification bell + mobile Alerts area
- Browser push / Firebase Cloud Messaging adapter
- Demo OTP `1234` with live provider-ready OTP delivery
- Admin notification composer and customer segmentation
- In-store, push, email, SMS and WhatsApp delivery channels
- Encrypted server-side integration credential storage
- 30 integration domains with a canonical registry and provider contracts
- Payment verification/webhooks and courier/tracking adapters
- Render-ready deployment and `/api/health`
- Integration registry endpoint and admin test-all endpoint

## Demo OTP
Set `OTP_DEMO_MODE=true`. The demo code is `1234` for both mobile and email OTP flows. Disable demo mode and configure the required live provider before production authentication.

## Integration setup
Use Admin → Integrations. Unlock the panel, select an integration, enter provider credentials, save, then use Test. Secrets are kept on the server and are not exposed to the browser.

## Production storage
The current stable commerce fallback uses `.data/commerce.json`. Render Free filesystem storage is not a permanent database. Before production, connect a persistent PostgreSQL/Supabase or MongoDB data store and move commerce persistence to it.

## Safety
Never commit `.env.local`, service-account JSON, API secrets, payment secrets, or production admin passwords. Change the demo admin password before production.

## Verification
Run:

```bash
npm install
npm run check
npm start
```

Health: `/api/health`
Integration registry: `/api/integrations/registry`
