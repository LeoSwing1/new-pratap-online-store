# New Pratap Tools & Abrasives — V30 Demo Stable Build

## Device Independent + Live Sync + Render Ready

This build is the single demo baseline. Customer Store, Admin Panel and the Node backend share one central server data contract.

### Core guarantees
- 30-product catalogue retained; demo transactional data starts clean.
- Customer accounts, addresses, orders and customer notifications are server-backed.
- Admin orders/customers/notifications are server-backed.
- Live polling updates open screens without manual page refresh.
- Customer and admin data is normalized around mobile/email matching.
- Customer login does not trust stale device-only customer records when the central server says the account does not exist.
- Add-to-cart does not auto-open the cart drawer.
- Mobile navigation functions are defined and animated.
- Integration Control Center retains all configured integration modules/providers from the project.
- No real credentials are bundled.

### Demo data
Products: 30
Orders: 0
Customers: 0
Notifications: 0

### Local
`node server.js`

Customer: `http://localhost:8787/`
Admin: `http://localhost:8787/admin-panel/`
Health: `http://localhost:8787/api/health`

### Render
Start command: `npm start`
Health: `/api/health`
Server binds to `0.0.0.0` and uses `process.env.PORT`.

### Production note
The JSON store is centralized for demo/staging. For permanent production persistence, connect the prepared Supabase/PostgreSQL integration and configure a persistent database.


## V31 Notifications & OTP
- Customer notification center is available from the header bell and mobile Alerts tab.
- Browser push uses Firebase Cloud Messaging when configured.
- Mobile/email OTP authentication is server-verified.
- Admin can send general, offer, or order notifications to all or selected customers.
- Configure Email, SMS, and Browser Push under Admin → Integrations.
