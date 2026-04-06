# Printsout - E-commerce Platform PRD

## Originalbeståndning
E-handelsplattform "Printsout" för anpassade fototryck på produkter (muggar, t-shirts, posters, namnlappar, kalendrar, fotoalbum). React frontend + FastAPI backend + MongoDB.

## Teknisk Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, React Three Fiber, DOMPurify
- **Backend**: FastAPI, MongoDB (Motor), JWT, pyotp (2FA)
- **Integrationer**: Stripe (LIVE), Resend (LIVE, info@printsout.se)

## Vad som är implementerat

### Kärnfunktioner
- Hemsida med hero, kategorier, recensioner
- Produktsidor med listning och filtrering (14 produkter, 9 kategorier)
- 3D-produktförhandsgranskning (muggar) med texturmappning
- Designverktyg med bilduppladdning, drag, zoom, rotation, text
- Kalenderredigerare (12 sidor)
- Namnlappsredigerare
- Fotoalbumredigerare
- Varukorg och Stripe-kassaflöde (LIVE)
- Kundkonton med orderhistorik och sparade designer
- Glömt lösenord-flöde med e-postlänkar
- Cookie-banner

### Admin Panel (/admin)
- Dashboard med statistik
- Produkt-, användar-, order- och betalningshantering
- Inställningar (frakt, moms, rabatter, rabattkoder, 2FA)
- Skatterapport
- Recensionshantering
- Innehållssidor
- Säkerhetsloggar
- Obligatorisk 2FA (TOTP/Microsoft Authenticator)

### Säkerhet
- JWT-autentisering med sessionStorage (ej localStorage)
- 2FA obligatoriskt för admin
- Rate limiting
- XSS-skydd (DOMPurify, bleach)
- Lösenordsvalidering

## Kodkvalitetsfixar (2026-04-06)
- [x] Fixat alla tomma catch-block i 8+ filer
- [x] Fixat saknade React Hook-beroenden med useCallback
- [x] Migrerat auth tokens från localStorage till sessionStorage
- [x] Delat AdminSettings.js → AdminSettings + ShippingTaxSection + DiscountCodesSection + TwoFASection
- [x] Delat AdminOrders.js → AdminOrders + OrderDetailPanel
- [x] Extraherat e-postlogik från server.py till email_service.py
- [x] Alla tester passerade (14/14 backend, alla frontend)

## Databasschema
- `users`: email, password_hash, name, role
- `products`: product_id, name, description, price, category, productType
- `orders`: order_id, user_id, email, items, total_amount, status, shipping_address
- `carts`: session_id, items
- `discount_codes`: code, discount_percent, max_uses, active, expires_at
- `admin_settings_2fa`: admin_email, totp_secret, is_enabled
- `admin_logs`: action, admin_email, timestamp
- `payment_settings`: shipping_enabled, shipping_cost, tax_enabled, tax_rate, etc.

## Inloggningsuppgifter
- Admin: info@printsout.se / PrintoutAdmin2024! (kräver 2FA)
- Kunder: Registrera via /registrera

## Arkitektur
```
/app
├── backend/
│   ├── server.py (~2000 rader, minskad från 2130)
│   ├── email_service.py (NY - extraherade e-postmallar)
│   └── tests/conftest.py
└── frontend/src/
    ├── context/ (AuthContext, AdminContext, CartContext)
    ├── pages/
    │   ├── admin/
    │   │   ├── settings/ (NY - ShippingTaxSection, DiscountCodesSection, TwoFASection)
    │   │   ├── orders/ (NY - OrderDetailPanel)
    │   │   └── AdminSettings.js, AdminOrders.js (refaktorerade)
    │   └── ...
    └── components/
```

## Backlog
### P1
- [ ] Fortsätt dela upp stora React-komponenter (DesignEditor 677 rader, PhotoAlbumEditor 900 rader, Checkout 517 rader)
- [ ] Refaktorera server.py ytterligare (bryt ut routers till separata filer)

### P2
- [ ] Lägg till useMemo för tunga filter/map-operationer
- [ ] Implementera Klarna/Swish-betalningar
- [ ] Fixa eventuella Unsplash ORB-bildproblem
