# Printout - E-commerce för Personliga Produkter

## Projektöversikt
En e-commerce webbplats där användare kan ladda upp egna bilder, anpassa designen på produkter, se en förhandsvisning och beställa tryck på olika artiklar som muggar, t-shirts, hoodies, posters, mobilskal och tygkassar.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI, React Router
- **Backend**: FastAPI, Motor (MongoDB async driver)
- **Databas**: MongoDB
- **Authentication**: JWT-baserad
- **Betalning**: Stripe (testläge)
- **E-post**: Resend (MOCKAD - loggar till konsol)

## Vad som har implementerats

### ✅ Slutfört (2026-03-19)
1. **Backend API** (server.py)
   - JWT-autentisering (register, login, profil)
   - Produkt-API (lista, detaljer, kategorier)
   - Varukorg-API (CRUD-operationer)
   - Design-API (skapa, uppdatera, radera)
   - Order-API (skapa, hämta)
   - Stripe-checkout integration (testläge)
   - 9 produkter seedade i databasen
   - 5 kundrecensioner seedade

2. **Frontend Pages**
   - Hemsida med hero, kategorier, recensioner, CTA
   - Produktsida med filter och sortering
   - Produktdetaljer med bildförhandsvisning
   - Varukorgssida
   - Kassasida
   - Registrering och inloggning
   - Kontosida

3. **Kritisk buggfix**
   - Löst "Mixed Content" HTTP/HTTPS-problem med Content-Security-Policy header
   - Ersatt 3D-förhandsvisning med 2D-bildförhandsvisning (babel-pluginkonfikt)

### 🔄 Pågående / Nästa steg (P1)
1. **Designverktyg** - Bilduppladdning, drag/drop, zoom, rotation på produkten
2. **Förbättrad bildförhandsvisning** - Färgöverlägg som fungerar bättre
3. **Stripe Checkout** - Komplett betalningsflöde med webhook-hantering

### 📋 Framtida uppgifter (P2)
1. **Kundkonto** - Spara designer, visa orderhistorik, ladda ner kvitton
2. **E-postbekräftelse** - Integrera Resend API för riktiga e-postutskick
3. **3D-förhandsvisning** - Återaktivera React Three Fiber när babel-konflikten lösts
4. **Klarna/Swish** - Implementera svenska betalningsmetoder
5. **Admin-panel** - Hantera produkter och ordrar

## API Endpoints

### Authentication
- `POST /api/auth/register` - Registrera ny användare
- `POST /api/auth/login` - Logga in
- `GET /api/auth/me` - Hämta profil

### Products
- `GET /api/products/` - Alla produkter
- `GET /api/products/{id}` - Enskild produkt
- `GET /api/products/categories` - Kategorier

### Cart
- `GET /api/cart/{session_id}` - Hämta varukorg
- `POST /api/cart/{session_id}/items` - Lägg till
- `DELETE /api/cart/{session_id}/items/{item_id}` - Ta bort

### Orders
- `POST /api/payments/checkout` - Skapa checkout
- `GET /api/payments/status/{session_id}` - Betalstatus

## Databas Schema
- **users**: email, name, password_hash
- **products**: name, category, price, images[], colors[], sizes[], model_type
- **carts**: session_id, items[]
- **orders**: user_id, email, items[], total, status, payment_status
- **designs**: user_id, product_id, config, preview_image

## Test Status
- Backend: 100% (21/21 tester)
- Frontend: 100% (7/7 tester)

## Kända begränsningar
- 3D-förhandsvisning inaktiverad (babel-pluginkonflikt)
- Vissa Unsplash-bilder blockeras av ORB
- Stripe i testläge (sk_test_emergent)
- E-post loggas till konsol (ej riktig e-post)

## Preview URL
https://printout-lab.preview.emergentagent.com
