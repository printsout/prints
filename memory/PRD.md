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
1. **Backend API** (server.py ~1100+ rader)
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
   - Produktdetaljer med bildförhandsvisning
   - Designverktyg med 3D mugg-förhandsvisning
   - Kalender-editor (12 månader, bilduppladdning per månad)
   - **Namnskylts-editor (OMDESIGNAD 2026-03-19)** - Matchar namly.se-design med:
     - Tab-baserad navigering (Text, Motiv, Bakgrund)
     - 12 Google Fonts (Moonlight, Minya, Roddy, Pupcat, Octin, Roboto, Josefine, Bubbly, Zigzag, Aktivo, Marker, Striker)
     - 24 typsnittsfärger
     - 40 motiv i 8 kategorier (Populära, Alla, Djur, Natur, Fordon, Sport, Roligt, Mat)
     - 44 bakgrunder i 5 kategorier (Populära, Färger, Alla, Pastell, Gradient)
     - Bilduppladdning för anpassade motiv
     - Live-förhandsvisning med mini-grid
     - Motiv på/av-toggle
     - Återställ design-knapp
   - Varukorgssida
   - Kassasida
   - Registrering och inloggning
   - Kontosida

3. **Admin Panel** (/admin)
   - Dashboard med statistik
   - Produkthantering (CRUD)
   - Användarhantering
   - Orderhantering
   - Betalningsinställningar (Stripe, Klarna, Swish)
   - Innehållshantering

4. **Buggfixar**
   - Löst "Mixed Content" HTTP/HTTPS-problem med CSP header
   - Fixat saknade lucide-react-ikoner (Move, ZoomIn)
   - Fixat ORB-problem för vissa bilder

### Pågående / Nästa steg (P1)
1. **Stripe Checkout** - Komplett betalningsflöde med frontend-integration
2. **Varukorgs-integration för specialeditorer** - Kalender + Namnskylt → varukorg
3. **Kundkonto** - Orderhistorik, sparade designer

### Framtida uppgifter (P2)
1. **E-postbekräftelse** - Integrera riktig e-posttjänst
2. **Klarna/Swish** - Aktivera svenska betalningsmetoder
3. **Backend-refaktorisering** - Bryt ut server.py till moduler (routes, models, services)
4. **Bildladdningsproblem** - Granska alla produkt-bild-URL:er

## API Endpoints

### Authentication
- `POST /api/auth/register` - Registrera ny användare
- `POST /api/auth/login` - Logga in
- `GET /api/auth/me` - Hämta profil

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Dashboard-statistik
- `GET/POST/PUT/DELETE /api/admin/users` - Användarhantering
- `GET/POST/PUT/DELETE /api/admin/products` - Produkthantering
- `GET /api/admin/orders` - Orderhantering
- `GET/POST /api/admin/payment-settings` - Betalningsinställningar

### Products
- `GET /api/products/` - Alla produkter
- `GET /api/products/{id}` - Enskild produkt

### Cart
- `GET /api/cart/{session_id}` - Hämta varukorg
- `POST /api/cart/{session_id}/items` - Lägg till
- `PUT /api/cart/{session_id}/items/{item_id}` - Uppdatera antal
- `DELETE /api/cart/{session_id}/items/{item_id}` - Ta bort

### Orders
- `POST /api/orders/create-payment-intent` - Skapa betalning

## Databas Schema
- **users**: email, hashed_password, name, role (user/admin)
- **products**: name, description, price, category, imageUrl, productType (standard/calendar/nametag)
- **carts**: session_id, items[]
- **orders**: user_id, email, items[], total, status, payment_status
- **designs**: user_id, product_id, config, preview_image
- **payment_settings**: provider, config

## Credentials
- **Admin**: admin@printout.se / PrintoutAdmin2024!
- **User**: Registrera via /registrera

## Test Status (2026-03-19)
- Iteration 1: Core app stability - PASS
- Iteration 2: NameTagEditor redesign - 100% (19/19 frontend tests passed)

## Kända begränsningar
- Vissa Unsplash-bilder kan blockeras av ORB
- Stripe i testläge
- E-post loggas till konsol (MOCKAD)
- Checkout-flöde ej komplett

## Preview URL
https://printout-lab.preview.emergentagent.com
