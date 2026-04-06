# Printsout - E-commerce Platform PRD

## Originalbeställning
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
- Skatterapport, recensionshantering, innehållssidor
- Säkerhetsloggar
- Obligatorisk 2FA (TOTP/Microsoft Authenticator)

### Säkerhet
- JWT-autentisering med sessionStorage (ej localStorage)
- 2FA obligatoriskt för admin
- Rate limiting, XSS-skydd (DOMPurify, bleach)

## Kodkvalitetsfixar (2026-04-06) - KOMPLETT

### Kritiska fixar
- [x] Fixat undefined variable i test_password_reset_link_flow.py (rad 255, 368)
- [x] XSS - Verifierat att DOMPurify redan används i AdminContent.js och ContentPage.js
- [x] Fixat alla tomma catch-block i 10+ filer
- [x] Fixat saknade React Hook-beroenden med useCallback i 8+ filer

### Viktiga fixar
- [x] Migrerat auth tokens från localStorage till sessionStorage (AuthContext, AdminContext)
- [x] Tagit bort console.log från AdminSettings.js och Cart.js
- [x] Fixat nested ternaries i AdminDashboard.js och ProductDetail.js
- [x] Lagt till useMemo i OrderDetailPanel.js för filter/map-operationer
- [x] Fixat test hardcoded secrets - alla test använder nu os.environ.get()

### Komponentuppdelning
- [x] AdminSettings.js (929→350 rader) → ShippingTaxSection + DiscountCodesSection + TwoFASection
- [x] AdminOrders.js (682→200 rader) → OrderDetailPanel
- [x] AdminLogin.js (377→120 rader) → LoginForms + TwoFactorForms
- [x] Checkout.js (520→130 rader) → CheckoutForms + OrderSummary

### Backend-refaktorering
- [x] Extraherat e-postlogik → email_service.py
- [x] Delat create_checkout() → _build_order_items() + _create_stripe_session()
- [x] Delat init_data() → _get_seed_products() + _get_seed_reviews()
- [x] Skapat delad prisberäkningsmodul utils/pricing.js

### Deployment-fix
- [x] Fixat `load_dotenv(override=True)` → `override=False` i server.py

## Testresultat
- iteration_14.json: 15/15 backend, 100% frontend - ALLA TESTER PASSERADE

## Arkitektur
```
/app
├── backend/
│   ├── server.py (~1995 rader, minskad och refaktorerad)
│   ├── email_service.py (extraherade e-postmallar)
│   └── tests/ (conftest.py med delade testvariabler)
└── frontend/src/
    ├── utils/pricing.js (NY - delad prisberäkning)
    ├── context/ (AuthContext, AdminContext, CartContext - alla med useCallback)
    ├── pages/
    │   ├── checkout/ (NY - CheckoutForms, OrderSummary)
    │   ├── admin/
    │   │   ├── settings/ (ShippingTaxSection, DiscountCodesSection, TwoFASection)
    │   │   ├── orders/ (OrderDetailPanel med useMemo)
    │   │   └── login/ (LoginForms, TwoFactorForms)
    │   └── ...
    └── components/
```

## Inloggningsuppgifter
- Admin: info@printsout.se / PrintoutAdmin2024! (kräver 2FA)
- Kunder: Registrera via /registrera

## Backlog
### P1
- [ ] Fortsätt dela upp stora React-komponenter (DesignEditor 677 rader, PhotoAlbumEditor 900 rader, NameTagEditor 577 rader, CalendarEditor 379 rader)
- [ ] Refaktorera server.py ytterligare (bryt ut routers till separata filer)
- [ ] Minska Cart.js komplexitet (cyclomatic complexity: 57) med custom hook
- [ ] Minska Account.js komplexitet med delkomponenter

### P2
- [ ] Implementera Klarna/Swish-betalningar
- [ ] Fixa eventuella Unsplash ORB-bildproblem
