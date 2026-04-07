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

## B2B Katalogtjänster (2026-04-07) - Uppdaterad
- [x] Ny sida `/foretag` med två huvudflikar:
  - Flik 1: "Vår produktkatalog" – beställ fysisk broschyr (gratis, max 5st) eller digital PDF
  - Flik 2: "Utskriftstjänster" – två tjänster:
    - **Katalog**: Ladda upp egen PDF-katalog för utskrift och leverans
    - **Visitkort**: Designa själv (3 mallar, 8 färger, logouppladdning, live-förhandsvisning) ELLER ladda upp PDF
- [x] Backend: 3 endpoints – `our-catalog` (JSON), `print` (multipart PDF), `businesscard` (multipart med editor/PDF-stöd + logga)
- [x] Admin: "Kataloger" med filter (Alla/Vår katalog/Utskrift/Visitkort) + visitkortsdetaljer + PDF-nedladdning
- [x] Visitkortseditor: Klassisk/Modern/Minimal mallar, 8 accentfärger, realtidsförhandsvisning
- [x] Logouppladdning framträdande placerad direkt under förhandsvisningen
- [x] Prisberäkning med prisstege (visitkort: 5,90→1,20 kr/st, katalog: 89→39 kr/ex)
- [x] Snabbvalsknappar (50/100/250/500 st) och pris i submit-bar

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
- iteration_24: 19/19 backend, 100% frontend (Visitkort: editor med mallar/färger + PDF-uppladdning)
- iteration_25: 11/11 backend, 100% frontend (B2B virtuella produkter i varukorgen - buggfix)
- iteration_26: 10/10 backend, 100% frontend (Katalogdesigner - ny funktion)
- iteration_27: Klarna via Stripe integrerat (visuellt verifierat)
- iteration_28: 11/11 backend, 100% frontend (Katalogdesign redigera i varukorg + virtuella produkter i ordrar)

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

## Code Quality Fixes (2026-04-07) - NYTT
- [x] XSS: Verifierat DOMPurify redan används i AdminContent.js och ContentPage.js
- [x] Security: Flyttat hårdkodade secrets i 4 testfiler till .env.test + conftest.py fixtures
- [x] React hooks: Fixat alla webpack dependency-varningar (0 varningar nu)
- [x] Console statements: Ersatt console.error med toast/silent i AdminSettings.js och AdminCatalogs.js
- [x] Array keys: Ersatt index-keys med stabila ID:n i CatalogDesigner.js (5 ställen)
- [x] Performance: Memoiserat PAGE_TYPES.filter() med useMemo i CatalogDesigner.js
- [x] Backend complexity: Refaktorerat _draw_motif() till dispatch-tabell (nametag_pdf.py)
- [x] Backend complexity: Extraherat _save_upload() helper i catalog.py (order_businesscard)
- [x] Component splitting: CatalogDesigner.js 812→393 rader (+ catalogConstants.js, PagePreview.js, PageEditor.js)
- [x] Virtuella produkt-ID:n (`print-businesscard`, `print-catalog`, `our-catalog-*`) hanteras korrekt i `useCartData.js` utan 404-API-anrop
- [x] Fallback-ikoner i `CartItemCard.js` uppdaterade till lucide-react (CreditCard, BookOpen, FileText)
- [x] B2B-artiklar exkluderade från "Redigera"-knappen (businesscard, print_catalog, our_catalog)

## Katalogdesigner Redigera i varukorg (2026-04-07) - NYTT
- [x] Redigeringsknapp (pennikon) visas nu på katalogdesign-artiklar i varukorgen
- [x] Klick navigerar till `/katalog-designer?edit={cartItemId}` 
- [x] Editor hydrerar alla inställningar (företagsnamn, logotyp, mall, tema, sidor) från varukorgsdata
- [x] Knappen visar "Spara ändringar" istället för "Lägg i varukorgen" i redigeringsläge
- [x] Sparande uppdaterar befintlig artikel via PATCH (ingen dubblett skapas)

## Admin Konsolidering (2026-04-07) - NYTT
- [x] Borttagen separat "Kataloger" admin-sida (`/admin/catalogs`)
- [x] B2B-beställningar (visitkort, utskrift, katalog) integrerade i huvudordersidan `/admin/orders`
- [x] Nytt typfilter: Alla typer / Webbshop / B2B
- [x] B2B-badge (indigo) och typ-kolumn i ordertabellen
- [x] Sökning stödjer nu även kundnamn
- [x] Virtuella B2B-produkter (print-catalog-custom, print-businesscard, print-catalog) sparas nu korrekt i ordrar vid checkout
- [x] Rotorsak: `_build_order_items()` hoppade över artiklar som inte fanns i products-databasen
- [x] Fix: Använder varukorgsdata (namn, pris) för virtuella produkter som saknas i DB
- [x] Admin OrderDetailPanel visar nu detaljerad information för: catalog_design, businesscard, print_catalog, our_catalog

## Katalogdesigner (2026-04-07) - NYTT
- [x] Ny fristående sida `/katalog-designer` utan navbar/footer
- [x] Setup-steg: Företagsnamn, logotyp, mallval (Klassisk/Modern/Minimal), sidantal (4/8/12), färg/typsnitt
- [x] Editor med 3-panelslayout: sidminiatyrer (vänster), A4-förhandsvisning (center), redigeringskontroller (höger)
- [x] 5 sidtyper: Omslag, Produktsida, Galleri, Textsida, Baksida
- [x] Produktsida: bilduppladdning, produktnamn, beskrivning, pris — max 6 produkter per sida
- [x] Gallerisida: 4 bildplatser med bildtexter
- [x] Textsida: rubrik + brödtext
- [x] Baksida: företagsnamn, telefon, e-post, webbplats, adress
- [x] Sidhantering: lägg till/ta bort sidor, byt sidtyp (Produktsida/Galleri/Textsida)
- [x] Prisberäkning med prisstege (89/69/49/39 kr baserat på antal)
- [x] Varukorgintegration via virtuellt produkt-ID `print-catalog-custom` med anpassningstyp `catalog_design`
- [x] "Designa själv" / "Ladda upp PDF" toggle på B2B-sidan under Katalog-tjänsten
- [x] "Öppna designverktyget"-knapp navigerar till `/katalog-designer`

## Backlog
### P1
- [x] ~~B2B Katalogbeställning~~ (2026-04-07: /foretag + admin /admin/catalogs)
- [x] ~~B2B virtuella produkter i varukorgen~~ (2026-04-07: useCartData.js + CartItemCard.js)
- [x] ~~Katalogdesigner~~ (2026-04-07: /katalog-designer med 5 sidtyper + varukorg)
- [x] ~~Dela PhotoAlbumEditor~~ (2026-04-06)
- [x] ~~Bryt ut server.py routers~~ (2026-04-06)
- [x] ~~Minska Cart.js komplexitet~~ (2026-04-06)
- [x] ~~Redigera varukorgsartikel~~ (2026-04-07)

### P2
- [ ] Implementera Swish-betalningar
- [ ] Dela ProductPreview3D (274 rader) → 3D-hooks
- [ ] Förbättra e-postmallar med Jinja2
- [ ] Fixa Unsplash ORB-bildproblem (ersätt med lokala bilder)
- [ ] Molnlagring för uppladdade filer (bilder/PDF försvinner vid omstart)
