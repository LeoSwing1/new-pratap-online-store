# New Pratap Tools Commerce OS — V35 Architecture

V35 is the production-focused baseline for the existing New Pratap Tools storefront and admin console. The working customer/admin UI is intentionally preserved while the backend and integration layer are strengthened so deployment does not depend on a risky frontend rewrite.

## Core architecture
- Customer Store → Node commerce API → central commerce state
- Admin Panel → authenticated Node commerce API → same central state
- Integration Control Center → encrypted server-side credential store
- Live order/notification sync → polling today, realtime provider-ready
- Browser push → Firebase Cloud Messaging adapter
- OTP → demo `1234` when `OTP_DEMO_MODE=true`; live SMS/email providers when configured

## 30 integration domains
1. Supabase / PostgreSQL
2. Customer Authentication
3. Realtime Sync
4. Cloud Storage
5. Payment Gateway
6. Payment Verification & Webhooks
7. Courier & Shipment
8. AWB & Live Tracking
9. WhatsApp Business
10. Transactional Email
11. SMS / OTP
12. Browser Push / FCM
13. Invoice & GST
14. Analytics
15. Google Merchant / Shopping
16. Support & Smart Assistant
17. Google Maps & Address Intelligence
18. Reviews & Ratings
19. Advanced Search & Smart Filters
20. Supplier & Purchase Management
21. Accounting Integration
22. WhatsApp Product Catalogue
23. Abandoned Cart Recovery
24. Meta Ads & Conversion Tracking
25. Google Ads Conversion Tracking
26. Security & Monitoring
27. Automated Backups & Recovery
28. CRM & Customer Intelligence
29. Live Human Support
30. Multi-Store & Warehouse

## Production rule
No real secrets are bundled. Provider credentials are entered through the admin Integration Control Center and stored encrypted server-side. A persistent PostgreSQL/Supabase or MongoDB-backed data layer should be selected before production reliance on Render filesystem storage.
