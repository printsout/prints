# Printsout - E-commerce Platform PRD

## Originalbeställning
E-handelsplattform "Printsout" för anpassade fototryck på produkter (muggar, t-shirts, posters, namnlappar, kalendrar, fotoalbum). React frontend + FastAPI backend + MongoDB.

## Teknisk Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, React Three Fiber, DOMPurify
- **Backend**: FastAPI, MongoDB (Motor), JWT, pyotp (2FA), reportlab (PDF)
- **Integrationer**: Stripe (LIVE), Resend (LIVE, info@printsout.se)

## Kärnfunktioner
- Hemsida, produktsidor, 3D-förhandsgranskning, designverktyg, kalendrar, namnlappar, fotoalbum
- Varukorg + Stripe-kassaflöde (LIVE), kundkonton, glömt lösenord-flöde
- Admin panel med 2FA, produkthantering, ordrar, betalningar, inställningar, rabattkoder, säkerhetsloggar

## E-postfunktioner
- [x] **Orderbekräftelse**: Skickas automatiskt till kund vid lyckad Stripe-betalning
- [x] **Leveransbekräftelse med spårning**: Skickas med spårningsnummer och klickbar spårningslänk
- [x] **Rabattkods-mail**: Skickas via admin-panelen till valda kunder
- [x] **Lösenordsåterställning**: Skickas vid "Glömt lösenord"-flöde

## Namnlappar (2026-04-06) - NYTT
- [x] 140 st namnlappar på A4-ark, självhäftande, 30x13 mm (7 kolumner × 20 rader)
- [x] Namnlapps-editor med 3 flikar: Text (namn, telefon, typsnitt, färg), Motiv (50+ ikoner, egen bild), Bakgrund (60+ färger/gradient)
- [x] Live-förhandsvisning med miniatyrer i 7-kolumnsgrid
- [x] Admin kan ladda ner utskriftsbar A4-PDF med alla 140 namnlappar via knappen "Ladda ner namnlappar (PDF - 140 st A4)"
- [x] PDF genereras med korrekt bakgrundsfärg, typsnitt (Google Fonts), textfärg, och motivsymboler
- [x] Produktbadges: "140 st / A4-ark", "30×13 mm", "Självhäftande"

## Spårningsfunktion (2026-04-06)
- [x] Admin kan ange spårningsnummer och välja transportör (PostNord, DHL, Bring, DB Schenker, UPS)
- [x] Leveransmail inkluderar spårningsnummer + klickbar "Spåra ditt paket"-länk

## Admin 2FA-fix (2026-04-06)
- [x] Utökad valid_window från 1 till 2 (±60 sekunders tolerans) för TOTP-verifiering

## Testresultat
- iteration_14: 15/15 backend, 100% frontend
- iteration_15: 15/15 backend, 100% frontend
- iteration_16: 9/9 backend, 100% frontend (shipping email)
- iteration_17: 7/7 backend, 100% frontend (tracking number)
- iteration_18: 7/7 backend, 100% frontend (nametag PDF + editor)

## Arkitektur
```
/app
├── backend/
│   ├── server.py (~2000 rader)
│   ├── email_service.py (shipping + order confirmation + discount + password reset)
│   ├── nametag_pdf.py (PDF-generering för 140 namnlappar på A4)
│   └── tests/ (conftest.py + test files)
└── frontend/src/
    ├── utils/ (constants.js, pricing.js)
    ├── context/ (AuthContext, AdminContext, CartContext)
    ├── components/
    │   ├── Navbar.js, Footer.js
    │   └── ProductPreview3D.js
    ├── pages/
    │   ├── NameTagEditor.js (redesignad med 140 st, 3 flikar, live-förhandsvisning)
    │   ├── CalendarEditor.js, PhotoAlbumEditor.js
    │   ├── admin/orders/OrderDetailPanel.js (med PDF-nedladdning)
    │   └── ...
```

## Inloggningsuppgifter
- Admin: info@printsout.se / PrintoutAdmin2024! (kräver 2FA)
- Kunder: Registrera via /registrera

## Backlog
### P1
- [x] ~~Dela PhotoAlbumEditor (900 rader) → separata komponenter~~ (2026-04-06: 7 filer, max 245 rader)
- [x] ~~Bryt ut server.py routers till separata filer~~ (2026-04-06: 1 fil 2035→16 filer, server.py=119 rader)
- [ ] Minska Cart.js komplexitet med custom hook

### P2
- [ ] Implementera Klarna/Swish-betalningar
- [ ] Dela ProductPreview3D (274 rader) → 3D-hooks
- [ ] Förbättra e-postmallar med Jinja2
- [ ] Fixa Unsplash ORB-bildproblem (ersätt med lokala bilder)
