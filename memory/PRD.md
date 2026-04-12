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

## Bildjustering i katalogdesigner (2026-04-09) - NYTT
- [x] Ny `AdjustableImage` komponent med zoom + position via object-position/transform
- [x] Ny `ImageAdjustControls` komponent med reglage för zoom (100-250%) och position (H/V)
- [x] Bildjustering på omslagssida (bakgrundsbild med bgImgSettings)
- [x] Bildjustering på produktsidor (per produkt med imgSettings)
- [x] Bildjustering på gallerisidor (per galleribild med imgSettings[])
- [x] Förhandsgranskning (PagePreview) uppdaterad att visa justering i realtid

## B2B-produkter i admin + Katalogdesign-redigeringsverktyg (2026-04-08) - NYTT
- [x] 3 B2B-produkter seedade i databasen: Visitkort, Katalogutskrift, Egen Katalogdesign
- [x] AdminProducts visar B2B-produkter med kategorifilter (Alla/Webbshop/Företag) och B2B-badge
- [x] B2B-produkttyper (businesscard, catalog_print, catalog_design) tillagda i produkttyp-dropdown
- [x] B2B-produkter dolda från den publika produktsidan (filtreras bort i Products.js)
- [x] Admin redigeringsverktyg för katalogdesign: `GET/PUT /api/admin/orders/{id}/catalog-design`
- [x] CatalogDesigner stödjer `?admin_edit={orderId}` — öppnar designern med orderdata, sparar tillbaka via PUT
- [x] OrderDetailPanel visar "Redigera design"-knapp (indigo) som öppnar CatalogDesigner i admin-läge

## PDF-nedladdning för kataloger i admin (2026-04-07) - NYTT
- [x] Ny backend `catalog_pdf.py` — genererar PDF från katalogdesign-data (omslag, produktsidor, text, kontakt)
- [x] Ny endpoint `GET /api/admin/orders/{id}/catalog-pdf` — genererar och laddar ner PDF för katalogdesign-ordrar
- [x] Ny endpoint `GET /api/admin/b2b-orders/{id}/pdf` — laddar ner uppladdad PDF från B2B-katalogbeställningar
- [x] Admin OrderDetailPanel visar "Ladda ner katalog (PDF)"-knapp för catalog_design-ordrar
- [x] Admin OrderDetailPanel visar "Ladda ner PDF"-knapp för print_catalog B2B-ordrar (med stöd för både direktlänk och B2B-endpoint)

## Visitkort Redigera i varukorg (2026-04-07) - NYTT
- [x] Redigeringsknapp visas nu på visitkortsartiklar i varukorgen
- [x] Klick navigerar till `/foretag?edit={cartItemId}`
- [x] Editor hydrerar alla fält (namn, titel, företag, telefon, e-post, mall, färg, logotyp) från varukorgsdata
- [x] Automatiskt öppnar Utskrift-tab + Visitkort-tjänst
- [x] Knappen visar "Spara ändringar" i redigeringsläge

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

## Namnlapps-PDF Motiv Buggfix (2026-04-09) - NYTT
- [x] Lagt till 33+ vektorritningar för alla saknade motiv (cat, dog, rabbit, fish, bird, bug, car, plane, rocket, ship, bike, train, gamepad, sparkles, etc.)
- [x] Tidigare ritades saknade motiv som en enkel cirkel (prick) — nu har varje motiv en unik igenkännbar form
- [x] Fallback ändrad från cirkel till stjärna för eventuella okända motiv
- [x] **Gradient-bakgrunder**: Regnbåge och 10 andra gradienter renderas nu korrekt i PDF (tidigare bara solid färg)
- [x] Implementerat horisontell gradientrendering med färginterpolation mellan alla stopp
- [x] SVG-paths extraherade från lucide-react (53 ikoner) och nametag_pdf.py helt omskriven med ReportLab canvas-kommandon
- [x] Backend stödjer `item_index` query param för ordrar med flera namnlappar
- [x] PDF-nedladdningsknappen borttagen från admin OrderDetailPanel (enligt användarens önskemål)
- [x] Namnlappsinformation (motiv, namn, bakgrund etc.) visas fortfarande i admin-orderdetaljer

## Visitkort Admin (2026-04-12) - NYTT
- [x] Stafflade priser i admin produktredigeraren — visas villkorligt för model_type='businesscard'
- [x] Ny `businesscard_pdf.py` — genererar tryckbar A4-PDF med 8 visitkort per sida + klippmarkeringar
- [x] 8 mallar stöds: classic, modern, minimal, elegant, creative, corporate, nature, tech — matchar frontend-editorn
- [x] Admin endpoint `GET /api/admin/orders/{id}/businesscard-pdf`
- [x] "Generera visitkort (PDF - 8 st/A4)"-knapp i admin OrderDetailPanel
- [x] Backend `Product` och `AdminProductCreate` modeller uppdaterade med `quantity_prices` fält
- [x] **Modern-mall PDF-fix** (2026-04-12): PDF-layouten för "modern"-mallen korrigerad så att den matchar frontend-förhandsgranskningen — 38% accent-topp med centrerad logotyp, centrerad text i vit botten
- [x] **Logo-korruptionsbugg fixad** (2026-04-12): Vid redigering av visitkort i varukorgen skickades server-URL:en till upload-base64 istället för ny bilddata, vilket skapade korrupta 36-byte filer. Fix: frontend återanvänder befintlig URL vid redigering, backend avvisar ogiltiga URL-strängar
- [x] **PDF-source visitkort fixat** (2026-04-12): När kund laddar upp egen visitkorts-PDF (source="pdf") returnerade admin-endpointen en tom genererad PDF istället för kundens uppladdade fil. Fix: admin-endpoint kontrollerar nu `source` och returnerar den uppladdade PDF:en direkt
### P1
- [x] ~~B2B Katalogbeställning~~ (2026-04-07: /foretag + admin /admin/catalogs)
- [x] ~~B2B virtuella produkter i varukorgen~~ (2026-04-07: useCartData.js + CartItemCard.js)
- [x] ~~Katalogdesigner~~ (2026-04-07: /katalog-designer med 5 sidtyper + varukorg)
- [x] ~~Dela PhotoAlbumEditor~~ (2026-04-06)
- [x] ~~Bryt ut server.py routers~~ (2026-04-06)
- [x] ~~Minska Cart.js komplexitet~~ (2026-04-06)
- [x] ~~Redigera varukorgsartikel~~ (2026-04-07)
- [ ] Admin Produktredigerare: Feature Parity (villkorliga konfigurationsfält per produkttyp)

### P2
- [ ] Implementera Swish-betalningar
- [ ] Dela ProductPreview3D (274 rader) → 3D-hooks
- [ ] Förbättra e-postmallar med Jinja2
- [ ] Fixa Unsplash ORB-bildproblem (ersätt med lokala bilder)
- [ ] Molnlagring för uppladdade filer (bilder/PDF försvinner vid omstart)

## Kalender PDF-nedladdning (2026-04-09) - NYTT
- [x] Ny backend `calendar_pdf.py` — genererar 12-sidig kalender-PDF med bilder + kalenderrutnät
- [x] Varje sida: bild överst (60%), månadsrubrik + veckodag-headers + korrekt daggrid underst (40%)
- [x] Helgdagar (lör/sön) i rött, varannan rad med alternerad bakgrund
- [x] Publik endpoint `POST /api/calendar/generate-pdf` — kunder kan ladda ner PDF direkt från editorn
- [x] Admin endpoint `GET /api/admin/orders/{id}/calendar-pdf` — admin kan ladda ner kalender-PDF från orderdetaljer
- [x] "Ladda ner som PDF"-knapp i CalendarEditor (under "Lägg i varukorg")
- [x] "Ladda ner kalender (PDF)"-knapp i admin OrderDetailPanel (indigo, bredvid ZIP-knappen)
- [x] **Textskrivning på bilder**: Kunden kan skriva text per månadsbild, dra texten vart de vill, välja färg (6 val) och storlek (12-48px)

## Backlog
- [x] Texten renderas på PDF:en med skugga på exakt position som i editorn

## Kodkvalitetsförbättringar (2026-04-12) - NYTT
- [x] **businesscard_pdf.py refaktorerad**: Brutit ner `_draw_card()` (358 rader, komplexitet 72) till 8 separata mallfunktioner + 2 hjälpfunktioner (`_draw_logo`, `_draw_contact_lines`). Dispatch via `_TEMPLATE_RENDERERS`-dict.
- [x] **XSS-skydd verifierat**: `dangerouslySetInnerHTML` i AdminContent.js och ContentPage.js redan skyddade med DOMPurify.sanitize()
- [x] **React-prestandafix**: `useMemo` för `sortedProducts` i Products.js
- [x] **Oanvända variabler borttagna**: `catch (error)` → `catch` i Products.js, ProductDetail.js, AdminDashboard.js
- [x] **Backend-validering**: upload-base64 avvisar URL-strängar och filer < 100 bytes
