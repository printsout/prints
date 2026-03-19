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
   - JWT-autentisering (register, login, profil)
   - Admin-autentisering (separat login)
   - Produkt-API (lista, detaljer, kategorier)
   - Varukorg-API (CRUD-operationer)
   - Design-API (skapa, uppdatera, radera)
   - Order-API (skapa, hämta)
   - Admin-API (stats, users, products, orders, payments CRUD)
   - Stripe-checkout integration (testläge)
   - 16 produkter seedade (muggar, t-shirts, hoodies, posters, mobilskal, tygkassar, kalendrar, namnlappar)

2. **Frontend Sidor**
   - Hemsida med hero, kategorier, recensioner, CTA
   - Produktsida med filter och sortering
   - Produktdetaljer - visar 3D för muggar, produktbild för namnlappar/kalendrar
   - Designverktyg med 3D mugg-förhandsvisning
   - Kalender-editor (12 månader, bilduppladdning per månad)
   - **Namnskylts-editor (OMDESIGNAD 2026-03-19)** - Matchar namly.se-design
   - Varukorgssida, Kassasida, Registrering, Inloggning, Kontosida
   - **Navbar med alla kategorier** (Produkter, Muggar, T-shirts, Posters, Namnlappar, Kalendrar)

3. **Admin Panel** (/admin)
   - Dashboard, Produkthantering, Användarhantering, Orderhantering, Betalningsinställningar

4. **Buggfixar (2026-03-19)**
   - Löst "Mixed Content" HTTP/HTTPS-problem
   - Fixat ProductDetail: visar produktbild istället för 3D-mugg för namnlappar/kalendrar
   - Lagt till Namnlappar + Kalendrar i navigeringsmenyn
   - Lagt till namnlappsprodukter i seed-funktionen
   - Fixat addItem → addToCart i NameTagEditor

### Pågående / Nästa steg (P1)
1. **Stripe Checkout** - Komplett betalningsflöde med frontend-integration
2. **Varukorgs-integration för specialeditorer** - Kalender + Namnskylt → varukorg
3. **Kundkonto** - Orderhistorik, sparade designer

### Framtida uppgifter (P2)
1. **E-postbekräftelse** - Integrera riktig e-posttjänst
2. **Klarna/Swish** - Aktivera svenska betalningsmetoder
3. **Backend-refaktorisering** - Bryt ut server.py till moduler
4. **Produktbilder** - Byt ut stockfoton mot relevanta namnlapps-bilder

## Credentials
- **Admin**: admin@printout.se / PrintoutAdmin2024!
- **User**: Registrera via /registrera

## Test Status (2026-03-19)
- Iteration 1: Core app stability - PASS
- Iteration 2: NameTagEditor redesign - 100% (19/19 frontend tests)
- Manual flow test: Navbar → Namnlappar → Produkt → Editor - PASS

## Preview URL
https://printout-lab.preview.emergentagent.com
