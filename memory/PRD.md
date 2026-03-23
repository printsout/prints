# Printsout - E-commerce för Personliga Produkter

## Projektöversikt
En e-commerce webbplats där användare kan ladda upp egna bilder, anpassa designen på produkter, se en förhandsvisning och beställa tryck på olika artiklar.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI, React Router, Google Fonts
- **Backend**: FastAPI, Motor (MongoDB), bleach (sanitering), slowapi (rate limiting)
- **Databas**: MongoDB
- **Auth**: JWT (8h timeout) + bcrypt
- **Betalning**: Stripe Checkout (live-redo, testat med test-nycklar)
- **3D**: @react-three/fiber, @react-three/drei

## Implementerat

### Core Features
- Hemsida, Produktsida, Produktdetaljer, 3D mugg-preview
- Kalender-editor (12 månader med bilduppladdning)
- Namnskylts-editor (namly.se-stil, tab-baserad, förnamn, efternamn, telefonnummer, 50+ färgade motiv inkl. häst och sport)
- Fotoalbum-editor (multi-bild per sida, 5 layouter)
- Design-editor (muggar, t-shirts, posters med bilduppladdning, text, position)
- Varukorg med anpassningsdetaljer, Kassa med Stripe redirect
- Auth (register/login), Konto
- Admin Panel (dashboard, produkter, användare, ordrar, betalningar, innehåll, skatt, recensioner)
- Dropdown produktmeny i navbar (9 kategorier)
- Footer-länkar kopplade till admin-innehåll (7 sidor)
- Orderbekräftelsesida med polling av betalningsstatus
- Cookie-banner med localStorage
- Frakt/rabatt/moms-system med admin-toggle
- Rabattkod-system (skapa, aktivera/inaktivera, ta bort)
- Skatteövervakningssida (AdminTax) med CSV-export

### Recensionshantering (2026-03-23)
- Admin CRUD för kundrecensioner (skapa, redigera, radera)
- Betyg med stjärnor (1-5), recensionstext, kundnamn, källa
- Externa recensionsplattformar: Google Reviews, Trustpilot, Facebook, Yelp, Prisjakt, Reco.se, Annan
- Plattformslänkar visas på hemsidan med ikoner och färger
- Källa-badge visas på recensioner från externa plattformar
- Backend: CRUD endpoints + review-platforms settings

### Namnlappar - Uppdateringar (2026-03-23)
- Nya fält: Efternamn och Telefonnummer (valfritt)
- Färgade motiv-ikoner (varje ikon har unik färg)
- 14 nya sportmotiv + häst + fotboll (custom SVG-ikoner)
- Tassavtryck djurmotiv

### Stripe Checkout - KOMPLETT
- Backend skapar Stripe Checkout Session
- Frontend omdirigerar kund till Stripe betalningssida
- Webhook-hantering för betalningsbekräftelse

### Säkerhet
- Rate limiting, Security headers, Input-sanitering (bleach)
- Lösenordskrav, JWT 8h timeout, Admin-lösenord hashad i .env

## Pågående
- Ingen aktiv uppgift

## Framtida (P1-P2)
1. Backend-refaktorisering (server.py ~1750 rader behöver brytas upp)
2. Databasbyte (användaren nämnde byte till annan databas)
3. E-postbekräftelse vid beställning
4. Klarna/Swish betalningar
5. Fixa Unsplash/ORB bildproblem

## Credentials
- **Admin**: admin@printsout.se / PrintoutAdmin2024!
- **User**: Registrera via /registrera

## Preview URL
https://printout-lab.preview.emergentagent.com
