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

## E-postfunktioner
- [x] **Orderbekräftelse**: Skickas automatiskt till kund vid lyckad Stripe-betalning (webhook + status check)
- [x] **Leveransbekräftelse med spårning**: Skickas automatiskt till kund när admin ändrar orderstatus till "Skickad", med spårningsnummer och klickbar spårningslänk (stöd för PostNord, DHL, Bring, DB Schenker, UPS)
- [x] **Rabattkods-mail**: Skickas via admin-panelen till valda kunder
- [x] **Lösenordsåterställning**: Skickas vid "Glömt lösenord"-flöde

## Spårningsfunktion (2026-04-06)
- [x] Admin kan ange spårningsnummer och välja transportör (PostNord, DHL, Bring, DB Schenker, UPS) vid statusändring till "Skickad"
- [x] Dialog visas med transportör-dropdown och spårningsnummer-fält
- [x] Spårningsinformation sparas i order-dokumentet i MongoDB
- [x] Leveransmail till kund inkluderar spårningsnummer + klickbar "Spåra ditt paket"-länk
- [x] Spårningsnummer visas i admin orderdetaljer med extern spårningslänk

## Deployment-fix (2026-04-06)
- [x] Rensat .gitignore — tog bort alla `*.env` blockeringar som förhindrade deploy
- [x] .env-filer inkluderas nu vid deploy (krävs av Emergent K8s)

## Kodkvalitetsfixar - Omgång 1 & 2
- [x] Fixat tomma catch-block, React Hook-beroenden, localStorage → sessionStorage
- [x] Delat stora komponenter (AdminSettings, AdminOrders, AdminLogin, Checkout, Navbar, DesignEditor, AdminPayments)
- [x] Extraherat email_service.py, delat create_checkout() + init_data()
- [x] Deployment-fix: load_dotenv(override=False)
- [x] Extraherat magic numbers → utils/constants.js
- [x] Fixat nested ternaries, lagt till useMemo

## Testresultat
- iteration_14: 15/15 backend, 100% frontend
- iteration_15: 15/15 backend, 100% frontend
- iteration_16: 9/9 backend, 100% frontend (shipping email)
- iteration_17: 7/7 backend, 100% frontend (tracking number)

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
    │   ├── Navbar.js
    │   ├── navbar/ (MobileMenu, UserDropdown)
    │   └── ProductPreview3D.js
    ├── pages/
    │   ├── design/ (DesignTools, DesignCanvas)
    │   ├── checkout/ (CheckoutForms, OrderSummary)
    │   ├── admin/
    │   │   ├── settings/ (ShippingTaxSection, DiscountCodesSection, TwoFASection)
    │   │   ├── orders/ (OrderDetailPanel - with tracking dialog)
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
