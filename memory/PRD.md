# Printout - E-commerce för Personliga Produkter

## Projektöversikt
En e-commerce webbplats där användare kan ladda upp egna bilder, anpassa designen på produkter, se en förhandsvisning och beställa tryck på olika artiklar som muggar, t-shirts, hoodies, posters, mobilskal, tygkassar, kalendrar, namnlappar och fotoalbum.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI, React Router, Google Fonts
- **Backend**: FastAPI, Motor (MongoDB async driver)
- **Databas**: MongoDB
- **Authentication**: JWT-baserad (user + admin)
- **Betalning**: Stripe (testläge)
- **3D**: @react-three/fiber, @react-three/drei (mugg-förhandsvisning)

## Vad som har implementerats

### Slutfört
1. **Backend API** (server.py ~1200+ rader)
   - JWT-autentisering + Admin-autentisering
   - Produkt, Varukorg, Design, Order CRUD
   - Admin-API (stats, users, products, orders, payments)
   - Stripe-checkout (testläge)
   - 17 produkter (muggar, t-shirts, hoodies, posters, mobilskal, tygkassar, kalendrar, namnlappar, fotoalbum)
   - Startup hook - seedar bara om DB är helt tom

2. **Frontend Sidor**
   - Hemsida
   - Produktsida med filter/sortering
   - Produktdetaljer - 3D för muggar, produktbild för specialprodukter
   - Designverktyg med 3D mugg-förhandsvisning
   - Kalender-editor (12 månader)
   - Namnskylts-editor (namly.se-inspirerad, tab-baserad)
   - **Fotoalbum-editor** (NYTT 2026-03-23): Multi-sida editor med:
     - 20 default-sidor, min 10, max 80
     - Drag & drop bilduppladdning per sida
     - Lägg till/ta bort sidor dynamiskt (+2, +10)
     - Sidnavigering + miniatyrvy
     - Storleksval (A4 Liggande/Stående, A5 Kvadrat, 30x30cm)
     - Extra sidkostnad (5 kr/sida utöver 20)
     - Prisuträkning med antal och extra sidor
   - Varukorg, Kassa, Registrering, Inloggning, Konto
   - **Navbar**: Produkter, Muggar, T-shirts, Posters, Namnlappar, Kalendrar, Fotoalbum

3. **Admin Panel** (/admin)
   - Dashboard, Produkthantering (inkl. Namnskylt-typ), Användarhantering, Orderhantering, Betalningsinställningar

### Pågående / Nästa steg (P1)
1. **Stripe Checkout** - Komplett betalningsflöde
2. **Kundkonto** - Orderhistorik, sparade designer

### Framtida uppgifter (P2)
1. **E-postbekräftelse** - Integrera riktig e-posttjänst
2. **Klarna/Swish** - Aktivera svenska betalningsmetoder
3. **Backend-refaktorisering** - Bryt ut server.py till moduler
4. **Produktbilder** - Byt ut stockfoton mot relevanta bilder

## Credentials
- **Admin**: admin@printout.se / PrintoutAdmin2024!
- **User**: Registrera via /registrera

## Test Status (2026-03-23)
- Iteration 1: Core app - PASS
- Iteration 2: NameTagEditor - 100% (19/19)
- Iteration 3: PhotoAlbumEditor - 100% (17/17)

## Preview URL
https://printout-lab.preview.emergentagent.com
