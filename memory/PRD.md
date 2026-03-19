# Printout - E-commerce för Personliga Produkter

## Projektöversikt
En e-commerce webbplats där användare kan ladda upp egna bilder, anpassa designen på produkter, se en förhandsvisning och beställa tryck på olika artiklar som muggar, t-shirts, hoodies, posters, mobilskal, tygkassar, kalendrar och namnlappar.

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
   - 16 produkter seedade
   - **Startup hook** - seedar bara om DB är helt tom

2. **Frontend Sidor**
   - Hemsida (utan auto-reseed)
   - Produktsida med filter/sortering
   - Produktdetaljer - 3D för muggar, produktbild för namnlappar/kalendrar
   - Designverktyg med 3D mugg-förhandsvisning
   - Kalender-editor (12 månader)
   - **Namnskylts-editor** (namly.se-inspirerad)
   - Varukorg, Kassa, Registrering, Inloggning, Konto
   - **Navbar med alla kategorier** (Produkter, Muggar, T-shirts, Posters, Namnlappar, Kalendrar)

3. **Admin Panel** (/admin)
   - Dashboard, Produkthantering (med Namnskylt-typ), Användarhantering, Orderhantering, Betalningsinställningar

4. **Buggfixar (2026-03-19)**
   - Löst "Mixed Content" HTTP/HTTPS-problem
   - Fixat ProductDetail: visar produktbild för namnlappar/kalendrar
   - Lagt till Namnlappar + Kalendrar i navigeringen
   - **Fixat admin delete-bugg**: Borttagna produkter återskapades inte vid hemsidesbesök
   - Flyttat init_data från Home.js till backend startup
   - Lagt till "Namnskylt" som produkttyp i admin

### Pågående / Nästa steg (P1)
1. **Stripe Checkout** - Komplett betalningsflöde
2. **Varukorgs-integration för specialeditorer** - Kalender → varukorg
3. **Kundkonto** - Orderhistorik, sparade designer

### Framtida uppgifter (P2)
1. **E-postbekräftelse** - Integrera riktig e-posttjänst
2. **Klarna/Swish** - Aktivera svenska betalningsmetoder
3. **Backend-refaktorisering** - Bryt ut server.py till moduler
4. **Produktbilder** - Byt ut stockfoton mot relevanta bilder
5. **Premium Poster trasig bild** - Bild laddas inte korrekt

## Credentials
- **Admin**: admin@printout.se / PrintoutAdmin2024!
- **User**: Registrera via /registrera

## Test Status (2026-03-19)
- Iteration 1: Core app - PASS
- Iteration 2: NameTagEditor redesign - 100% (19/19)
- Admin delete flow: Manuellt verifierad via API + UI

## Preview URL
https://printout-lab.preview.emergentagent.com
