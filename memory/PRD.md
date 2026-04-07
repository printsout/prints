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

## Redigera i varukorgen (2026-04-07) - NYTT
- [x] PATCH-endpoint `/api/cart/{session_id}/items/{cart_item_id}` - uppdaterar en varukorgsartikel helt (anpassning, antal, etc) med bevarat cart_item_id
- [x] "Redigera"-knapp (pennikon) visas på alla varukorgsartiklar med anpassningsdata
- [x] Klick navigerar till rätt editor (Namnskylt/Kalender/Fotoalbum) med `?edit={cartItemId}`
- [x] Editor hydrierar alla val (namn, typsnitt, färg, motiv, bakgrund, bilder) från varukorgsdata
- [x] Knappen visar "Spara ändringar" istället för "Lägg i kundvagn" i redigeringsläge
- [x] Sparande uppdaterar befintlig artikel (ingen dubblett skapas)
- [x] Stöd i alla tre editorer: NameTagEditor, CalendarEditor, PhotoAlbumEditor

## B2B Katalogbeställning (2026-04-07) - Uppdaterad
- [x] Ny sida `/foretag` med två flikar: "Vår produktkatalog" + "Skriv ut er katalog"
- [x] Flik 1: Beställ vår produktkatalog (fysisk broschyr gratis max 5st, eller digital PDF gratis)
- [x] Flik 2: Ladda upp egen PDF-katalog för utskrift och leverans (max 50MB)
- [x] Backend: POST `/api/catalog/order/our-catalog` (JSON) + POST `/api/catalog/order/print` (multipart med PDF)
- [x] Admin: "Kataloger" i admin-panelen med filter (Alla/Vår katalog/Utskrift) + PDF-nedladdning
- [x] Navigation: "Företag"-länk i navbar, mobilmeny och footer

## Testresultat
- iteration_14: 15/15 backend, 100% frontend
- iteration_15: 15/15 backend, 100% frontend
- iteration_16: 9/9 backend, 100% frontend (shipping email)
- iteration_17: 7/7 backend, 100% frontend (tracking number)
- iteration_18: 7/7 backend, 100% frontend (nametag PDF + editor)
- iteration_20: 10/10 backend, 100% frontend (cart edit feature)
- iteration_21: 13/13 backend, 100% frontend (B2B catalog ordering)
- iteration_22: 13/13 backend, 100% frontend (B2B catalog PDF upload)
- iteration_23: 21/21 backend, 100% frontend (B2B two-tab catalog: vår katalog + utskrift)

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
- [ ] ~~B2B Katalogbeställning - skapa katalogfunktion för företagare~~ (2026-04-07: /foretag + admin /admin/catalogs)
- [x] ~~Dela PhotoAlbumEditor (900 rader) → separata komponenter~~ (2026-04-06: 7 filer, max 245 rader)
- [x] ~~Bryt ut server.py routers till separata filer~~ (2026-04-06: 1 fil 2035→16 filer, server.py=119 rader)
- [x] ~~Minska Cart.js komplexitet med custom hook~~ (2026-04-06: 334→4 filer, Cart.js=92 rader, useCartData hook)
- [x] ~~Redigera varukorgsartikel~~ (2026-04-07: PATCH-endpoint + editor hydration i alla 3 editorer)

### P2
- [ ] Implementera Klarna/Swish-betalningar
- [ ] Dela ProductPreview3D (274 rader) → 3D-hooks
- [ ] Förbättra e-postmallar med Jinja2
- [ ] Fixa Unsplash ORB-bildproblem (ersätt med lokala bilder)
