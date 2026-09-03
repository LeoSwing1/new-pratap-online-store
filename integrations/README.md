# New Pratap Tools — Integration Hub

V12 wires the full commerce journey through a single `IntegrationHub` event contract. The browser can run in **Demo** mode for presentations/testing; production secrets must remain on a secure backend.

## 16 integration modules
1. Supabase / PostgreSQL — core data
2. Customer Authentication — OTP/email/guest identity
3. Realtime Sync — live store/admin updates
4. Cloud Storage — product/banner/invoice media
5. Payment Gateway — UPI/cards/net banking/wallets
6. Payment Verification & Webhooks — server-side status/refunds
7. Courier & Shipment — shipment creation/rates/cancellation
8. AWB & Live Tracking — tracking timeline
9. WhatsApp Business — transactional messages/support
10. Transactional Email — orders/invoices/refunds
11. SMS / OTP — authentication and critical alerts
12. Browser Push / FCM — customer push notifications
13. Invoice & GST — invoice numbering/tax/PDF flow
14. Analytics — product/checkout/purchase events
15. Google Merchant / Shopping — catalogue feed
16. Support & Smart Assistant — product/order help

## Provider slots
Payments: Razorpay, Cashfree Payments, PhonePe, PayU
Couriers: Shiprocket, Delhivery, DTDC, Blue Dart, XpressBees
Email: Resend, SendGrid, SMTP
SMS: MSG91, Twilio
Push: Firebase Cloud Messaging
WhatsApp: WhatsApp Business Cloud API

## Demo behavior
The Integration Control Center lets the admin test connectors and switch Demo/Production environment labels. Testing records events locally so the complete flow can be demonstrated without sending live payments or messages.

## Production behavior
Replace the demo event handlers with secure server/API adapters. Do not put API secrets in customer-store or admin-panel JavaScript. Payment providers should use server-side verification and webhooks. Supabase can provide Postgres, Auth, Storage and Realtime. FCM web push requires HTTPS.
