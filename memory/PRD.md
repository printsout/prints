# Printsout - E-commerce Platform PRD

## Originalbeställning
E-handelsplattform "Printsout" för anpassade fototryck på produkter (muggar, t-shirts, posters, namnlappar, kalendrar, fotoalbum). React frontend + FastAPI backend + MongoDB.

## Teknisk Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, React Three Fiber, DOMPurify
- **Backend**: FastAPI, MongoDB (Motor), JWT, pyotp (2FA)
- **Integrationer**: Stripe (LIVE), Resend (LIVE, info@printsout.se)

## Kärnfunktioner
- Hemsida, produktsidor, 3D-förhandsgranskning, designverktyg, kalendrar, namnlappar, fotoalbum
- Varukorg + Stripe-kassaflöde (LIVE), kundkonton, glömt lösenord-flöde
- Admin panel med 2FA, produkthantering, ordrar, betalningar, inställningar, rabattkoder, säkerhetsloggar

## E-postfunktioner (2026-04-06)
- [x] **Orderbekräftelse**: Skickas automatiskt till kund vid lyckad Stripe-betalning (webhook + status check)
- [x] **Leveransbekräftelse**: Skickas automatiskt till kund när admin ändrar orderstatus till "Skickad"
- [x] **Rabattkods-mail**: Skickas via admin-panelen till valda kunder
- [x] **Lösenordsåterställning**: Skickas vid "Glömt lösenord"-flöde

## Deployment-fix (2026-04-06)
- [x] Rensat .gitignore — tog bort alla `*.env` blockeringar som förhindrade deploy
- [x] .env-filer inkluderas nu vid deploy (krävs av Emergent K8s)

## Kodkvalitetsfixar - Omgång 1 (2026-04-06)
- [x] Fixat tomma catch-block, React Hook-beroenden, localStorage → sessionStorage
- [x] Delat AdminSettings, AdminOrders, AdminLogin, Checkout
- [x] Extraherat email_service.py, delat create_checkout() + init_data()
- [x] Deployment-fix: load_dotenv(override=False)

## Kodkvalitetsfixar - Omgång 2 (2026-04-06)
- [x] Fixat kvarvarande hardcoded test secrets (module-level i test files)
- [x] Borttagen console.error från CartContext.js
- [x] Fixat empty catch i AdminSettings.js med korrekt kommentar
- [x] Extraherat magic numbers → utils/constants.js (SESSION_CHECK_INTERVAL_MS)
- [x] Delat Navbar (295→120 rader) → MobileMenu + UserDropdown
- [x] Delat DesignEditor (678→165 rader) → DesignTools + DesignCanvas
- [x] Delat AdminPayments (456→110 rader) → PaymentMethodCards
- [x] Verifierat XSS-skydd (DOMPurify.sanitize() redan på plats)
- [x] Verifierat hook-deps (falska positiver för module-level imports)
- [x] Fixat nested ternaries i AdminDashboard + ProductDetail
- [x] Lagt till useMemo i OrderDetailPanel

## Testresultat
- iteration_14: 15/15 backend, 100% frontend
- iteration_15: 15/15 backend, 100% frontend
- iteration_16: 9/9 backend, 100% frontend (shipping email feature)

## Arkitektur
```
/app
├── backend/
│   ├── server.py (~2000 rader)
│   ├── email_service.py (shipping + order confirmation + discount + password reset)
│   └── tests/ (conftest.py + test files)
└── frontend/src/
    ├── utils/ (constants.js, pricing.js)
    ├── context/ (AuthContext, AdminContext, CartContext)
    ├── components/
    │   ├── Navbar.js (120 rader)
    │   ├── navbar/ (MobileMenu, UserDropdown)
    │   └── ProductPreview3D.js
    ├── pages/
    │   ├── design/ (DesignTools, DesignCanvas)
    │   ├── checkout/ (CheckoutForms, OrderSummary)
    │   ├── admin/
    │   │   ├── settings/ (ShippingTaxSection, DiscountCodesSection, TwoFASection)
    │   │   ├── orders/ (OrderDetailPanel)
    │   │   ├── login/ (LoginForms, TwoFactorForms)
    │   │   └── payments/ (PaymentMethodCards)
    │   └── ...
```

## Inloggningsuppgifter
- Admin: info@printsout.se / PrintoutAdmin2024! (kräver 2FA)
- Kunder: Registrera via /registrera

## Backlog
### P1
- [ ] Redesigna Namnlapps-editorn (matcha namly.se)
- [ ] Dela PhotoAlbumEditor (900 rader) → PhotoAlbumControls + PhotoGrid + Preview
- [ ] Dela NameTagEditor (577 rader) → NameTagForm + Customization + Preview
- [ ] Dela CalendarEditor (379 rader)
- [ ] Bryt ut server.py routers till separata filer
- [ ] Minska Cart.js komplexitet med custom hook

### P2
- [ ] Implementera Klarna/Swish-betalningar
- [ ] Dela ProductPreview3D (274 rader) → 3D-hooks
- [ ] Koppla "Lägg i varukorg" för specialiserade editors (Kalender, Namnskylt)
